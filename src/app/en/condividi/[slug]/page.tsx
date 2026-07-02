import { renderCondividiCittaPage, generateMetadataEn } from "@/app/condividi/[slug]/page";

export const generateMetadata = generateMetadataEn;

export default async function EnglishCondividiCittaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderCondividiCittaPage(slug, "en");
}
