# Freedom Project Page

A deterministic, status-neutral introduction page generator for a **public** project manifest. It produces `dist/index.html`; it does not enable GitHub Pages or publish a site.

## Build

With Node 24, run `npm test` and `npm run build`. The input is `freedom.project.yaml` in JSON serialization (valid YAML). For another checked public manifest, use `node scripts/build.mjs /path/to/freedom.project.yaml`. Output is always this repository's `dist/index.html`; manifest fields cannot choose paths or shell commands. Set `SOURCE_COMMIT` to the exact 40-character source commit to include it in provenance.

Run the pinned canonical schema and GitHub semantic checks before treating an artifact as a validated project page. The renderer performs its own bounded public projection and defensive field checks; these do not replace the full schema validator. It refuses private/internal metadata and `platform_only`/`withheld` page intents.

## Integration boundary

`src/index.mjs` exports `projectPublicView(manifest)` and `renderProjectPage(manifest, options)`. It reads no database, member session, token or remote API. Only selected public fields become HTML. Text is escaped, links are restricted to public HTTPS without credential fields, and no JavaScript is emitted. A fixed CSP limits the generated page; the eventual hosting layer must also supply the approved security headers.

All ten required introduction sections are emitted. Manifest digests describe the exact local input. The page always starts with `official: false` / **Not verified**; a requested trust label is not a signed status. A canonical status-attestation verifier, immutable release publication, trusted reusable automation and hosting rollout remain later work. No fake verified badge is produced while those are absent.

`page.publication: github_pages` describes the requested page surface; deployment settings and GitHub repository Pages settings still determine whether any page is published. This repository has no publish workflow.
