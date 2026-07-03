import { getEvents } from "@/lib/eventlog";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Feed RSS 2.0 dei fatti rilevati automaticamente dal cron giornaliero:
// record assoluti battuti, ondate di calore in arrivo, recap mensile.
// Stessi eventi delle notifiche push, qui in forma pubblica e consultabile
// da chiunque (utenti, feed reader, bot) senza doversi iscrivere.
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
      const url = `${SITE_URL}${e.it.url}`;
      const pubDate = new Date(e.date).toUTCString();
      return `  <item>
    <title>${xmlEscape(e.it.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="false">${xmlEscape(e.date)}-${xmlEscape(e.type)}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${xmlEscape(e.it.body)}</description>
  </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Italia Rovente — Novità</title>
    <link>${SITE_URL}</link>
    <description>Record di caldo battuti, ondate di calore in arrivo e recap mensile del clima italiano — rilevati automaticamente dai dati ERA5/ECMWF, nessuna narrativa.</description>
    <language>it-it</language>
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
