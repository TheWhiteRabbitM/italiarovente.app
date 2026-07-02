import { generateMetadataEn, renderCuriosityPage } from "@/app/condividi/curiosita/[slug]/[kind]/page";

export const generateMetadata = generateMetadataEn;

export default async function EnglishCondividiCuriositaPage({
  params,
}: {
  params: Promise<{ slug: string; kind: string }>;
}) {
  const { slug, kind } = await params;
  return renderCuriosityPage(slug, kind, "en");
}
