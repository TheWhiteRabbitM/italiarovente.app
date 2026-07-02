import { annoOgImage } from "@/lib/og-images";

export const alt = "My climate · Italia Rovente";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ShareImageEn({
  params,
}: {
  params: Promise<{ slug: string; anno: string }>;
}) {
  const { slug, anno } = await params;
  return annoOgImage(slug, anno, "en");
}
