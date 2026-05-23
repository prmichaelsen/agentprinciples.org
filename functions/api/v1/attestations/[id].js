// GET /api/v1/attestations/<id> — JSON single attestation.
// Returns 404 until peers begin submitting attestations (P5 work).

import { jsonResponse } from "../../../_lib.js";

export async function onRequestGet(context) {
  const { params, env } = context;
  const id = params.id;
  if (!id) {
    return jsonResponse({ error: "missing id" }, { status: 400 });
  }

  const row = await env.DB.prepare(
    `SELECT id, slug, declarant_id, target_registry_url, target_rfc_number,
            target_rfc_version, declared_at, envelope_transport, signature,
            lifecycle_state, created_at, updated_at
       FROM conformance_attestations
      WHERE id = ? AND superseded_by_id IS NULL`
  )
    .bind(id)
    .first();

  if (!row) {
    return jsonResponse({ error: "attestation not found" }, { status: 404 });
  }

  return jsonResponse({ version: "v1", attestation: row });
}
