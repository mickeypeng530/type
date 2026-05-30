# VoiceReport — 現況快照

## 1. 這專案在做什麼
口說打放射報告。對著手機/電腦說一句(例：「CT noncontrast brain, no bleeding」)
→ 自動轉錄 → 挑對模板 → 依口述把該翻陽性的項目改掉、其餘維持正常 → 出報告文字、可複製貼進 PACS。

走「路線 B」：**OpenAI API + 單檔 SPA**(非 LizardType 的 macOS cookie 方案——那條在 Windows 走不通)。

## 2. 現在進度到哪
- ✅ **Phase 1（完成）**：`index.html` 單檔 SPA。錄音 → Whisper 轉錄 → gpt-4o-mini 選模板+填寫 → 顯示可編輯結果 + 複製。iOS Safari / Windows 瀏覽器皆可。
- ⏳ **Phase 2（待做）**：Firebase RTDB 中繼 + Windows 端 AHK 監聽 → 自動 Ctrl+V 貼進 PACS（手機說、電腦貼）。
- ⏳ **Phase 3（待做）**：擴充模板(目前 6 個 → 朝 AHK 的 1168 個)；可由 AHK 自動解析重生 `TEMPLATES` 區塊。

目前模板：6 個(CT brain NC、Chest CT ±contrast×2、Abdomen CT、Brain MRI、CT CAP)。

## 3. 架構速覽
- 單檔 `voice-report/index.html`，零 build、可丟 GitHub Pages。
- **STT**：OpenAI `whisper-1`，附 `ASR_VOCAB` 放射科詞彙偏置(對治非母語口音)。
- **填模板**：`gpt-4o-mini`，`response_format=json_object`，回 `{templateId, report}`。核心邏輯在 `buildSystemPrompt()`。
- **模板目錄**：`TEMPLATES` 陣列(id / name / desc / base)。`desc` 給模型挑選用。
- API key 存 `localStorage`(key `vr_openai_key`)，不進原始碼。

## 4. 常見坑 / 防雷
- **iOS Safari 錄音格式**：MediaRecorder 在 iOS 多吐 `audio/mp4`，桌機吐 `audio/webm`。`pickMime()` 已自動選，`transcribe()` 依此決定上傳副檔名(m4a/webm)——Whisper 兩種都吃。
- **個資合規**：音訊+文字會送 OpenAI 雲端。口述勿念病歷號/姓名。UI 已有警語。
- **模板 #2 vs #3** 內文相同、只差標題(without vs with/without contrast)，靠口述有沒有講 contrast 區分。
- **MRI 模板**基底不是全正常——預設含老化(atrophy/small vessel)兩行，是科室慣例，別當 bug。
- **「按住說話」**用 pointer 事件，桌機滑鼠、手機觸控都通。

## 5. 接手者 cheatsheet
- 改模板 → 編 `index.html` 裡的 `TEMPLATES` 陣列(`base` 用 backtick 字串，整段原樣貼)。
- 改填寫規則/翻陽性邏輯 → `buildSystemPrompt()`。
- 改 Whisper 聽不準的詞 → `ASR_VOCAB` 加詞。
- 換模型/溫度 → `fillTemplate()`。
- 測試：瀏覽器開 `index.html` → ⚙️ 填 API key → 按住錄音說一句放開。

## 6. 規則(自我約束)
- 模板 `base` 必須與使用者提供的原文逐字一致(空行、縮排、bullet 都算)。
- 不過度設計：維持單檔 SPA，Phase 2 才引入 Firebase/AHK。
- 結構/模板/流程有變即時更新本檔。
