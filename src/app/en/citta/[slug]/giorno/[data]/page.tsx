import { renderGiornoPage, generateMetadataEn } from "@/app/citta/[slug]/giorno/[data]/page";

export const revalidate = 86400;

export const generateMetadata = generateMetadataEn;

export default async function EnglishGiornoPage({
  params,
}: {
  params: Promise<{ slug: string; data: string }>;
}) {
  const { slug, data } = await params;
  return renderGiornoPage(slug, data, "en");
}
