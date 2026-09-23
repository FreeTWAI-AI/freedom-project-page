import test from 'node:test';
import assert from 'node:assert/strict';
import { projectPublicView, renderProjectPage, publicHttpsUrl } from '../src/index.mjs';

const manifest = { schema_version: 'freedom.project/v1', kind: 'Project', project_id: 'project:example', name: 'Example project', summary: 'A source-only example.', repository: { visibility: 'public', full_name: 'example/project', html_url: 'https://github.com/example/project', repository_id: '42', source_lineage: [] }, data_boundary: { classification: 'public', customer_data_mode: 'none' }, description: { problem: 'Make a useful example.', audiences: ['Makers'], capabilities: ['Build a source page'], limitations: ['No official status verification'] }, page: { publication: 'github_pages', canonical_platform_url: 'https://staging.freetwai.com/' }, ownership: { accountable_team: null, external_owner: { login: 'example' }, security_contact: 'https://github.com/example/project/security' }, licensing: { spdx_expression: 'NOASSERTION', source_distribution: 'source_available' }, release: { policy: 'freedom.no-release/v1' }, links: { documentation: 'https://github.com/example/project', demo: null, support: null, issues: null } };

test('a public source artifact includes every required section and never trusts a requested label', () => {
  const source = { ...manifest, page: { ...manifest.page, requested_trust_label: 'official' } };
  const html = renderProjectPage(source);
  for (const section of ['identity_and_status', 'problem_and_audience', 'capabilities_and_limitations', 'links', 'release', 'ownership_and_security', 'license_and_data_boundary', 'fork_lineage', 'build_provenance', 'canonical_platform_link']) assert.match(html, new RegExp(`id="${section}"`));
  assert.equal(projectPublicView(source).official, false);
  assert.match(html, /Not verified/);
  assert.doesNotMatch(html, /<script/);
});
test('untrusted content is escaped and non-projected private fields do not leak', () => {
  const html = renderProjectPage({ ...manifest, name: '<img src=x onerror=alert(1)>', private_secret: 'DO_NOT_INCLUDE', description: { ...manifest.description, problem: '</p><script>alert(1)</script>' } });
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img|<script|DO_NOT_INCLUDE/);
});
test('private, internal and withheld metadata cannot generate public artifacts', () => {
  assert.throws(() => renderProjectPage({ ...manifest, repository: { ...manifest.repository, visibility: 'private' } }), /Private/);
  assert.throws(() => renderProjectPage({ ...manifest, data_boundary: { ...manifest.data_boundary, classification: 'internal' } }), /Private/);
  assert.throws(() => renderProjectPage({ ...manifest, page: { ...manifest.page, publication: 'withheld' } }), /does not request/);
});
test('unsafe navigational links, source paths and false provenance fail closed', () => {
  for (const url of ['javascript:alert(1)', 'https://user:pass@example.com', 'https://127.0.0.1/a', 'https://[::1]/', 'https://localhost/a', 'https://example.com/?token=abc', 'https://example.com\\@evil.com', 'https://project.internal/a']) assert.throws(() => publicHttpsUrl(url));
  assert.throws(() => renderProjectPage({ ...manifest, links: { demo: 'javascript:alert(1)' } }));
  assert.throws(() => renderProjectPage({ ...manifest, repository: { ...manifest.repository, full_name: '../../secret' } }), /inconsistent/);
  assert.throws(() => renderProjectPage(manifest, { sourceCommit: 'main' }), /full SHA/);
  assert.throws(() => renderProjectPage(manifest, { manifestSha256: 'trust-me' }), /SHA-256/);
});
