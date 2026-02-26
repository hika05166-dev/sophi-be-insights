# ソフィBe インサイトツール

ソフィBe（生理・体調管理アプリ）のAIチャット機能「びい」でのユーザー発話データを検索・分析し、インサイトを得るための社内ツール。

## 機能

- 🔍 **発話キーワード検索** — 関連語も含めたあいまい検索
- 📊 **グルーピングサマリー** — Claude AIによる自動テーマ分類
- 👤 **ユーザー属性フィルター** — 深刻な悩み / 自己解決型ユーザーの絞り込み
- 💬 **チャット履歴詳細** — ユーザーとびいの会話を時系列で表示
- ✨ **インサイト生成** — Claude AIによる会話分析レポート
- 📈 **キーワード分析ダッシュボード** — 年代別・モード別・ヒートマップ・時系列グラフ

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` を作成（`.env.local.example` をコピーして使用）:

```bash
# Anthropic Claude API Key（任意 - 未設定でも基本機能は動作）
ANTHROPIC_API_KEY=sk-ant-xxxx...

# NextAuth設定
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

> **Note**: `ANTHROPIC_API_KEY` が未設定の場合、AI機能（グルーピング・インサイト生成）はサンプルデータにフォールバックします。

### 3. 開発サーバーの起動

```bash
npm run dev
```

### 4. ブラウザでアクセス

```
http://localhost:3000
```

**ログイン情報:**
- メールアドレス: `test@example.com`
- パスワード: `password123`

> **Note**: 初回アクセス時にSQLiteデータベースが自動作成され、ダミーデータがシードされます。

## 使い方

### 検索画面
トップ画面の検索バーにキーワードを入力して検索。よく検索されているキーワードはトレンドセクションに表示されます。

### 検索結果画面
- **グルーピングサマリー**: Claude AIが検索結果を3〜5のテーマに自動分類。グループをクリックで絞り込み
- **属性フィルター**: 「深刻な悩みを持つユーザー」「自己解決型ユーザー」でフィルタリング
- **発話一覧**: 行クリックでそのユーザーのチャット履歴詳細へ

### チャット履歴詳細
ユーザーとびいの会話を時系列で確認。「インサイトを生成」ボタンでAI分析レポートを生成。

### キーワード分析ダッシュボード
検索結果画面の「キーワード分析を見る」ボタンから遷移。年代別・モード別の構成比、ヒートマップ、月別トレンドを確認。

## 技術スタック

| 技術 | 用途 |
|------|------|
| Next.js 14 (App Router) | フレームワーク |
| TypeScript | 型安全性 |
| Tailwind CSS | スタイリング |
| SQLite (better-sqlite3) | ダミーデータ用DB |
| NextAuth.js v4 | 認証 |
| @anthropic-ai/sdk | Claude API |
| Recharts | グラフ |
| Lucide React | アイコン |

## DB構造

```
.data/sophi-be.db    ← 自動生成されるSQLiteファイル
```

テーブル:
- `users` — 匿名ユーザー（50件）
- `utterances` — 発話データ（300件）
- `search_logs` — 検索ログ（100件）

## 本番環境への移行

ダミーDBを本番DBに差し替える際は以下を変更:
1. `src/lib/db/index.ts` — DB接続をPostgreSQL/MySQLに変更
2. `src/lib/db/schema.ts` — 本番スキーマに合わせてSQL修正
3. `src/lib/db/seed.ts` — 不要になるため削除
4. 各APIルートの生SQLクエリをORMやDB接続ライブラリに置き換え

## ディレクトリ構造

```
src/
├── app/
│   ├── api/                    # APIルート
│   │   ├── auth/               # NextAuth
│   │   ├── search/             # キーワード検索
│   │   ├── trends/             # トレンド取得
│   │   ├── groups/             # AIグルーピング
│   │   ├── utterances/         # 発話一覧
│   │   ├── users/[userId]/     # ユーザー詳細
│   │   └── dashboard/          # ダッシュボードデータ
│   ├── (authenticated)/        # 認証必須ページ
│   │   ├── search/             # トップ検索画面
│   │   ├── results/            # 検索結果
│   │   ├── users/[userId]/     # チャット履歴詳細
│   │   └── dashboard/          # 分析ダッシュボード
│   └── login/                  # ログイン画面
├── components/
│   ├── layout/                 # ヘッダー・サイドバー
│   ├── auth/                   # ログインフォーム
│   ├── ui/                     # UIコンポーネント
│   └── charts/                 # Rechartsグラフ
├── lib/
│   ├── db/                     # DB接続・スキーマ・シード
│   ├── auth.ts                 # NextAuth設定
│   └── anthropic.ts            # Claude API設定
└── types/                      # TypeScript型定義
```
