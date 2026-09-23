import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
function text(value, label, limit = 2000) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) throw new TypeError(`${label} must be a bounded non-empty string`);
  return value;
}
function stringList(value, label) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 40) throw new TypeError(`${label} must be a bounded list`);
  return value.map((item) => text(item, label));
}

/** Public navigational links only. No requests, script execution or manifest-directed file reads. */
export function publicHttpsUrl(value) {
  text(value, 'Public URL', 1000);
  let url;
  try { url = new URL(value); } catch { throw new TypeError('Invalid public URL'); }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (url.protocol !== 'https:' || url.username || url.password || url.port || /[\\\s]/.test(value) || /%(?:40|2f|5c)/i.test(value.split(/[?#]/, 1)[0].split('://')[1]?.split('/')[0] ?? '') || isIP(host) || !host.includes('.') || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)) throw new TypeError('Only public HTTPS links without credentials are allowed');
  for (const key of url.searchParams.keys()) if (/token|secret|password|credential|signature|(?:^|_)key$|auth/i.test(key)) throw new TypeError('Credential-bearing URLs cannot appear in a public page');
  return url.href;
}

/** Narrow public projection. Run the full pinned schema + GitHub checks before publication. */
export function projectPublicView(manifest) {
  if (manifest?.schema_version !== 'freedom.project/v1' || manifest.kind !== 'Project') throw new TypeError('Expected a freedom.project/v1 manifest');
  if (manifest.repository?.visibility !== 'public' || manifest.data_boundary?.classification !== 'public') throw new TypeError('Private/internal metadata cannot generate a public page');
  if (manifest.page?.publication !== 'github_pages') throw new TypeError('The manifest does not request a public project page');
  if (!/^project:[a-z0-9][a-z0-9-]{1,62}$/.test(manifest.project_id ?? '')) throw new TypeError('Invalid project ID');
  const fullName = text(manifest.repository.full_name, 'Repository name', 201);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(fullName) || manifest.repository.html_url !== `https://github.com/${fullName}` || !/^[1-9][0-9]{0,19}$/.test(manifest.repository.repository_id ?? '')) throw new TypeError('Repository identity is inconsistent');
  const links = Object.entries(manifest.links ?? {}).filter(([, value]) => value !== null).map(([label, value]) => {
    if (!['documentation', 'demo', 'support', 'issues'].includes(label)) throw new TypeError('Unknown public link');
    return { label, url: publicHttpsUrl(value) };
  });
  const lineage = manifest.repository.source_lineage ?? [];
  if (!Array.isArray(lineage) || lineage.length > 16) throw new TypeError('Invalid source lineage');
  return {
    projectId: manifest.project_id,
    name: text(manifest.name, 'Name', 120),
    summary: text(manifest.summary, 'Summary', 240),
    problem: text(manifest.description?.problem, 'Problem'),
    audiences: stringList(manifest.description?.audiences, 'Audiences'),
    capabilities: stringList(manifest.description?.capabilities, 'Capabilities'),
    limitations: stringList(manifest.description?.limitations, 'Limitations'),
    repository: publicHttpsUrl(manifest.repository.html_url),
    repositoryId: manifest.repository.repository_id,
    fullName,
    links,
    canonicalPlatformUrl: publicHttpsUrl(manifest.page.canonical_platform_url),
    owner: text(manifest.ownership?.accountable_team ?? manifest.ownership?.external_owner?.login, 'Owner', 201),
    securityContact: text(manifest.ownership?.security_contact, 'Security contact', 500),
    sourceLicense: text(manifest.licensing?.spdx_expression, 'Source license', 240),
    sourceDistribution: text(manifest.licensing?.source_distribution, 'Source distribution', 80),
    dataBoundary: text(manifest.data_boundary.customer_data_mode, 'Customer data boundary', 80),
    releasePolicy: text(manifest.release?.policy, 'Release policy', 100),
    lineage: lineage.map((source) => ({ name: text(source.full_name, 'Source name', 201), url: publicHttpsUrl(source.html_url), commit: /^[a-fA-F0-9]{40}$/.test(source.based_on_commit ?? '') ? source.based_on_commit : (() => { throw new TypeError('Lineage requires a full SHA'); })() })),
    official: false,
    status: 'Not verified — source metadata only',
  };
}

export function renderProjectPage(manifest, { manifestSha256, sourceCommit = null } = {}) {
  const view = projectPublicView(manifest);
  const digest = manifestSha256 ?? createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
  if (!/^[a-f0-9]{64}$/.test(digest)) throw new TypeError('Manifest digest must be a full SHA-256');
  if (sourceCommit !== null && !/^[a-fA-F0-9]{40}$/.test(sourceCommit)) throw new TypeError('Source commit must be a full SHA');
  const list = (items) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  const link = (label, url) => `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escapeHtml(view.name)} · Freedom projects</title><style>body{margin:0;background:#f5f8f6;color:#17362c;font:17px/1.65 system-ui}main{max-width:960px;margin:0 auto;padding:48px 24px}h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.1}h2{font-size:1.3rem}section{background:white;border:1px solid #dce5df;border-radius:16px;padding:20px 24px;margin:20px 0}a{color:#17654b;overflow-wrap:anywhere}code{overflow-wrap:anywhere;font-size:.85em}.eyebrow{letter-spacing:.12em;text-transform:uppercase;font-size:.8rem}.status{background:#fff4dc;padding:12px 18px;border-radius:8px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px}.grid section{margin:0}</style></head>
<body><main><header id="identity_and_status"><p class="eyebrow">Freedom · Public project source</p><h1>${escapeHtml(view.name)}</h1><p>${escapeHtml(view.summary)}</p><p class="status">${escapeHtml(view.status)}. Official status is false until a valid canonical signed status is verified.</p><p><code>${escapeHtml(view.projectId)}</code> · GitHub repository ID ${escapeHtml(view.repositoryId)}</p></header>
<section id="problem_and_audience"><h2>Problem and audience</h2><p>${escapeHtml(view.problem)}</p>${list(view.audiences)}</section>
<div class="grid" id="capabilities_and_limitations"><section><h2>Capabilities</h2>${list(view.capabilities)}</section><section><h2>Limitations</h2>${list(view.limitations)}</section></div>
<section id="links"><h2>Source and useful links</h2><p>${link(view.fullName, view.repository)}</p><ul>${view.links.map((item) => `<li>${link(item.label, item.url)}</li>`).join('')}</ul></section>
<section id="release"><h2>Release</h2><p>Declared policy: ${escapeHtml(view.releasePolicy)}. This artifact does not verify a release, test result or deployment.</p></section>
<section id="ownership_and_security"><h2>Ownership and security</h2><p>Declared accountable owner: ${escapeHtml(view.owner)}</p><p>Security contact: ${escapeHtml(view.securityContact)}</p></section>
<section id="license_and_data_boundary"><h2>License and data boundary</h2><p>Declared source license: ${escapeHtml(view.sourceLicense)} (${escapeHtml(view.sourceDistribution)}).</p><p>Customer data mode: ${escapeHtml(view.dataBoundary)}. This page contains only selected public metadata; no credentials or member records are loaded.</p></section>
<section id="fork_lineage"><h2>Source lineage</h2>${view.lineage.length ? `<ul>${view.lineage.map((source) => `<li>${link(source.name, source.url)} · <code>${escapeHtml(source.commit)}</code></li>`).join('')}</ul>` : '<p>No source lineage is declared. GitHub semantic verification is a separate check.</p>'}<p>A fork or template copy does not inherit official status.</p></section>
<section id="build_provenance"><h2>Build provenance</h2><p>Manifest SHA-256: <code>${digest}</code></p><p>Source commit: <code>${sourceCommit ?? 'not supplied'}</code></p><p>Static source artifact. Building this page does not publish it.</p></section>
<section id="canonical_platform_link"><h2>Platform</h2><p>${link('Open the canonical Platform link', view.canonicalPlatformUrl)}</p><p>Signed status verification is not implemented in this preview renderer; no status or trust badge is inferred from manifest declarations.</p></section>
</main></body></html>`;
}
