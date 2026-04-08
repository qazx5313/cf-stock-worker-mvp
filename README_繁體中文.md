# Cloudflare Worker 台股 API MVP 教學

## 1. 安裝必要工具
先安裝：
- Node.js 18 以上
- npm
- Cloudflare 帳號

確認版本：
```bash
node -v
npm -v
```

## 2. 安裝專案套件
```bash
npm install
```

## 3. 登入 Cloudflare
```bash
npx wrangler login
```
瀏覽器會跳出登入頁，登入後回到終端機。

## 4. 建立 KV
```bash
npx wrangler kv namespace create PORTFOLIO_KV
npx wrangler kv namespace create PORTFOLIO_KV --preview
```
把回傳的兩組 id 貼到 `wrangler.toml`：
- `id` 放正式用
- `preview_id` 放本機測試用

## 5. 啟動本機開發
```bash
npm run dev
```
看到本機網址後，打開瀏覽器。

可測試：
- `/api/health`
- `/api/tw/quote/2330`
- `/api/tw/search?q=2330`

## 6. 部署上線
```bash
npm run deploy
```
部署成功後會得到 `.workers.dev` 網址。

## 7. API 路徑
### 健康檢查
`GET /api/health`

### 台股報價
`GET /api/tw/quote/:stockId`

### 台股搜尋
`GET /api/tw/search?q=2330`

### 儲存投資組合
`POST /api/portfolio/save`
```json
{
  "userId": "demo",
  "holdings": [
    { "symbol": "2330", "qty": 2, "cost": 950 }
  ]
}
```

### 取得投資組合
`GET /api/portfolio/demo`

## 8. 常見卡點
### 找不到 wrangler
先跑：
```bash
npm install
```

### KV 沒綁定
表示你還沒把 `wrangler kv namespace create` 回傳的 id 貼進 `wrangler.toml`。

### TWSE 抓不到
先測試 `/api/health`，如果正常，再測 `/api/tw/quote/2330`。

## 9. 下一步建議
你之後可以再加：
- 美股 API
- 新聞 API
- 技術指標計算
- Google OAuth 登入
- OpenAI 診斷
