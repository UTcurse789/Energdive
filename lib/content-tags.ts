export type OpinionContentKind = "opinion" | "interview" | "editorial";

function unwrapRelation(value: any): any {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value.map(unwrapRelation).filter(Boolean);
  }

  if (Array.isArray(value.data)) {
    return value.data.map(unwrapRelation).filter(Boolean);
  }

  if (value.data) {
    return unwrapRelation(value.data);
  }

  if (value.attributes) {
    return unwrapRelation(value.attributes);
  }

  return value;
}

export function extractContentTagTitle(contentTag: any): string | null {
  if (!contentTag) return null;

  const normalized = unwrapRelation(contentTag);

  if (Array.isArray(normalized)) {
    for (const item of normalized) {
      const title = extractContentTagTitle(item);
      if (title) return title;
    }
    return null;
  }

  const title =
    normalized?.title ??
    normalized?.Title ??
    normalized?.name ??
    normalized?.Name ??
    null;

  return typeof title === "string" && title.trim() ? title.trim() : null;
}

export function getOpinionContentKind(item: any): OpinionContentKind {
  const source = item?.attributes || item;
  const contentTag = extractContentTagTitle(source?.content_tag);
  const normalizedTag = contentTag?.toLowerCase().trim();

  if (normalizedTag === "interview") return "interview";
  if (normalizedTag === "editorial") return "editorial";
  return "opinion";
}

export function isInterviewContent(item: any): boolean {
  return getOpinionContentKind(item) === "interview";
}

export function isEditorialContent(item: any): boolean {
  return getOpinionContentKind(item) === "editorial";
}
