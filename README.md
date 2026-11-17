# Arcana — Idea Alchemy

手機優先、Local-first 的創作者發想煉金桌。

**網站：** https://straymist.github.io/arcana/

## 在桌上做什麼

- 78 張共用素材牌，G／O／M 三欄自由解讀。可新增、編輯、刪除或標記不參與抽牌。
- 方向牌獨立一排，預設蓋牌；點亮星星抽新方向並揭開，再點則蓋回。全部重抽保留開／蓋牌狀態。
- 逆向、側向、深度變換、空牌。側向晶球有 1,194 個詞；深度牌可切換上升／下降。
- 水槽保存有日期的想法、長文字、來源及牌陣快照，支援搜尋、浮力與日期排序。
- 想法與素材共用 6 類、72 個預設圖示，也可上傳自己的圖片；鍛造時繼承圖示。
- 複製目前牌陣的解牌提示，交給其他 AI 探索遊戲提案。蓋牌方向不帶入提示。

## 資料保存在自己的瀏覽器

不需要帳號、API Key 或後端。網站使用 localStorage，支援 JSON 匯出、確認後合併／覆蓋匯入。換裝置、瀏覽器或網址時，請先備份並自行還原。個人想法與上傳圖示不會自動送到 GitHub。

## 開發

需要 Node 20+；沒有前端套件依賴。

```sh
node scripts/build.mjs
node --test tests/data.test.mjs
node scripts/dev.mjs
```

直接開啟 index.html；dev 只監看並重新打包，不啟動伺服器。修改 src 後執行 build，將更新的 index.html 一起提交。GitHub Pages 使用 main 分支根目錄。

來源分為 data、storage、spread、direction、orb、cauldron、card-icons、prompt、ui 等模組；單檔 HTML 是建置產物。

## 驗證與限制

2026-11-17：建置、30 項資料測試、89 項 Chrome／Playwright 互動檢查通過（390×844 手機、1440×1000 桌面）。另檢查 320px 窄螢幕。這不等同 iPhone Safari 實機驗收。

瀏覽器測試需要另外安裝 Playwright，或設定 PLAYWRIGHT_MODULE 與 CHROME_PATH 後執行 node tests/browser.mjs；它不是網站執行依賴。

目前沒有 PWA、雲端同步、內建 AI API、完整 RES 牌陣或流體物理。
