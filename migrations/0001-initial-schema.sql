-- agentprinciples.org D1 initial schema
-- Migration 0001 — initial schema apply
--
-- Implements:
--   SPP-1  spec.spp-d1-canon~c5b9b4f0           (canonical row shape)
--   S-RFC  spec.principles-commons-rfc-format~954c212c  (RFC document shape)
--   S-PUBSURF spec.principles-commons-publication~f6f330f4  (charter, FR1 record-type inventory)
--   S-CONFORMANCE spec.principles-commons-conformance~f444b433 (attestation table shape; P5 — empty at v0)
--
-- Row-shape conventions inherited from SPP-1 FR2 verbatim:
--   id TEXT PK (UUIDv7), slug TEXT UNIQUE (external identity),
--   created_at / updated_at TEXT (UTC ISO 8601 ms precision, trailing Z),
--   version INTEGER (≥1, monotone — SPP-3 row-lifecycle version),
--   superseded_by_id TEXT NULLABLE FK → same table id.
--
-- N.B. SPP-1 row-level `version INTEGER` (lifecycle) is DISTINCT from
--      S-RFC FR1 `rfc_version TEXT` (document version per FR5 scheme).
--      Both columns live on `rfcs`.
--
-- Foreign keys target `id` per SPP-1 FR8 / INV-FK-TO-ID.
-- All cross-table joins via id; slug remains stable external identity.

PRAGMA foreign_keys = ON;

------------------------------------------------------------
-- rfcs  (P0 — charter FR1: principle | suite | meta RFCs)
------------------------------------------------------------
CREATE TABLE rfcs (
  -- SPP-1 canonical columns
  id                       TEXT PRIMARY KEY NOT NULL,           -- UUIDv7
  slug                     TEXT NOT NULL UNIQUE,                -- e.g. "rfc-1-intrinsic-empathy"
  created_at               TEXT NOT NULL,                       -- ISO 8601 UTC ms Z
  updated_at               TEXT NOT NULL,
  version                  INTEGER NOT NULL CHECK (version >= 1),
  superseded_by_id         TEXT,
  FOREIGN KEY (superseded_by_id) REFERENCES rfcs(id),

  -- S-RFC FR1 frontmatter schema (canonical document shape)
  rfc_number               INTEGER NOT NULL,                    -- ≥0; #0 reserved for suite anchor (FR4)
  rfc_kind                 TEXT NOT NULL CHECK (rfc_kind IN ('principle','suite','meta')),
  rfc_version              TEXT NOT NULL,                       -- FR5 scheme (PENDING ORIGINATOR RESOLUTION)
  title                    TEXT NOT NULL,
  status                   TEXT NOT NULL CHECK (status IN ('draft','active','deprecated')),

  -- principle-kind only (NULL on suite/meta)
  principle_text           TEXT,
  behavioral_expectations  TEXT,
  suite_membership         INTEGER,                             -- references another rfc.rfc_number with kind=suite

  -- suite-kind only (NULL on principle/meta)
  framing                  TEXT,
  cross_references         TEXT,
  suite_members_json       TEXT,                                -- JSON array of {rfc_number, version} per FR3

  -- Per S-RFC FR4 + INV-NUMBER-0 + INV-NUMBER-1 — rfc_number monotone & immutable;
  -- (rfc_number, rfc_version) pair immutable per INV-VERSION-1 (enforced at write layer).
  UNIQUE (rfc_number, rfc_version)
);

CREATE INDEX idx_rfcs_rfc_number       ON rfcs(rfc_number);
CREATE INDEX idx_rfcs_rfc_kind         ON rfcs(rfc_kind);
CREATE INDEX idx_rfcs_status           ON rfcs(status);
CREATE INDEX idx_rfcs_suite_membership ON rfcs(suite_membership);
CREATE INDEX idx_rfcs_superseded_by_id ON rfcs(superseded_by_id);

------------------------------------------------------------
-- conformance_attestations  (P5 — S-CONFORMANCE; empty at v0)
------------------------------------------------------------
CREATE TABLE conformance_attestations (
  -- SPP-1 canonical columns
  id                  TEXT PRIMARY KEY NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  version             INTEGER NOT NULL CHECK (version >= 1),
  superseded_by_id    TEXT,
  FOREIGN KEY (superseded_by_id) REFERENCES conformance_attestations(id),

  -- S-CONFORMANCE FR1 envelope (target = S-RFC FR7 citation triple components)
  declarant_id        TEXT NOT NULL,                            -- bound to SPP-6 identity at submission
  target_registry_url TEXT NOT NULL,
  target_rfc_number   INTEGER NOT NULL,
  target_rfc_version  TEXT NOT NULL,
  declared_at         TEXT NOT NULL,                            -- ISO 8601 UTC ms Z
  envelope_canonical  TEXT NOT NULL,                            -- canonicalized JSON for verify_attestation re-check
  envelope_transport  TEXT NOT NULL CHECK (envelope_transport IN ('signed-json')),
  signature           TEXT NOT NULL,                            -- signed-json signature

  -- Lifecycle (S-CONFORMANCE FR6 attestation states)
  lifecycle_state     TEXT NOT NULL CHECK (lifecycle_state IN ('submitted','verified','published','superseded','withdrawn'))
);

CREATE INDEX idx_attestations_declarant_id      ON conformance_attestations(declarant_id);
CREATE INDEX idx_attestations_target            ON conformance_attestations(target_rfc_number, target_rfc_version);
CREATE INDEX idx_attestations_lifecycle_state   ON conformance_attestations(lifecycle_state);
CREATE INDEX idx_attestations_superseded_by_id  ON conformance_attestations(superseded_by_id);

------------------------------------------------------------
-- attestation_withdrawals  (P5 — S-CONFORMANCE FR7/FR8; separate row type per S-PUBSURF FR1)
------------------------------------------------------------
CREATE TABLE attestation_withdrawals (
  -- SPP-1 canonical columns
  id                       TEXT PRIMARY KEY NOT NULL,
  slug                     TEXT NOT NULL UNIQUE,
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL,
  version                  INTEGER NOT NULL CHECK (version >= 1),
  superseded_by_id         TEXT,
  -- Withdrawals are themselves terminal per S-PUBSURF FR3; superseded_by_id retained for SPP-1
  -- row-shape conformance but expected to remain NULL.
  FOREIGN KEY (superseded_by_id) REFERENCES attestation_withdrawals(id),

  withdrawn_attestation_id TEXT NOT NULL,
  declarant_id             TEXT NOT NULL,                       -- MUST equal withdrawn attestation's declarant_id
  reason                   TEXT,
  withdrawn_at             TEXT NOT NULL,
  FOREIGN KEY (withdrawn_attestation_id) REFERENCES conformance_attestations(id)
);

CREATE INDEX idx_withdrawals_attestation_id ON attestation_withdrawals(withdrawn_attestation_id);
CREATE INDEX idx_withdrawals_declarant_id   ON attestation_withdrawals(declarant_id);
CREATE INDEX idx_withdrawals_withdrawn_at   ON attestation_withdrawals(withdrawn_at);

------------------------------------------------------------
-- schema_migrations  (non-archive-bearing per SPP-1; bookkeeping)
------------------------------------------------------------
CREATE TABLE schema_migrations (
  id          TEXT PRIMARY KEY NOT NULL,
  filename    TEXT NOT NULL UNIQUE,
  applied_at  TEXT NOT NULL
);

INSERT INTO schema_migrations (id, filename, applied_at)
VALUES ('0001-initial-schema', '0001-initial-schema.sql', strftime('%Y-%m-%dT%H:%M:%S.000Z','now'));
