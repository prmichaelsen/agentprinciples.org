// GET /api/v1/rfcs/ — JSON list of all published RFCs.

import { jsonResponse } from "../../../_lib.js";

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(
    `SELECT id, rfc_number, rfc_kind, rfc_version, title, status,
            suite_membership, created_at, updated_at
       FROM rfcs
      WHERE superseded_by_id IS NULL
        AND status = 'active'
      ORDER BY rfc_number ASC`
  ).all();

  return jsonResponse({
    version: "v1",
    rfcs: (results || []).map((r) => ({
      id: r.id,
      rfc_number: r.rfc_number,
      rfc_kind: r.rfc_kind,
      rfc_version: r.rfc_version,
      title: r.title,
      status: r.status,
      suite_membership: r.suite_membership,
      created_at: r.created_at,
      updated_at: r.updated_at,
      url: `/rfcs/${r.rfc_number}`,
      api_url: `/api/v1/rfcs/${r.rfc_number}`,
      citation: `(agentprinciples.org, ${r.rfc_number}, ~${r.rfc_version})`,
    })),
  });
}
