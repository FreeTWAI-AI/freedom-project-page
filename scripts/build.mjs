import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { renderProjectPage } from '../src/index.mjs';

const source = process.argv[2] ?? 'freedom.project.yaml';
if ((await stat(source)).size > 1024 * 1024) throw new TypeError('Manifest exceeds 1 MiB');
const bytes = await readFile(source);
let manifest;
try { manifest = JSON.parse(bytes.toString('utf8')); } catch { throw new TypeError('Use JSON serialization for freedom.project.yaml (valid YAML). Do not evaluate YAML as code.'); }
const html = renderProjectPage(manifest, { manifestSha256: createHash('sha256').update(bytes).digest('hex'), sourceCommit: process.env.SOURCE_COMMIT ?? null });
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/index.html', import.meta.url), html);
console.log('Built dist/index.html from public source metadata. Pages deployment was not enabled.');
