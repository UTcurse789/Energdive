import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceDetailPage } from "@/components/resource-center/resource-detail-page";
import {
  getResourceCenterData,
  getResourceCenterResource,
} from "@/lib/resource-center";

export const dynamic = "force-dynamic";

type ResourceCenterDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    download?: string | string[];
  }>;
};

export async function generateMetadata({
  params,
}: ResourceCenterDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceCenterResource(slug);

  if (!resource) {
    return {
      title: {
        absolute: "Resource Not Found | ENERGDIVE",
      },
    };
  }

  const metadataDescription =
    resource.shortDescription ||
    resource.description ||
    "Download this ENERGDIVE event resource from the Resource Hub.";

  return {
    title: {
      absolute: `${resource.title} | ENERGDIVE Resource Hub`,
    },
    description: metadataDescription,
    alternates: {
      canonical: `https://www.energdive.com/resource-hub/${resource.slug}`,
    },
    openGraph: {
      title: resource.title,
      description: metadataDescription,
      url: `https://www.energdive.com/resource-hub/${resource.slug}`,
      siteName: "ENERGDIVE",
      type: "article",
      images: resource.coverImageUrl
        ? [
            {
              url: resource.coverImageUrl,
              width: 1200,
              height: 630,
              alt: resource.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: resource.title,
      description: metadataDescription,
      images: resource.coverImageUrl ? [resource.coverImageUrl] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const { resources } = await getResourceCenterData();

  return resources.map((resource) => ({
    slug: resource.slug,
  }));
}

export default async function ResourceCenterDetailPage({
  params,
  searchParams,
}: ResourceCenterDetailPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const downloadParam = Array.isArray(resolvedSearchParams?.download)
    ? resolvedSearchParams?.download[0]
    : resolvedSearchParams?.download;
  const autoDownload = downloadParam === "true" || downloadParam === "1";
  const [resource, resourceCenterData] = await Promise.all([
    getResourceCenterResource(slug),
    getResourceCenterData(),
  ]);

  if (!resource) notFound();

  const event = resourceCenterData.events.find(
    (candidate) => candidate.id === resource.event_id
  );
  const relatedResources = resourceCenterData.resources
    .filter(
      (candidate) =>
        candidate.event_id === resource.event_id && candidate.slug !== resource.slug
    )
    .slice(0, 4);

  return (
    <ResourceDetailPage
      autoDownload={autoDownload}
      event={event}
      relatedResources={relatedResources}
      resource={resource}
    />
  );
}
