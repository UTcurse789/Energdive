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

  return {
    title: {
      absolute: `${resource.title} | ENERGDIVE Resource Center`,
    },
    description:
      resource.description ||
      "Download this ENERGDIVE event resource from the Resource Center.",
    alternates: {
      canonical: `https://www.energdive.com/resource-center/${resource.slug}`,
    },
    openGraph: {
      title: resource.title,
      description:
        resource.description ||
        "Download this ENERGDIVE event resource from the Resource Center.",
      url: `https://www.energdive.com/resource-center/${resource.slug}`,
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
      description:
        resource.description ||
        "Download this ENERGDIVE event resource from the Resource Center.",
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
}: ResourceCenterDetailPageProps) {
  const { slug } = await params;
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
      event={event}
      relatedResources={relatedResources}
      resource={resource}
    />
  );
}
