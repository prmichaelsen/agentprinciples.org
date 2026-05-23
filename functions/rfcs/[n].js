// GET /rfcs/<n> — HTML render of a single RFC projecting from D1.
// Implements the projection-engine pattern (SPP-2) for RFC publication.

import {
  htmlEscape,
  layoutHtml,
  htmlResponse,
  renderRfcBodyHtml,
} from "../_lib.js";

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const n = parseInt(params.n, 10);
  if (!Number.isInteger(n) || n < 0) {
    return htmlResponse(
      layoutHtml({
        title: "RFC not found — agentprinciples.org",
        description: "No such RFC.",
        body: "<h1>RFC not found</h1><p>That RFC number isn't valid.</p>",
      }),
      { status: 404 }
    );
  }

  // Latest active version (superseded_by_id IS NULL).
  const rfc = await env.DB.prepare(
    `SELECT id, rfc_number, rfc_kind, rfc_version, title, status,
            principle_text, behavioral_expectations,
            suite_membership, framing, cross_references, suite_members_json,
            created_at, updated_at, superseded_by_id
       FROM rfcs
      WHERE rfc_number = ?
        AND superseded_by_id IS NULL
        AND status = 'active'
      ORDER BY version DESC
      LIMIT 1`
  )
    .bind(n)
    .first();

  if (!rfc) {
    return htmlResponse(
      layoutHtml({
        title: "RFC not found — agentprinciples.org",
        description: "No such RFC.",
        body: `<h1>RFC not found</h1><p>RFC #${htmlEscape(
          n
        )} hasn't been published.</p>`,
      }),
      { status: 404 }
    );
  }

  const meta = `<div class="rfc-meta">RFC #${htmlEscape(
    rfc.rfc_number
  )} · ${htmlEscape(rfc.rfc_kind)} · <span class="version">v: ~${htmlEscape(
    rfc.rfc_version
  )}</span> · published ${htmlEscape((rfc.created_at || "").slice(0, 10))}</div>`;

  const body = `
  <h1>${htmlEscape(rfc.title)}</h1>
  ${meta}
  ${renderRfcBodyHtml(rfc)}
  <p class="footer"><a href="/rfcs/">← all RFCs</a> · cite as: (agentprinciples.org, ${htmlEscape(
    rfc.rfc_number
  )}, ~${htmlEscape(rfc.rfc_version)})</p>
  `;

  const url = new URL(request.url);
  return htmlResponse(
    layoutHtml({
      title: `RFC #${rfc.rfc_number} · ${rfc.title} — agentprinciples.org`,
      description: `RFC #${rfc.rfc_number}: ${rfc.title}. agentprinciples.org public principles commons.`,
      body,
      canonical: `${url.origin}/rfcs/${rfc.rfc_number}`,
    })
  );
}
