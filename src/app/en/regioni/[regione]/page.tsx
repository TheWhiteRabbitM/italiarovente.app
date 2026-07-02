import type { Metadata } from "next";
import {
  RegionePageContent,
  generateRegioneMetadata,
} from "@/app/regioni/[regione]/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ regione: string }>;
}): Promise<Metadata> {
  return generateRegioneMetadata({ params }, "en");
}

export default async function EnglishRegionePage({
  params,
}: {
  params: Promise<{ regione: string }>;
}) {
  return <RegionePageContent params={params} lang="en" />;
}
