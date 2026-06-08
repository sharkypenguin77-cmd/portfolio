# Sharky Penguin Portfolio

這是一個簡潔的影片作品集網站。第一版先保留 Showreel 和作品區，之後可以逐步加入影片作品。

## 如何預覽

直接用瀏覽器開啟 `index.html` 就可以看網站。

## 如何新增作品

打開 `works.js`，修改 `window.portfolioWorks = [...]` 裡面的作品清單。

目前裡面放的是範例作品。如果要換成正式作品，可以直接改每一筆資料的文字，也可以刪掉範例後新增自己的作品。

範例：

```js
window.portfolioWorks = [
  {
    title: "作品名稱",
    year: "2026",
    category: "brand",
    categoryLabel: "形象影片",
    role: "剪輯 / 調色 / 字幕",
    tools: "Premiere Pro, After Effects",
    description: "用一到兩句話說明這支作品的目的、風格或你負責的部分。",
    videoUrl: "https://www.youtube.com/watch?v=影片ID",
    thumbnailUrl: "",
    isSample: false
  }
];
```

常用欄位意思：

- `title`：作品名稱
- `year`：年份
- `category`：分類代碼，要填下方四種之一
- `categoryLabel`：畫面上顯示的分類名稱
- `role`：你負責的工作
- `tools`：使用工具
- `description`：作品簡介
- `videoUrl`：影片連結，可以放 YouTube、Vimeo 或其他公開連結
- `thumbnailUrl`：縮圖連結，先留空也可以
- `isSample`：範例作品填 `true`，正式作品填 `false`

可用分類：

- `brand`：形象影片
- `short`：短影音
- `social-ad`：社群廣告
- `youtube`：YT長片
- `nonprofit`：公益影片

## Showreel

目前首頁 Showreel 區塊先放範例展示。之後有代表作品或剪輯精華時，可以再改成 YouTube / Vimeo 嵌入影片。

## 後續更新方式

新增作品時，只要在 `works.js` 的 `window.portfolioWorks = [...]` 裡新增一筆資料。

替換作品時，直接改原本那一筆的標題、年份、分類、說明、影片連結和縮圖連結。

刪除作品時，刪掉對應的 `{ ... }` 那一整筆資料即可。

如果你不確定格式，可以先複製一筆範例作品，再把裡面的文字換成正式作品資料。

## 使用本機後台更新

如果不想手動改 `works.js`，可以使用本機後台。

最簡單的方式是點兩下：

```text
start-admin.bat
```

也可以在 `J:\portfolio` 開啟 PowerShell，執行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\admin-server.ps1
```

接著打開：

```text
http://127.0.0.1:8787/admin.html
```

使用方式：

- 按「新增作品」建立新作品
- 填入 YouTube、Vimeo、Instagram 或 Facebook 影片網址
- YouTube / Vimeo 會自動產生嵌入網址，可以在網站內播放
- Instagram 公開貼文會用 Instagram 內嵌顯示
- Facebook 會作為外部連結，點圖片後開新分頁
- 如果要直接上傳影片檔，可以選擇 mp4、webm、mov、m4v 或 ogg，按「上傳影片並填入網址」
- 按「套用到清單」
- 按「儲存作品資料」寫入 `works.js`
- 確認本機網站沒問題後，按「部署上線」

部署完成後，GitHub Pages 通常 1 到 3 分鐘後會更新。

注意：GitHub 不適合放很大的影片檔。單支影片請盡量小於 95MB；更大的作品建議上傳到 YouTube 或 Vimeo，再把網址貼到後台。
