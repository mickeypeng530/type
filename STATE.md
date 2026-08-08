# VoiceReport — 現況快照(v4)

## 1. 這專案在做什麼
口說打放射報告。對著手機/電腦說一句(例：「CT noncontrast brain, no bleeding」)
→ 自動轉錄 → 挑對模板 → 依口述把該翻陽性的項目改掉、其餘維持正常 → 出報告文字、可複製貼進 PACS。

走「路線 B」：**OpenAI API + 單檔 SPA**(非 LizardType 的 macOS cookie 方案——那條在 Windows 走不通)。

## 2. 現在進度到哪
- ✅ **v4 三頁籤單頁（2026-08-08）**:`index.html` 一頁三 tab、只登入一次:
  **📋 中興模板 / ⌨️ 短句 / 🎤 口說**(分頁選擇記在 localStorage `vr_tab`)。
  舊 `snippets.html` 改成轉址頁(保留書籤)。
  **版號 = 日期 + 流水號**(`?v=YYYYMMDD.N`,例 `20260808.2` → 畫面顯示 `2026-08-08 #2`)。
  升版跑 `python tools/bump_version.py`(同日 +1、跨日歸 1);script 的 `?v=` 是唯一真相,
  標題列與登入畫面的版號由 JS 讀 script src 顯示(`APP_VERSION`),永遠等於實際載入的版本。
- ✅ **登入改 retake 模式**:共用密碼(Firebase Email/Password 帳號 `viewer@voicereport.app`,
  密碼由 Firebase Auth 保管、程式碼與 RTDB 都不存;換密碼只要在 Console 改)
  + 管理者 Google 登入(owner `deer530530@gmail.com` 才有寫入權)。
  設定在 `firebase-init.js`(OWNER_UID / SHARED_UID / SHARED_EMAIL)。登入提示文字:intra。
- ✅ **中興模板頁**:7 組模板(Brain+TOF / MRCP上腹 / MRI腰薦椎 / MRI全脊椎 / 全身MRI / LDCT / Cardiac Ca)。
  **模板變體機制**:同 `group` 的多個區塊會併成上排一顆按鈕 + 內層子頁籤(目前 MRCP 有「沒打藥 / 有打藥」兩版,
  選擇記在 localStorage `vr_cxvar_*`);extras 以 group 為單位合併,所以 Dixon 對照表兩版都看得到。
  LDCT / Cardiac Ca 版面 = **左邊輸出可複製、右邊輸入**(窄於 1040px 自動改上下排,輸入在上)。
  前 5 個可在網頁內編輯後複製(編輯暫存 localStorage `vr_cx_*`,存 `{text, base}`——**上游模板改版時 base 不符會自動丟棄舊暫存**,否則新模板永遠出不來),附「選配句」按鈕插入游標處。
  LDCT 與 Cardiac Ca 是**輸入式產生器**(移植自 `../0 HealthExamTemplete_stu2026.ahk`,見 `report-gen.js`)。
- ✅ **Phase 1 / v2（完成）**：`index.html` 單檔 SPA。**核心 UX = 口述進文字框 → 按「產生報告」**。
  - **STT 改用 OS 系統聽寫**（iOS 鍵盤 🎤 / Windows Win+H）直接打進①口述框 → 免費、穩、跨平台。
  - 🆓 **免費模式（預設）**：本地關鍵字規則選模板（`matchTemplate()`）→ 顯示模板原文。零 key、零成本。
  - 🧠 **智慧模式**：把口述文字送 gpt-4o-mini 選模板+翻陽性填寫。需 API key，**但不再需要 Whisper**（STT 已由 OS 免費做掉）→ 成本只剩 LLM 那一點。
  - ⛔ 已放棄：Web Speech API（`webkitSpeechRecognition`）、瀏覽器 MediaRecorder→Whisper —— iOS Safari 回 `service-not-allowed`，按住錄音的按鈕在 iOS 不能用。
