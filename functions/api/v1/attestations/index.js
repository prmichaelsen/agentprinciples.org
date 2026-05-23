// GET /api/v1/attestations/ — JSON list of all attestations.
// Empty until peers begin submitting (P5 work).

import { jsonResponse } from "../../../_lib.js";

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(
    `SELECT id, slug, declarant_id, target_rfc_number, target_rfc_version,
            declared_at, envelope_transport, lifecycle_state, created_at
       FROM conformance_attestations
      WHERE superseded_by_id IS NULL
      ORDER BY declared_at DESC`
  ).all();

  return jsonResponse({
    version: "v1",
    attestations: results || [],
  });
}
