// GET /feed/rfcs.xml — RSS 2.0 feed of all published RFCs.

import { xmlEscape, xmlResponse } from "../_lib.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const { results } = await env.DB.prepare(
    `SELECT id, rfc_number, rfc_kind, rfc_version, title, status,
            principle_text, framing, created_at, updated_at
       FROM rfcs
      WHERE superseded_by_id IS NULL
        AND status = 'active'
      ORDER BY rfc_number ASC`
  ).all();

  const url = new URL(request.url);
  const origin = url.origin;
  const buildDate = new Date().toUTCString();

  const items = (results || [])
    .map((r) => {
      const link = `${origin}/rfcs/${r.rfc_number}`;
      const pubDate = r.created_at
        ? new Date(r.created_at).toUTCString()
        : buildDate;
      const desc =
        (r.rfc_kind === "principle" ? r.principle_text : r.framing) || "";
      const truncated =
        desc.length > 400 ? desc.slice(0, 400) + "…" : desc;
      return `    <item>
      <title>${xmlEscape(`RFC #${r.rfc_number}: ${r.title}`)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="false">${xmlEscape(
        `agentprinciples.org/rfcs/${r.rfc_number}@${r.rfc_version}`
      )}</guid>
      <pubDate>${xmlEscape(pubDate)}</pubDate>
      <description>${xmlEscape(truncated)}</description>
      <category>${xmlEscape(r.rfc_kind)}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>agentprinciples.org — RFCs</title>
    <link>${xmlEscape(`${origin}/rfcs/`)}</link>
    <atom:link href="${xmlEscape(
      `${origin}/feed/rfcs.xml`
    )}" rel="self" type="application/rss+xml" />
    <description>Public principles commons for agentic systems. RFC publications.</description>
    <language>en-us</language>
    <lastBuildDate>${xmlEscape(buildDate)}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return xmlResponse(xml);
}
