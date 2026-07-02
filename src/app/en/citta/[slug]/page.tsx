import { renderCityPage, generateMetadataEn } from "@/app/citta/[slug]/page";

export const revalidate = 3600;

export const generateMetadata = generateMetadataEn;

export default async function EnglishCityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderCityPage(slug, "en");
}
