# Ecotech System 設定・操作マニュアル

## 1. 開発環境の起動

本システムは開発モードでの動作を推奨しています。

```bash
npm run dev
```

起動後、ブラウザで `http://localhost:3000` にアクセスしてください。

## 2. 環境設定 (.env)

システムの全機能を利用するには、`.env` ファイルに以下の設定が必要です。

### 2.1 Gmail送信設定 (メール通知用)

[Googleアカウント管理](https://myaccount.google.com/security) から「アプリパスワード」を取得して設定します。

```env
SMTP_USER="your-email@gmail.com"  # Gmailアドレス
SMTP_PASS="your-app-password"     # 16桁のアプリパスワード
EMAIL_FROM='"Ecotech Notification" <your-email@gmail.com>'
```

### 2.2 Google認証設定 (ログイン用)

[Google Cloud Console](https://console.cloud.google.com/) でOAuthクライアントを作成して設定します。

* リダイレクトURI: `http://localhost:3000/api/auth/callback/google`

```env
AUTH_GOOGLE_ID="your-client-id"
AUTH_GOOGLE_SECRET="your-client-secret"
```

### 2.3 Gemini API設定 (AI画像解析用)

[Google AI Studio](https://aistudio.google.com/app/apikey) でAPIキーを取得して設定します。

```env
GEMINI_API_KEY="your-gemini-api-key"
```

## 3. 機能説明

### メール通知

新規依頼を作成すると、対象エリア（依頼住所）を担当するユーザーに自動で通知メールが送信されます。

### AI画像解析

依頼登録画面（Import）で画像やPDFをアップロードすると、AIが内容を読み取り、自動で入力フォームを埋めます。

## 4. トラブルシューティング

過去に発生したエラーとその対処法です。

* **Next.js のビルドエラー**:
  * バージョン `16.1.6` でのバグを確認。`package.json` で `16.1.4` に固定しています。

* **date-fns のエラー**:
  * バージョン `4.x` が一部ライブラリと非互換。`3.6.0` に固定しています。

* **「window is not defined」エラー**:
  * `vanilla-autokana` ライブラリがサーバーサイドで動作しないために発生していました。
  * `RequestForm.tsx` 内で動的インポート（`import()`）を使用するように修正済みです。

* **IDEのエラー表示**:
  * `debug_create.ts` などで「PrismaClientがない」と表示されることがありますが、スクリプトの実行は正常に行えます。IDEの再起動で消える場合があります。
