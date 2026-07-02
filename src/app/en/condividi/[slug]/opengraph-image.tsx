import { cityOgImage } from "@/lib/og-images";

export const alt = "The city's climate · Italia Rovente";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CityShareImageEn({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return cityOgImage(slug, "en");
}
