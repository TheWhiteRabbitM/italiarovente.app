import { getEvents } from "@/lib/eventlog";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const events = await getEvents();

  const items = events
    .map((e) => {
      const url = `${SITE_URL}${e.en.url}`;
      const pubDate = new Date(e.date).toUTCString();
      return `  <item>
    <title>${xmlEscape(e.en.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="false">${xmlEscape(e.date)}-${xmlEscape(e.type)}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${xmlEscape(e.en.body)}</description>
  </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Italia Rovente — What's new</title>
    <link>${SITE_URL}/en</link>
    <description>New heat records, incoming heatwaves and the monthly climate recap for Italy — detected automatically from ERA5/ECMWF data, no narrative.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