- ✅ **A1 模板全量化（2026-07-11 完成）**：`tools/parse_ahk.py` 把 `../0 Peng Rclick.ahk`（Big5）解析成 `templates.js`（**236 完整模板**，34 個含 impression）+ `phrases.js`（1103 短語）；25 個純巨集跳過（已逐一確認非模板）。帳目核對 1364 = 1339 + 25 ✓。人工抽查頁：`tools/review.html`。
- ✅ **A2 免費模式全量化（2026-07-11 完成）**：`index.html` v3 接上 236 模板。
  - `matcher.js`：計分制選擇器（IDF 權重 + modality 硬約束 + contrast 三態 + 覆蓋率懲罰 + 誤聽別名 + 縮寫直達如 `ct2b`）。
  - UI：自動選中 or 前 5 候選 pills 點選；**歧義偏好記憶**（點過一次存 localStorage `vr_pref`，下次同樣歧義自動選）；findings / IMPRESSION 分欄各自複製。
  - `eval.html`：命中率跑分頁。48 條合成 + **31 條真實口述（REAL；首批 3 + 對稿批次 28，稿在 `tools/dictation_script.md`）**：Top-1 81%、Top-3 91%。真實誤聽已收 20+ 條進 matcher（City≈CT、with our≈without、with whistle≈with and without、Trust≈chest、Am I≈MRI、Perng/Prem≈brain、threshold≈shoulder、Avoiding system≈VCUG…）。
  - **重要發現：iOS 英文聽寫是全系統瓶頸**——對稿 28 句中約 7 句資訊全毀（"Trust"、"; X-ray"、"Is"…），任何 matcher 都救不了，只能靠候選 pills / 打縮寫兜底；這強化了 B 路線（工作站 + 本地 whisper STT）的價值。
- ⏳ **A3（待做）**：智慧模式改**行號制 patch**（模型回 `{line, replace}`，JS apply，未動行保證逐字不變）+ LLM 選模板 fallback（要先幫 236 模板補 `desc` 欄——v2 有、v3 解析時沒生）+ phrases.js 餵措辭。目前過渡版：本地選模板 → 單模板全文重寫 prompt（含斜線二選一、impression 同步），API base/模型已可設定（預設 gpt-5-mini `reasoning_effort: minimal`）。
- 🟡 **B 工作站直通（POC 進行中）**：工作站有耳機麥克風（已確認）；**待確認：能否跑 exe**。
  - **本地 STT POC（2026-07-11，家用機 i7-13700 純 CPU）**：faster-whisper small int8 = **3.2× 即時**，TTS 測句近乎全對（iOS 聽寫同句全毀）。工具：`tools/whisper_test.py`（`--mic 15` 錄音測 / 直接餵 m4a）。含放射詞彙 initial_prompt。
  - 坑：Windows 上 OpenMP DLL 衝突 → 需 `KMP_DUPLICATE_LIB_OK=TRUE`（腳本內已設）。
  - large-v3-turbo：**1.2× 即時**（13.8s 音檔 11.4s 轉完），措辭再上一級（intracerebral 全對）。small vs turbo 的取捨待使用者真嗓測試定案。
  - **網頁測試台（B 路線 UI 雛形）**：`python tools/whisper_server.py` → 開 http://localhost:8766 → 按 🎤 講、再按結束、看轉錄（可切 small/turbo、複製結果）。架構 = 瀏覽器 MediaRecorder → 本機 HTTP POST → faster-whisper。CLI 版：`tools/whisper_test.py`。
  - **純瀏覽器版 `whisper.html`（transformers.js，零安裝）已做已測，結論=備胎**：家用機 WebGPU（UHD 770）上 base 快但爛、small 準度中等且僅 0.7× 即時（吃不到 initial_prompt + q4 量化）。只留給「工作站連 Python 都不能裝」的最壞情境，且需靠下游 LLM 拼字救援（Stonosis→stenosis 這類）；能裝就用 faster-whisper。
  - 坑：huggingface_hub 舊版在 Windows 無開發者模式時 symlink 下載會炸（WinError 1314）→ 升級 huggingface_hub 即修。
