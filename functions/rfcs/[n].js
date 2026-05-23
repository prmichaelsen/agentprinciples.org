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

  // Resolve prev/next RFC by rfc_number among active, non-superseded rows.
  const [prevRow, nextRow] = await Promise.all([
    env.DB.prepare(
      `SELECT rfc_number FROM rfcs
        WHERE rfc_number < ?
          AND superseded_by_id IS NULL
          AND status = 'active'
        ORDER BY rfc_number DESC
        LIMIT 1`
    )
      .bind(n)
      .first(),
    env.DB.prepare(
      `SELECT rfc_number FROM rfcs
        WHERE rfc_number > ?
          AND superseded_by_id IS NULL
          AND status = 'active'
        ORDER BY rfc_number ASC
        LIMIT 1`
    )
      .bind(n)
      .first(),
  ]);

  const navParts = [];
  if (prevRow) {
    navParts.push(
      `<a href="/rfcs/${htmlEscape(prevRow.rfc_number)}">← Previous RFC</a>`
    );
  }
  navParts.push(`<a href="/rfcs/">All RFCs</a>`);
  if (nextRow) {
    navParts.push(
      `<a href="/rfcs/${htmlEscape(nextRow.rfc_number)}">Next RFC →</a>`
    );
  }
  const nav = `<nav class="rfc-nav" aria-label="RFC navigation">${navParts.join(
    " · "
  )}</nav>`;

  const body = `
  <h1>${htmlEscape(rfc.title)}</h1>
  ${meta}
  ${renderRfcBodyHtml(rfc)}
  <hr class="section-divider" />
  ${nav}
  <p class="footer">cite as: (agentprinciples.org, ${htmlEscape(
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
