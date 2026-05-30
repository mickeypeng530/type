# VoiceReport — 現況快照

## 1. 這專案在做什麼
口說打放射報告。對著手機/電腦說一句(例：「CT noncontrast brain, no bleeding」)
→ 自動轉錄 → 挑對模板 → 依口述把該翻陽性的項目改掉、其餘維持正常 → 出報告文字、可複製貼進 PACS。

走「路線 B」：**OpenAI API + 單檔 SPA**(非 LizardType 的 macOS cookie 方案——那條在 Windows 走不通)。

## 2. 現在進度到哪
- ✅ **Phase 1 / v2（完成）**：`index.html` 單檔 SPA。**核心 UX = 口述進文字框 → 按「產生報告」**。
  - **STT 改用 OS 系統聽寫**（iOS 鍵盤 🎤 / Windows Win+H）直接打進①口述框 → 免費、穩、跨平台。
  - 🆓 **免費模式（預設）**：本地關鍵字規則選模板（`matchTemplate()`）→ 顯示模板原文。零 key、零成本。
  - 🧠 **智慧模式**：把口述文字送 gpt-4o-mini 選模板+翻陽性填寫。需 API key，**但不再需要 Whisper**（STT 已由 OS 免費做掉）→ 成本只剩 LLM 那一點。
  - ⛔ 已放棄：Web Speech API（`webkitSpeechRecognition`）、瀏覽器 MediaRecorder→Whisper —— iOS Safari 回 `service-not-allowed`，按住錄音的按鈕在 iOS 不能用。
- ⏳ **Phase 2（待做）**：Firebase RTDB 中繼 + Windows 端 AHK 監聽 → 自動 Ctrl+V 貼進 PACS（手機說、電腦貼）。
- ⏳ **Phase 3（待做）**：擴充模板(目前 6 個 → 朝 AHK 的 1168 個)；可由 AHK 自動解析重生 `TEMPLATES` 區塊。

目前模板：6 個(CT brain NC、Chest CT ±contrast×2、Abdomen CT、Brain MRI、CT CAP)。

## 3. 架構速覽
- 單檔 `voice-report/index.html`，零 build、可丟 GitHub Pages。
- **STT = OS 系統聽寫**（app 本身不做 STT）：使用者點①口述 `textarea`，用 iOS 鍵盤 🎤 或 Windows Win+H 把語音轉成文字。免費、穩。
- **填模板**：`gpt-4o-mini`，`response_format=json_object`，回 `{templateId, report}`。核心邏輯在 `buildSystemPrompt()`。輸入是①口述框的純文字。
- **免費選模板**：`matchTemplate()` 規則式（modality/region/contrast 關鍵字）→ 顯示原文。
- **模板目錄**：`TEMPLATES` 陣列(id / name / desc / base)。`desc` 給模型挑選用。
- API key 存 `localStorage`(key `vr_openai_key`)，不進原始碼。模式存 `vr_mode`。

## 4. 常見坑 / 防雷
- **iOS 不要用 Web Speech / MediaRecorder 按鈕**：`webkitSpeechRecognition` 回 `service-not-allowed`，錄音按鈕在 iOS 不能用。已改走 OS 聽寫打進 textarea（v2 的關鍵轉折）。
- **個資合規**：智慧模式文字會送 OpenAI 雲端。口述勿念病歷號/姓名。UI 已有警語。免費模式不外送。
- **模板 #2 vs #3** 內文相同、只差標題(without vs with/without contrast)，靠口述有沒有講 contrast 區分。
- **MRI 模板**基底不是全正常——預設含老化(atrophy/small vessel)兩行，是科室慣例，別當 bug。
- **免費模式不翻陽性**：`matchTemplate()` 只選模板顯示原文；翻陽性要 LLM（智慧模式）。

## 5. 接手者 cheatsheet
- 改模板 → 編 `index.html` 裡的 `TEMPLATES` 陣列(`base` 用 backtick 字串，整段原樣貼)。
- 改填寫規則/翻陽性邏輯 → `buildSystemPrompt()`。
- 改免費模式選模板規則 → `matchTemplate()`。
- 換模型/溫度 → `fillTemplate()`。
- 測試：瀏覽器開 `index.html` → ①口述框打字或聽寫 → 按「產生報告」。智慧模式要先 ⚙️ 填 key。

## 6. 規則(自我約束)
- 模板 `base` 必須與使用者提供的原文逐字一致(空行、縮排、bullet 都算)。
- 不過度設計：維持單檔 SPA，Phase 2 才引入 Firebase/AHK。
- 結構/模板/流程有變即時更新本檔。
