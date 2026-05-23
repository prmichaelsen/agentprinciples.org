// GET /api/v1/rfcs/<n> — JSON projection of a single RFC from D1.

import { jsonResponse } from "../../../_lib.js";

export async function onRequestGet(context) {
  const { params, env } = context;
  const n = parseInt(params.n, 10);
  if (!Number.isInteger(n) || n < 0) {
    return jsonResponse({ error: "invalid rfc number" }, { status: 400 });
  }

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
    return jsonResponse({ error: "rfc not found" }, { status: 404 });
  }

  let suite_members = null;
  if (rfc.suite_members_json) {
    try {
      suite_members = JSON.parse(rfc.suite_members_json);
    } catch {
      suite_members = null;
    }
  }

  return jsonResponse({
    version: "v1",
    rfc: {
      id: rfc.id,
      rfc_number: rfc.rfc_number,
      rfc_kind: rfc.rfc_kind,
      rfc_version: rfc.rfc_version,
      title: rfc.title,
      status: rfc.status,
      principle_text: rfc.principle_text,
      behavioral_expectations: rfc.behavioral_expectations,
      suite_membership: rfc.suite_membership,
      framing: rfc.framing,
      cross_references: rfc.cross_references,
      suite_members,
      created_at: rfc.created_at,
      updated_at: rfc.updated_at,
      citation: `(agentprinciples.org, ${rfc.rfc_number}, ~${rfc.rfc_version})`,
    },
  });
}
