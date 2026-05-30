# VoiceReport 🩻

口說打放射報告 — 對手機/電腦說一句話，自動挑模板、把該翻陽性的項目填好，輸出可貼進 PACS 的報告文字。

> 例：說「CT noncontrast brain, no bleeding」→ 出 CT brain 全正常模板。
> 說「CT noncontrast brain, acute hemorrhage at right basal ganglia」→ 同模板，把對應行翻成陽性、其餘維持正常。

單檔 SPA、零 build、可直接丟 GitHub Pages。

## 兩種模式

- 🆓 **免費模式（預設）**：瀏覽器內建語音辨識 + 本地關鍵字選模板，顯示模板原文。**零成本、不用 key**，用來驗證手機收音。
- 🧠 **智慧模式**：Whisper 轉錄 + gpt-4o-mini 自動翻陽性填寫，需 OpenAI API key。

## 流程

```
錄音 ─▶ Whisper 轉錄(放射詞彙偏置) ─▶ gpt-4o-mini 選模板+填寫 ─▶ 可編輯結果 + 複製
```

## 用法

1. 開 `index.html`（GitHub Pages 或本機 `python -m http.server`；`file://` 拿不到麥克風）。
2. ⚙️ 設定 → 貼上你的 **OpenAI API key**（只存瀏覽器 localStorage，不進原始碼）。
3. 按住 🎙️ 說話 → 放開 → 等轉錄+填模板 → 複製結果。

## 隱私

- API key 只存本機 `localStorage`，不會進 repo。
- ⚠️ 音訊與文字會送往 OpenAI 雲端；口述時請勿念病歷號／姓名等個資。

## 自訂

| 想改 | 改哪 |
|---|---|
| 模板內容/新增模板 | `index.html` 的 `TEMPLATES` 陣列 |
| 選模板/翻陽性規則 | `buildSystemPrompt()` |
| Whisper 聽不準的詞 | `ASR_VOCAB` |
| 模型/溫度 | `fillTemplate()` |

詳見 [STATE.md](STATE.md)。

## Roadmap

- [x] Phase 1：單檔 SPA（錄音 → 轉錄 → 填模板 → 複製）
- [ ] Phase 2：Firebase 中繼 + Windows AHK 監聽 → 手機說、工作站自動貼上
- [ ] Phase 3：擴充模板（目前 6 個）
