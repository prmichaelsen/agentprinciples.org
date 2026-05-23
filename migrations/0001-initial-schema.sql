PRAGMA foreign_keys = ON;

CREATE TABLE rfcs (
  id                       TEXT PRIMARY KEY NOT NULL,
  slug                     TEXT NOT NULL UNIQUE,
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL,
  version                  INTEGER NOT NULL CHECK (version >= 1),
  superseded_by_id         TEXT REFERENCES rfcs(id),
  rfc_number               INTEGER NOT NULL,
  rfc_kind                 TEXT NOT NULL CHECK (rfc_kind IN ('principle','suite','meta')),
  rfc_version              TEXT NOT NULL,
  title                    TEXT NOT NULL,
  status                   TEXT NOT NULL CHECK (status IN ('draft','active','deprecated')),
  principle_text           TEXT,
  behavioral_expectations  TEXT,
  suite_membership         INTEGER,
  framing                  TEXT,
  cross_references         TEXT,
  suite_members_json       TEXT,
  UNIQUE (rfc_number, rfc_version)
);

CREATE INDEX idx_rfcs_rfc_number       ON rfcs(rfc_number);
CREATE INDEX idx_rfcs_rfc_kind         ON rfcs(rfc_kind);
CREATE INDEX idx_rfcs_status           ON rfcs(status);
CREATE INDEX idx_rfcs_suite_membership ON rfcs(suite_membership);
CREATE INDEX idx_rfcs_superseded_by_id ON rfcs(superseded_by_id);

CREATE TABLE conformance_attestations (
  id                  TEXT PRIMARY KEY NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  version             INTEGER NOT NULL CHECK (version >= 1),
  superseded_by_id    TEXT REFERENCES conformance_attestations(id),
  declarant_id        TEXT NOT NULL,
  target_registry_url TEXT NOT NULL,
  target_rfc_number   INTEGER NOT NULL,
  target_rfc_version  TEXT NOT NULL,
  declared_at         TEXT NOT NULL,
  envelope_canonical  TEXT NOT NULL,
  envelope_transport  TEXT NOT NULL CHECK (envelope_transport IN ('signed-json')),
  signature           TEXT NOT NULL,
  lifecycle_state     TEXT NOT NULL CHECK (lifecycle_state IN ('submitted','verified','published','superseded','withdrawn'))
);

CREATE INDEX idx_attestations_declarant_id      ON conformance_attestations(declarant_id);
CREATE INDEX idx_attestations_target            ON conformance_attestations(target_rfc_number, target_rfc_version);
CREATE INDEX idx_attestations_lifecycle_state   ON conformance_attestations(lifecycle_state);
CREATE INDEX idx_attestations_superseded_by_id  ON conformance_attestations(superseded_by_id);

CREATE TABLE attestation_withdrawals (
  id                       TEXT PRIMARY KEY NOT NULL,
  slug                     TEXT NOT NULL UNIQUE,
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL,
  version                  INTEGER NOT NULL CHECK (version >= 1),
  superseded_by_id         TEXT REFERENCES attestation_withdrawals(id),
  withdrawn_attestation_id TEXT NOT NULL REFERENCES conformance_attestations(id),
  declarant_id             TEXT NOT NULL,
  reason                   TEXT,
  withdrawn_at             TEXT NOT NULL
);

CREATE INDEX idx_withdrawals_attestation_id ON attestation_withdrawals(withdrawn_attestation_id);
CREATE INDEX idx_withdrawals_declarant_id   ON attestation_withdrawals(declarant_id);
CREATE INDEX idx_withdrawals_withdrawn_at   ON attestation_withdrawals(withdrawn_at);

CREATE TABLE schema_migrations (
  id          TEXT PRIMARY KEY NOT NULL,
  filename    TEXT NOT NULL UNIQUE,
  applied_at  TEXT NOT NULL
);

INSERT INTO schema_migrations (id, filename, applied_at)
VALUES ('0001-initial-schema', '0001-initial-schema.sql', strftime('%Y-%m-%dT%H:%M:%S.000Z','now'));
