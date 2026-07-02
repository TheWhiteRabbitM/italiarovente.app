import {
  homeOgImage,
  OG_HOME_ALT,
  OG_HOME_CONTENT_TYPE,
  OG_HOME_SIZE,
} from "@/lib/og-home";

export const alt = OG_HOME_ALT.en;
export const size = OG_HOME_SIZE;
export const contentType = OG_HOME_CONTENT_TYPE;

export default function OpengraphImage() {
  return homeOgImage("en");
}
