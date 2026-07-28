# CFH フォトボイス分類 プロキシ

## セットアップ
1. `npm install -g wrangler`（未導入時）
2. `cp .dev.vars.example .dev.vars` してGeminiキーを記入（.dev.vars はgit管理外）
3. ローカル: `npm run dev` → http://localhost:8787/classify
4. 本番シークレット登録: `wrangler secret put GEMINI_API_KEY`
5. デプロイ: `npm run deploy`
6. `wrangler.toml` の `ALLOWED_ORIGIN` を配信元に合わせて更新

## 動作確認
curl -X POST http://localhost:8787/classify \
  -H 'Content-Type: application/json' \
  -d '{"spokenText":"2階の給湯器を外したところ","processMaster":["撤去","据付"]}'
→ {"title":"...","process":"撤去"} が返る

## 本番運用の注意

- `ALLOWED_ORIGIN` は本番デプロイ時、実際に配信するポータルのオリジン（例: `https://xxxxx.pages.dev`）に必ず設定してください。`*` のままだと任意のオリジンからのリクエストを許可してしまいます。
- 本アプリにはアプリ内レート制限を実装していません。`/classify` ルートには Cloudflare のビルトイン Rate Limiting の設定を検討してください。