- ⏳ **C 手機中繼（選配）**：Firebase RTDB，只在 B 走不通時才做。
- ✅ **部署（C 方案,2026-07-12 v3 已上線 commit 1bbd1a5）**：模板庫上鎖——templates.js/phrases.js 不進 repo，線上版 Google 登入(純 popup)→ RTDB `/voiceReport/*` 載模板，rules 鎖 `deer530530@gmail.com`(規則已含既有 users/paperRadar,共用 income-41a40)。雲端現況 236/1101(psh、pshid 已清)。模板同步一條命令 `python tools/upload_rtdb.py`(admin key 複製自 Worknum/scripts,gitignored);admin.html 為瀏覽器備援。本地有 templates.js 自動走本地模式。
- ✅ **snippets.html（2026-07-12）**：純網頁版可複製 hotkey——公用電腦不能裝 AHK 時的替代。打縮寫(nln/ct2b)→ Enter 複製第一筆,或關鍵字搜尋 → 點按複製;涵蓋全部 236 模板 + 1101 短句。全部/短句/模板 篩選;模板另出 Impression 鈕。與 index.html 共用 firebase-config(雲端登入載 templates+phrases)、templates.js/phrases.js(本地)。**獨立頁,不動 index.html 設計**;彼此以 header 連結互通。
- 決策脈絡見 [DECISION_LOG.md](DECISION_LOG.md)。

## 3. 架構速覽
- **v4 檔案結構**(零 build,GitHub Pages 直上):
  - `index.html` — 殼 + 登入 + 三個 tab 的全部 UI/邏輯
  - `firebase-init.js` — Firebase config + `OWNER_UID` / `SHARED_UID` / `SHARED_EMAIL`(取代舊 firebase-config.js)
  - `matcher.js` — 口說分頁的選模板計分器
  - `report-gen.js` — 中興分頁的 LDCT / Cardiac Ca 產生器(移植自 health AHK)
  - `templates.js` / `phrases.js` / `cx-templates.js` — 本機資料檔(gitignored,線上走 RTDB)
  - `snippets.html` — 轉址頁(舊書籤相容)
- **中興模板**:source of truth = `../中興標準template.txt`,由 `tools/parse_cx.py` 解析成
  `{id,name,body,extras[],generator}`;`generator:true` 的兩個(LDCT/Cardiac)由 report-gen.js 接手。
- 單檔 `voice-report/index.html`，零 build、可丟 GitHub Pages。
- **STT = OS 系統聽寫**（app 本身不做 STT）：使用者點①口述 `textarea`，用 iOS 鍵盤 🎤 或 Windows Win+H 把語音轉成文字。免費、穩。
- **填模板**：`gpt-4o-mini`，`response_format=json_object`，回 `{templateId, report}`。核心邏輯在 `buildSystemPrompt()`。輸入是①口述框的純文字。
- **免費選模板**：`matchTemplate()` 規則式（modality/region/contrast 關鍵字）→ 顯示原文。
- **模板目錄**：`TEMPLATES` 陣列(id / name / desc / base)。`desc` 給模型挑選用。
- API key 存 `localStorage`(key `vr_openai_key`)，不進原始碼。模式存 `vr_mode`。
- **全量模板庫（A1 產出，A2 才接上 UI）**：
  - `tools/parse_ahk.py` — parser（Python，讀 cp950）。重跑：`python tools/parse_ahk.py`。
  - `templates.js` — `TEMPLATES`：236 個 `{id, name, findings, impression, extra, note, srcLine, kind}`。
  - `phrases.js` — `PHRASES`：1103 個 `{id, text, note, srcLine, kind}`（= AHK 縮寫語料，餵 LLM 當本院措辭參考）。
  - `tools/review.html` — 離線抽查頁（資料內嵌，瀏覽器直接開）。
  - **AHK 檔（`../0 Peng Rclick.ahk`）是唯一 source of truth**，templates.js/phrases.js 禁止手改。
  - **敏感排除**：parser 頂部 `SENSITIVE_ABBREVS`(目前 psh=簽名檔、pshid=證號)永不進庫;AHK 裡的帳密巨集(如 padm)本來就因純巨集被跳過。**新增密碼類 hotstring 時記得檢查這份名單**。現為 236 模板 / 1101 短語。

