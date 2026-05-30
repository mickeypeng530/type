# VoiceReport 🩻

口說打放射報告 — 對手機/電腦說一句話，自動挑模板、把該翻陽性的項目填好，輸出可貼進 PACS 的報告文字。

> 例：說「CT noncontrast brain, no bleeding」→ 出 CT brain 全正常模板。
> 說「CT noncontrast brain, acute hemorrhage at right basal ganglia」→ 同模板，把對應行翻成陽性、其餘維持正常。

單檔 SPA、零 build、可直接丟 GitHub Pages。

**STT 用作業系統內建聽寫**（iOS 鍵盤 🎤 / Windows Win+H）把語音打進口述框 —— 免費、穩、跨平台。app 本身不做語音辨識。

## 兩種模式

- 🆓 **免費模式（預設）**：本地關鍵字選模板，顯示模板原文。**零成本、不用 key**。
- 🧠 **智慧模式**：把口述文字送 gpt-4o-mini 自動選模板 + 翻陽性填寫，需 OpenAI API key（成本僅 LLM，不含 STT）。

## 流程

```
①口述框：OS 聽寫/打字 ─▶ 按「產生報告」
   ├─ 免費：本地關鍵字選模板 → 顯示原文
   └─ 智慧：gpt-4o-mini 選模板 + 翻陽性填寫
                                    └─▶ ②可編輯結果 + 複製
```

## 用法

1. 開 `index.html`（GitHub Pages，或本機 `python -m http.server`）。
2. （智慧模式才需要）⚙️ → 貼上 **OpenAI API key**（只存瀏覽器 localStorage）。
3. 點①口述框 → 用鍵盤 🎤 說話或打字 → 按「產生報告」→ 複製結果。

## 隱私

- API key 只存本機 `localStorage`，不會進 repo。
- ⚠️ 智慧模式文字會送往 OpenAI 雲端；口述時請勿念病歷號／姓名等個資。免費模式不外送。

## 自訂

| 想改 | 改哪 |
|---|---|
| 模板內容/新增模板 | `index.html` 的 `TEMPLATES` 陣列 |
| 智慧模式填寫/翻陽性規則 | `buildSystemPrompt()` |
| 免費模式選模板規則 | `matchTemplate()` |
| 模型/溫度 | `fillTemplate()` |

詳見 [STATE.md](STATE.md)。

## Roadmap

- [x] Phase 1：單檔 SPA（OS 聽寫 → 選模板/填寫 → 複製）
- [ ] Phase 2：Firebase 中繼 + Windows AHK 監聽 → 手機說、工作站自動貼上
- [ ] Phase 3：擴充模板（目前 6 個）
