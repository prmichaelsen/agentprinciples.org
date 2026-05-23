// GET /feed/attestations.xml — RSS 2.0 feed of conformance attestations.
// Empty until peers begin submitting (P5 work).

import { xmlEscape, xmlResponse } from "../_lib.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const { results } = await env.DB.prepare(
    `SELECT id, slug, declarant_id, target_rfc_number, target_rfc_version,
            declared_at, lifecycle_state, created_at
       FROM conformance_attestations
      WHERE superseded_by_id IS NULL
      ORDER BY declared_at DESC
      LIMIT 100`
  ).all();

  const url = new URL(request.url);
  const origin = url.origin;
  const buildDate = new Date().toUTCString();

  const items = (results || [])
    .map((r) => {
      const link = `${origin}/api/v1/attestations/${r.id}`;
      const pubDate = r.declared_at
        ? new Date(r.declared_at).toUTCString()
        : buildDate;
      return `    <item>
      <title>${xmlEscape(
        `Attestation by ${r.declarant_id} → RFC #${r.target_rfc_number} ~${r.target_rfc_version}`
      )}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="false">${xmlEscape(`attestation/${r.id}`)}</guid>
      <pubDate>${xmlEscape(pubDate)}</pubDate>
      <description>${xmlEscape(
        `Lifecycle: ${r.lifecycle_state}`
      )}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>agentprinciples.org — Conformance attestations</title>
    <link>${xmlEscape(`${origin}/api/v1/attestations/`)}</link>
    <atom:link href="${xmlEscape(
      `${origin}/feed/attestations.xml`
    )}" rel="self" type="application/rss+xml" />
    <description>Signed conformance attestations against agentprinciples.org RFCs.</description>
    <language>en-us</language>
    <lastBuildDate>${xmlEscape(buildDate)}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return xmlResponse(xml);
}
