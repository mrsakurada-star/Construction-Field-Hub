# Construction Field Hub

現場担当者向けの業務ツール群を束ねるポータル。各ツールは `[Tool Name]/index.html` を入口とする独立フォルダで、`js/tools.js` からポータルにカード登録される。

## アーキテクチャ

- **`css/portal.css`が正**（Purpose Ecotech デザイントークン: `--ink` / `--ash` / `--ash-2` / `--clay` / `--mist`、`border-radius: 0`、200ms系トランジション）。2026-07-03 にオレンジ系トークンからリデザイン済み。
- **`css/design-system.css` はレガシー**。旧オレンジトークン（`--accent #ff9500` 等）の残骸なので新規参照禁止。既存コードで見つけたら `portal.css` トークンへ置き換える。
- **`js/tools.js`**: ポータルのツールカード（タイトル・説明・タグ）を管理
- **`js/updates.js`**: ポータルの「最近のアップデート」履歴（`PORTAL_UPDATES` 配列）
- **`機能説明書.md`**: 全ツールの詳細な機能・操作手順ドキュメント

## skill一覧（`.claude/skills/`）

| skill | 適用場面 |
|---|---|
| `simple-design-standard` | 新規ツール作成・既存UI修正（Purpose Ecotechトークン・Lucide Icons適用） |
| `structural-modularization` | モノリシックHTMLを分割・構造化するとき |
| `a4-print-adjustment` | 印刷レイアウトをA4 1枚に収めるとき |
| `spa-button-type-enforcement` | `<button>` タグ実装・「押すと画面が真っ白」系バグ調査 |
| `copyright-insertion` | ファイル新規作成・編集・コピーライト一括監査 |
| `portal-doc-sync` | ツールのバージョン更新・機能追加時（version・tools.js・機能説明書.md同期） |
| `portal-update-logging` | ツール更新後の js/updates.js 履歴追加 |
| `hotwater-logic-sync` | 給湯能力計算の計算式・定数変更時（計算ロジック.md 同期） |

gitnexus 系skill（`gitnexus-exploring` 等）は下記 CLI 表を参照。

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Construction-Field-Hub** (1014 symbols, 2164 relationships, 83 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "master"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Construction-Field-Hub/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Construction-Field-Hub/clusters` | All functional areas |
| `gitnexus://repo/Construction-Field-Hub/processes` | All execution flows |
| `gitnexus://repo/Construction-Field-Hub/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
