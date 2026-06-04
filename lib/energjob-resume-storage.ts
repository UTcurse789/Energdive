import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

type AllowedResumeMime = keyof typeof ALLOWED_RESUME_TYPES;

type R2Config = {
  bucketName: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  signingSecret: string;
};

type ResumeObjectDetails = {
  fileName: string;
  objectKey: string;
};

function getR2Config(): R2Config {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "";
  const region = process.env.CLOUDFLARE_R2_REGION || "auto";
  const endpoint = process.env.CLOUDFLARE_R2_S3_API_URL || "";
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
  const signingSecret =
    process.env.ENERGJOB_RESUME_SIGNING_SECRET || secretAccessKey;

  if (
    !bucketName ||
    !endpoint ||
    !accessKeyId ||
    !secretAccessKey ||
    !signingSecret
  ) {
    throw new Error(
      "Cloudflare R2 resume storage is not configured. Set CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_S3_API_URL, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and ENERGJOB_RESUME_SIGNING_SECRET."
    );
  }

  return {
    bucketName,
    region,
    endpoint: endpoint.replace(/\/$/, ""),
    accessKeyId,
    secretAccessKey,
    signingSecret,
  };
}

function sha256Hex(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function canonicalUri(pathname: string) {
  return pathname
    .split("/")
    .map((segment) => encodeRfc3986(segment))
    .join("/")
    .replace(/%2F/g, "/");
}

function buildObjectUrl(objectKey: string) {
  const config = getR2Config();
  const safeKey = objectKey
    .split("/")
    .map((segment) => encodeRfc3986(segment))
    .join("/");
  const bucketPath = `/${config.bucketName}`;
  const endpointHasBucket = new URL(config.endpoint).pathname.endsWith(bucketPath);
  const base = endpointHasBucket
    ? config.endpoint
    : `${config.endpoint}/${config.bucketName}`;
  return `${base}/${safeKey}`;
}

async function signedR2Fetch(
  method: "GET" | "PUT",
  objectKey: string,
  options?: {
    body?: Buffer;
    contentType?: string;
  }
) {
  const config = getR2Config();
  const url = new URL(buildObjectUrl(objectKey));
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const body = options?.body ?? Buffer.alloc(0);
  const payloadHash = sha256Hex(body);
  const host = url.host;

  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n");
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    method,
    canonicalUri(url.pathname),
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${config.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, config.region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const headers: HeadersInit = {
    Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (options?.contentType) {
    headers["Content-Type"] = options.contentType;
  }

  return fetch(url, {
    method,
    headers,
    body: method === "PUT" ? new Uint8Array(body) : undefined,
    cache: "no-store",
  });
}

function normalizeFileName(fileName: string, mimeType: AllowedResumeMime) {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const cleanedBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const ext = ALLOWED_RESUME_TYPES[mimeType];
  return `${cleanedBase || "resume"}.${ext}`;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signResumeLinkPayload(payload: string) {
  const { signingSecret } = getR2Config();
  return createHmac("sha256", signingSecret).update(payload).digest("base64url");
}

function deriveFileNameFromObjectKey(objectKey: string) {
  const lastSegment = objectKey.split("/").pop() || "resume";
  const cleaned = lastSegment.replace(/^\d+-[0-9a-f-]{36}-/i, "");
  return cleaned || lastSegment;
}

function buildCompactResumeProxyUrl(args: {
  appUrl: string;
  objectKey: string;
}) {
  const key = args.objectKey;
  const sig = signResumeLinkPayload(key);
  const query = new URLSearchParams({
    k: key,
    s: sig,
  });

  return `${args.appUrl.replace(/\/$/, "")}/api/energjob/resume?${query.toString()}`;
}

export function validateResumeFile(file: File) {
  const mimeType = file.type as AllowedResumeMime;

  if (!(mimeType in ALLOWED_RESUME_TYPES)) {
    throw new Error("Only PDF, JPEG, and PNG resumes are allowed.");
  }

  if (file.size > MAX_RESUME_BYTES) {
    throw new Error("Resume file size must be 5MB or less.");
  }

  return mimeType;
}

export async function uploadResumeToR2(args: {
  clerkUserId: string;
  file: File;
}) {
  const mimeType = validateResumeFile(args.file);
  const fileName = normalizeFileName(args.file.name, mimeType);
  const objectKey = [
    "energjob",
    "resumes",
    args.clerkUserId,
    `${Date.now()}-${crypto.randomUUID()}-${fileName}`,
  ].join("/");

  const buffer = Buffer.from(await args.file.arrayBuffer());
  const response = await signedR2Fetch("PUT", objectKey, {
    body: buffer,
    contentType: mimeType,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resume upload failed: ${message || response.statusText}`);
  }

  return {
    fileName,
    objectKey,
    size: args.file.size,
    mimeType,
  };
}

export function buildResumeProxyUrl(args: {
  appUrl: string;
  fileName: string;
  objectKey: string;
}) {
  return buildCompactResumeProxyUrl({
    appUrl: args.appUrl,
    objectKey: args.objectKey,
  });
}

export function parseAndVerifyResumeUrl(urlValue: string): ResumeObjectDetails | null {
  let parsed: URL;
  try {
    parsed = new URL(urlValue);
  } catch {
    return null;
  }

  const compactKey = parsed.searchParams.get("k");
  const compactSig = parsed.searchParams.get("s");
  if (compactKey && compactSig) {
    const expectedSig = signResumeLinkPayload(compactKey);
    const actualBuffer = Buffer.from(compactSig);
    const expectedBuffer = Buffer.from(expectedSig);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    return {
      fileName: deriveFileNameFromObjectKey(compactKey),
      objectKey: compactKey,
    };
  }

  const encodedKey = parsed.searchParams.get("key");
  const encodedName = parsed.searchParams.get("name");
  const sig = parsed.searchParams.get("sig");

  if (!encodedKey || !encodedName || !sig) {
    return null;
  }

  const payload = `${encodedKey}.${encodedName}`;
  const expectedSig = signResumeLinkPayload(payload);

  const actualBuffer = Buffer.from(sig);
  const expectedBuffer = Buffer.from(expectedSig);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  return {
    fileName: base64UrlDecode(encodedName),
    objectKey: base64UrlDecode(encodedKey),
  };
}

export function normalizeResumeProxyUrl(urlValue: string, appUrl?: string) {
  const details = parseAndVerifyResumeUrl(urlValue);
  if (!details) {
    return urlValue;
  }

  const targetAppUrl =
    appUrl ||
    (() => {
      try {
        return new URL(urlValue).origin;
      } catch {
        return "";
      }
    })();

  if (!targetAppUrl) {
    return urlValue;
  }

  return buildCompactResumeProxyUrl({
    appUrl: targetAppUrl,
    objectKey: details.objectKey,
  });
}

export async function fetchResumeFromR2(objectKey: string) {
  const response = await signedR2Fetch("GET", objectKey);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resume fetch failed: ${message || response.statusText}`);
  }

  return response;
}