## 4. 常見坑 / 防雷
- **iOS 不要用 Web Speech / MediaRecorder 按鈕**：`webkitSpeechRecognition` 回 `service-not-allowed`，錄音按鈕在 iOS 不能用。已改走 OS 聽寫打進 textarea（v2 的關鍵轉折）。
- **個資合規**：智慧模式文字會送 OpenAI 雲端。口述勿念病歷號/姓名。UI 已有警語。免費模式不外送。
- **模板 #2 vs #3** 內文相同、只差標題(without vs with/without contrast)，靠口述有沒有講 contrast 區分。
- **MRI 模板**基底不是全正常——預設含老化(atrophy/small vessel)兩行，是科室慣例，別當 bug。
- **免費模式不翻陽性**：`matchTemplate()` 只選模板顯示原文；翻陽性要 LLM（智慧模式）。
- **AHK 檔是 Big5（cp950）**：用 UTF-8 讀會整片亂碼。parser 用 `decode("cp950")` strict 模式（有問題直接炸，不默默吞）。
- **AHK `{tab}` = PACS 跳下一欄位**（findings → impression），不是替代句。`(...)` 區塊的判定要跟 AHK 規則一致：內容行也可能以 `(` 開頭（如 `(1) axial T2WI`），只有「緊接定義行/`Clipboard =` 後的 `(`」才是區塊開頭，`)` 開頭的行才收尾。
- **script 型 hotstring 藏著真模板**（如 `xc/`）：靠剪貼簿貼上多段 + `send {tab}`，parser 有專門處理;純鍵盤巨集（開網址/刪行）才跳過。
- **matcher 的 c/l/t-spine 縮寫正規化必須帶 `\b`**：不然 "lumbosacra**l spine**"、"cervica**l spine**" 會被 `/l[\s-]?spine/` 誤咬成 lumbar spine（已踩過）。
- **RTDB rules 是「整份取代」,本機 `database.rules.json` 可能過期**:2026-08-08 差點用舊檔覆蓋,
  會弄掉線上才有的 worknum 規則。**改 rules 一律「先讀線上 → 只改自己那個節點 → 寫回」**,
  並先備份到 `tools/rules-backup.json`。
- **Firebase API key 有 HTTP referrer 白名單**:`localhost` / `127.0.0.1` 被擋
  (`auth/requests-from-referer-...-are-blocked`),所以**雲端登入只能在 github.io 上測**,
  本機只能測本機模式。要在本機測雲端就得去 GCP Console 把 localhost 加進白名單。
- **eval.html 目前是合成測試集**，數字只證明機制通、不代表真實口述表現;拿到真實測資要整批替換再看分數。

## 5. 接手者 cheatsheet
- **改模板 → 改 `../0 Peng Rclick.ahk`，然後 `python tools/upload_rtdb.py`(= 解析 + 上雲 + 驗證,一條命令)**。需 `service-account.json` 在 voice-report/(gitignored;Console → 服務帳戶 → 產生私密金鑰)。只想重生本地檔不上雲 → `python tools/parse_ahk.py`。瀏覽器手動備援 → `admin.html`。
- **改中興模板 → 改 `../中興標準template.txt`,然後同樣跑 `python tools/upload_rtdb.py`**
  (它會同時跑 parse_ahk.py 與 parse_cx.py 再上雲)。
- **改完任何前端檔要部署前先跑 `python tools/bump_version.py`**(升版號 + 破快取)。
- 改 LDCT / Ca 產生器的文字或邏輯 → `report-gen.js`(選項常數在檔案最上方,與 AHK 下拉原文一致)。
- 抽查解析結果 → 瀏覽器開 `tools/review.html`（可過濾）。
- 改選模板規則/誤聽別名/同義詞 → `matcher.js`（MISHEAR / SYN / NAME_EXPAND / 計分在 `vrMatch`、自動選門檻在 `vrPick`）。
- 改後必跑 → 開 `eval.html` 看 Top-1/Top-3 有沒有退步（防 regression，10 秒）。
- 改填寫規則/翻陽性邏輯 → `index.html` 的 `buildSystemPrompt()`。
- 換模型/端點 → UI 的 ⚙️ 設定（存 localStorage：`vr_openai_key` / `vr_api_base` / `vr_api_model`）。
- 測試：`python -m http.server` 後開 `index.html` → ①口述框打字或聽寫 → 按「產生報告」。智慧模式要先 ⚙️ 填 key。

## 6. 規則(自我約束)
- 模板文字必須與 AHK 原文逐字一致(空行、縮排、bullet 都算)；LLM 填寫走 patch 制，未動的行 byte-level 不變。
- **templates.js / phrases.js 禁止手改**——它們是 parser 產物,改模板一律改 AHK 檔後重跑。
- 不過度設計：維持零 build（index.html + 兩個資料檔），Firebase 只在 C 階段且 B 走不通時引入。
- 結構/模板/流程有變即時更新本檔；決策(含被拒方案)記 DECISION_LOG.md。
