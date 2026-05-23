// GET /rfcs/ — HTML index of all published RFCs.

import { htmlEscape, layoutHtml, htmlResponse } from "../_lib.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const { results } = await env.DB.prepare(
    `SELECT rfc_number, rfc_kind, rfc_version, title, status, created_at
       FROM rfcs
      WHERE superseded_by_id IS NULL
        AND status = 'active'
      ORDER BY rfc_number ASC`
  ).all();

  const items = (results || [])
    .map(
      (r) => `<li>
    <span class="num">#${htmlEscape(r.rfc_number)}</span>
    <a class="title" href="/rfcs/${htmlEscape(r.rfc_number)}">${htmlEscape(
      r.title
    )}</a>
    <span class="v">~${htmlEscape(r.rfc_version)}</span>
  </li>`
    )
    .join("\n");

  const body = `
  <h1>RFCs</h1>
  <p class="rfc-meta">A public, citable commons of principles for agentic
  systems. Each RFC is content-addressed; cite with the
  <code>(agentprinciples.org, &lt;n&gt;, ~&lt;hash&gt;)</code> form.</p>
  <ul class="rfc-list">
    ${items || "<li><em>No RFCs published yet.</em></li>"}
  </ul>
  <p class="footer"><a href="/api/v1/rfcs/">JSON projection</a> ·
  <a href="/feed/rfcs.xml">RSS feed</a></p>
  `;

  const url = new URL(request.url);
  return htmlResponse(
    layoutHtml({
      title: "RFCs — agentprinciples.org",
      description:
        "Index of all published RFCs on the agentprinciples.org public principles commons.",
      body,
      canonical: `${url.origin}/rfcs/`,
    })
  );
}
