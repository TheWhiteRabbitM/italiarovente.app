import { renderEmbedPage, generateMetadataEn } from "@/app/embed/[slug]/page";

export const dynamic = "force-dynamic";

export const generateMetadata = generateMetadataEn;

export default async function EnglishEmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderEmbedPage(slug, "en");
}
