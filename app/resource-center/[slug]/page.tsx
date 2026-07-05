import { redirect } from "next/navigation";

type ResourceCenterRedirectPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    download?: string | string[];
  }>;
};

export default async function ResourceCenterDetailRedirectPage({
  params,
  searchParams,
}: ResourceCenterRedirectPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const downloadParam = Array.isArray(resolvedSearchParams?.download)
    ? resolvedSearchParams?.download[0]
    : resolvedSearchParams?.download;
  const downloadQuery = downloadParam ? `?download=${encodeURIComponent(downloadParam)}` : "";

  redirect(`/resource-hub/${encodeURIComponent(slug)}${downloadQuery}`);
}
