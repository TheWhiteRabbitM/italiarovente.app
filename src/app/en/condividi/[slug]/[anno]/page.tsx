import { renderCondividiAnnoPage, generateMetadataEn } from "@/app/condividi/[slug]/[anno]/page";

export const generateMetadata = generateMetadataEn;

export default async function EnglishCondividiAnnoPage({
  params,
}: {
  params: Promise<{ slug: string; anno: string }>;
}) {
  const { slug, anno } = await params;
  return renderCondividiAnnoPage(slug, anno, "en");
}
