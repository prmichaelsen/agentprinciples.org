// Shared helpers for agentprinciples.org Pages Functions.
// Reads from the D1 binding `DB` (declared in wrangler.toml).
//
// SECURITY: HTML is built by string concatenation. All untrusted inputs
// (D1 content, query params) MUST pass through htmlEscape() before
// interpolation. RFC body rendering is intentionally verbatim — we do
// NOT run a markdown renderer over principle_text / behavioral_expectations
// because the publication discipline (per the projection-engine directive)
// preserves the source text exactly, including whitespace, with no
// markdown auto-correction or emoji substitution.

export function htmlEscape(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function xmlEscape(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function layoutHtml({ title, description, body, canonical }) {
  const t = htmlEscape(title);
  const d = htmlEscape(description || "");
  const c = canonical
    ? `<link rel="canonical" href="${htmlEscape(canonical)}" />`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  ${c}
  <style>
    :root {
      color-scheme: light dark;
      --fg: #111827; --muted: #4b5563; --bg: #ffffff; --rule: #e5e7eb;
      --accent: #2563eb; --accent-strong: #1d4ed8;
      --code-bg: rgba(0,0,0,0.04);
    }
    @media (prefers-color-scheme: dark) {
      :root { --fg:#e5e7eb; --muted:#9ca3af; --bg:#0b1220; --rule:#1f2937;
              --accent:#60a5fa; --accent-strong:#93c5fd;
              --code-bg: rgba(255,255,255,0.06); }
    }
    html, body { margin:0; padding:0; background:var(--bg); color:var(--fg);
      font: 16px/1.6 ui-serif, Georgia, "Iowan Old Style", "Apple Garamond", serif; }
    main { max-width: 44rem; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
    header.masthead { border-bottom: 1px solid var(--rule); padding-bottom:1rem; margin-bottom:2rem; }
    header.masthead a { color:var(--accent); font-weight:600; letter-spacing:-0.01em; text-decoration:none; }
    header.masthead .tagline { color:var(--muted); font-style:italic; font-size:0.9rem; }
    h1 { font-size: 1.85rem; font-weight: 600; letter-spacing:-0.015em; line-height:1.2; margin: 0 0 0.5rem; }
    h2 { font-size: 1.15rem; margin-top: 2.25rem; color:var(--accent); font-weight:600; }
    h3 { font-size: 1.0rem; margin-top: 1.5rem; }
    p, ul, ol { margin: 0 0 1.1rem; }
    a { color: var(--accent); }
    a:hover { color: var(--accent-strong); text-decoration: underline; }
    .rfc-meta { color:var(--muted); font-size:0.9rem; margin: 0 0 1.5rem; }
    .rfc-meta .version { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .verbatim { white-space: pre-wrap; font: 0.98rem/1.55 ui-serif, Georgia, serif; margin: 0 0 1.5rem; }
    .section-divider { margin: 2.5rem 0; border:none; border-top:1px solid var(--rule); }
    .rfc-nav { display:flex; flex-wrap:wrap; gap:0.75rem 1.25rem; font-size:0.92rem; margin: 0 0 1.5rem; }
    .rfc-nav a { color:var(--accent); text-decoration:none; }
    .rfc-nav a:hover { text-decoration:underline; color:var(--accent-strong); }
    .rfc-list { list-style: none; padding: 0; }
    .rfc-list li { padding: 0.6rem 0; border-bottom: 1px solid var(--rule); }
    .rfc-list li:last-child { border-bottom: none; }
    .rfc-list .num { display:inline-block; min-width: 2.5rem; color:var(--muted); font-family: ui-monospace, monospace; }
    .rfc-list .title { color:var(--accent); font-weight:500; text-decoration:none; }
    .rfc-list .title:hover { text-decoration:underline; }
    .rfc-list .v { color:var(--muted); font-family: ui-monospace, monospace; font-size:0.85rem; margin-left: 0.5rem; }
    .footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid var(--rule); color: var(--muted); font-size: 0.88rem; }
    .footer a { color: var(--accent); }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.92em; background: var(--code-bg); padding: 0.05rem 0.3rem; border-radius: 0.25rem; }
  </style>
</head>
<body>
  <main>
    <header class="masthead">
      <a href="/">agentprinciples.org</a>
      <div class="tagline">a public principles commons for agentic systems</div>
    </header>
    ${body}
    <footer class="footer">
      <p>
        Machine-readable: <a href="/api/v1/rfcs/">/api/v1/rfcs/</a> ·
        Feed: <a href="/feed/rfcs.xml">/feed/rfcs.xml</a> ·
        Attestations: <a href="/api/v1/attestations/">/api/v1/attestations/</a>
      </p>
      <p>
        <a href="https://github.com/prmichaelsen/agentprinciples.org">Source on GitHub</a>
      </p>
    </footer>
  </main>
</body>
</html>`;
}

export function jsonResponse(obj, init = {}) {
  return new Response(JSON.stringify(obj, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      ...(init.headers || {}),
    },
    status: init.status || 200,
  });
}

export function htmlResponse(html, init = {}) {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60",
      ...(init.headers || {}),
    },
    status: init.status || 200,
  });
}

export function xmlResponse(xml, init = {}) {
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300",
      ...(init.headers || {}),
    },
    status: init.status || 200,
  });
}

// Render an RFC's verbatim body. Principle-kind uses principle_text +
// behavioral_expectations; suite-kind uses framing + cross_references +
// suite_members_json. All rendered with white-space:pre-wrap so the
// source text from principles.md is preserved exactly.
export function renderRfcBodyHtml(rfc) {
  if (rfc.rfc_kind === "principle") {
    const parts = [];
    if (rfc.principle_text) {
      parts.push(
        `<h2>Principle</h2><div class="verbatim">${htmlEscape(rfc.principle_text)}</div>`
      );
    }
    if (rfc.behavioral_expectations) {
      parts.push(
        `<h2>Behavioral expectations</h2><div class="verbatim">${htmlEscape(rfc.behavioral_expectations)}</div>`
      );
    }
    return parts.join("\n");
  }
  if (rfc.rfc_kind === "suite") {
    const parts = [];
    if (rfc.framing) {
      parts.push(
        `<h2>Framing</h2><div class="verbatim">${htmlEscape(rfc.framing)}</div>`
      );
    }
    if (rfc.cross_references) {
      parts.push(
        `<h2>Cross-references</h2><div class="verbatim">${htmlEscape(rfc.cross_references)}</div>`
      );
    }
    if (rfc.suite_members_json) {
      let members;
      try {
        members = JSON.parse(rfc.suite_members_json);
      } catch {
        members = null;
      }
      if (Array.isArray(members) && members.length) {
        const items = members
          .map((m) => {
            const n = htmlEscape(m.rfc_number);
            const title = htmlEscape(m.title || "");
            return `<li><a href="/rfcs/${n}">RFC #${n}</a> — ${title}</li>`;
          })
          .join("");
        parts.push(`<h2>Suite members</h2><ul>${items}</ul>`);
      }
    }
    return parts.join("\n");
  }
  return "";
}
