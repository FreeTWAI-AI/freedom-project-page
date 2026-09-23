# Freedom Project Page

<!-- freedom-repository-guide:start -->
## 在自由工坊的位置

[自由工坊](https://freetwai.com) 讓會員先完成定位、選擇公會並領取 Repo 技能書，再以供貨、商店、開源作品、行銷與小隊共同完成成果。

從公開 manifest 產生可分享的專案介紹頁。 已有固定欄位投影、HTML escaping、安全連結及可重現 dist/index.html 產出。

build 不會啟用 GitHub Pages、發布網站、簽署版本或證明 official status。

本 repo 的維護者負責「從公開 manifest 產生可分享的專案介紹頁。」這個模組；公會職稱與自填 GitHub slug 不授予寫入權。

程式／內容入口：[src/index.mjs](src/index.mjs)、[scripts/build.mjs](scripts/build.mjs)、[test/](test/)、[freedom.project.yaml](freedom.project.yaml)。協作先讀 [CONTRIBUTING.md](CONTRIBUTING.md)，讓 Agent 讀 [AGENTS.md](AGENTS.md)；從[本倉 Issues](https://github.com/FreeTWAI-AI/freedom-project-page/issues)認領、[查看既有 PR](https://github.com/FreeTWAI-AI/freedom-project-page/pulls)避免重工。

只接受經檢查的公開 manifest，不讀會員 token、資料庫或私人 metadata。中央契約才定義 manifest；renderer 不能自行發明 trust／official 欄位。 跨 repo 的協定由[中央平台](https://github.com/FreeTWAI-AI/freedom-platform)維護。
<!-- freedom-repository-guide:end -->

A deterministic, status-neutral introduction page generator for a **public** project manifest. It produces `dist/index.html`; it does not enable GitHub Pages or publish a site.

## Build

With Node 24, run `npm test` and `npm run build`. The input is `freedom.project.yaml` in JSON serialization (valid YAML). For another checked public manifest, use `node scripts/build.mjs /path/to/freedom.project.yaml`. Output is always this repository's `dist/index.html`; manifest fields cannot choose paths or shell commands. Set `SOURCE_COMMIT` to the exact 40-character source commit to include it in provenance.

Run the pinned canonical schema and GitHub semantic checks before treating an artifact as a validated project page. The renderer performs its own bounded public projection and defensive field checks; these do not replace the full schema validator. It refuses private/internal metadata and `platform_only`/`withheld` page intents.

## Integration boundary

`src/index.mjs` exports `projectPublicView(manifest)` and `renderProjectPage(manifest, options)`. It reads no database, member session, token or remote API. Only selected public fields become HTML. Text is escaped, links are restricted to public HTTPS without credential fields, and no JavaScript is emitted. A fixed CSP limits the generated page; the eventual hosting layer must also supply the approved security headers.

All ten required introduction sections are emitted. Manifest digests describe the exact local input. The page always starts with `official: false` / **Not verified**; a requested trust label is not a signed status. A canonical status-attestation verifier, immutable release publication, trusted reusable automation and hosting rollout remain later work. No fake verified badge is produced while those are absent.

`page.publication: github_pages` describes the requested page surface; deployment settings and GitHub repository Pages settings still determine whether any page is published. This repository has no publish workflow.
