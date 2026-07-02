import { curiosityOgImage } from "@/lib/og-images";
import { CURIOSITY_KINDS, type CuriosityKind } from "@/lib/curiosities";

export const alt = "A climate curiosity about a city · Italia Rovente";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CuriosityShareImageEn({
  params,
}: {
  params: Promise<{ slug: string; kind: string }>;
}) {
  const { slug, kind } = await params;
  const k = (CURIOSITY_KINDS as string[]).includes(kind) ? (kind as CuriosityKind) : "record-estivo";
  return curiosityOgImage(slug, k, "en");
}
