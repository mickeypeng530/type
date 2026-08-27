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
  **改密碼**(2026-08-27):以共用密碼登入時,header 出現「🔑 改密碼」——
  舊密碼 reauthenticate → `updatePassword`,密碼全程只在瀏覽器裡,程式碼/RTDB 都不存。
  用 Google(owner)登入時**不顯示**該鈕:`updatePassword` 只能改當下登入的帳號,
  那樣改到的會是 Google 帳號。忘記密碼的退路仍是 Firebase Console 重設。
- ✅ **中興模板頁**:14 組、22 個模板(brain 三變體、MRCP 兩變體、
  MSK 五個部位各拆左右兩變體 —— 標題含 `left/right` 的在 parse 時由 `SIDE_RE` 換成單邊,
  髖本來就沒有左右所以維持單一) = 中興 7 組(Brain+TOF / MRCP上腹 / MRI腰薦椎 / MRI全脊椎 / 全身MRI / LDCT / Cardiac Ca)
  + **MSK MRI 6 組**(肩 / 膝 / 髖 / 肘 / 腕 / 踝,2026-08-09 加)。MSK 那 6 組**不寫在 `中興標準template.txt`**,
  而是 `tools/parse_cx.py` 的 `MSK` 清單指名從 `tools/library.json`(AHK 模板庫)撈,避免同一份文字兩處各改一半。
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
- ✅ **共用計數器(2026-08-08)**:固定在頁面最下方的計數列,三個分頁共用。移植自
  `~/Claude_Work/中興計數器_移植參考.md`,但**與 Worknum 有一處刻意不同**:
  Worknum 的「基本 MRI」是打勾一次填滿 10 份;這裡**前 10 份要一件件數**,
  所以它也是 ±1 計數項,只多了 `n/10` 進度 + 數滿自動打勾變綠(打勾仍可當「直接填滿 10」的捷徑),
  超過 10 也能繼續數。
  **跨裝置同步**:RTDB `voiceReport/counter/<日期>` 是真相(工作站數、回家看),localStorage 當離線快取。
  rules 只把 `counter` 子節點開放給共用帳號寫,voiceReport 其餘節點仍是 owner 才能寫。
  首次同步時若雲端空、本機有資料,會把本機推上去(不會被空快照洗掉)。有「📋 複製」輸出當日摘要,可貼進 Worknum。
- 決策脈絡見 [DECISION_LOG.md](DECISION_LOG.md)。

## 3. 架構速覽
- **v4 檔案結構**(零 build,GitHub Pages 直上):
  - `index.html` — 殼 + 登入 + 三個 tab 的全部 UI/邏輯
  - `firebase-init.js` — Firebase config + `OWNER_UID` / `SHARED_UID` / `SHARED_EMAIL`(取代舊 firebase-config.js)
  - `matcher.js` — 口說分頁的選模板計分器
  - `report-gen.js` — 中興分頁的 LDCT / Cardiac Ca 產生器(移植自 health AHK)
  - `anatomy.js` — 斷層解剖對照檢視器(掛在中興分頁,只在該模板有 `anatomy` 時出現)
  - `expander.js` — 報告欄的 AHK hotstring 展開(`lt` + 空白 → `left`)
  - `templates.js` / `phrases.js` / `cx-templates.js` — 本機資料檔(gitignored,線上走 RTDB)
  - `anatomy/`(gitignored)— 切片影像本機副本 + `index.json`,線上走 RTDB
  - `snippets.html` — 轉址頁(舊書籤相容)
- **中興模板**:source of truth = `../中興標準template.txt`(中興 7 組)+ `tools/library.json`(MSK 6 組),
  由 `tools/parse_cx.py` 解析成 `{id,name,body,extras[],generator,group,variant,anatomy[]}`;
  選配句可寫成 `> [按鈕標籤] 實際插入的句子`(`LABEL_RE`/`_extra()`)——
  按鈕上顯示判讀依據、插入的卻是報告句,脂肪肝分級就是這樣做的(`Dixon 5~14%` → `Mild fatty liver.`)。
  `generator:true` 的兩個(LDCT/Cardiac)由 report-gen.js 接手。
- **縮寫展開**(2026-08-11):中興頁四個報告欄(`cxBody` / LDCT 兩欄 / Ca 兩欄)套用 `expander.js`,
  收錄 `phrases` 裡 **893 條 kind=inline**(905 條扣掉 2 條個資、1 條含換行、9 組大小寫重複)。
  語意照抄 AHK 預設(來源檔 1364 條 hotstring 無一帶 `*`):結尾字元才展開 / 必須是完整的字 /
  結尾字元保留 / 大小寫沿用。查表用**最長匹配**(194 條縮寫本身以 `/` 結尾)。
  🔴 **`/` 同時是結尾字元又是縮寫的一部分**:有 **47 組**是「某縮寫 + /」
  (`bd`=bile duct / `bd/`=bulging disc.、`dil`/`dil/`、`gbs`/`gbs/`…)。
  按下 `/` 的當下若直接展開短的那個,長的永遠打不出來 → `expandBefore` 會先把待輸入的
  結尾字元接上去試一次,能匹配到更長的就**先不展開**,等下一個結尾字元。
  口說頁**刻意不掛**——系統聽寫整段塞入不會逐字觸發,掛了只會誤改。開關存 `vr_expand`。
- **選取捷徑**(2026-08-11,`expander.js` 的 `editkeysAttach`):移植 AHK 行 819/823 的
  `CapsLock & d`(選到行首+2 字,剛好跳過 `> `)與 `& f`(選到行尾),網頁改綁
  **Ctrl+Shift+D / Ctrl+Shift+F**。CapsLock 不能當網頁 modifier —— `preventDefault()`
  擋不掉 OS 層的大小寫切換。用**邏輯行**(`\n`)而非視覺換行,長行才不會只選一半。
  ⚠️ AHK 那兩條本身是全域且只送標準編輯鍵,所以**在有裝 AHK 的電腦上原本就能用**;
  這個網頁版是給公用電腦(裝不了 AHK)的備援。
- **斷層解剖對照**:影像來自 mrimaster.com(**© 版權他人,僅個人檢索**)→ `tools/anatomy_upload.py`
  壓成 JPEG 存 RTDB `voiceReport/anatomy/{index,data}`,**絕不進 public repo**(`.gitignore` 擋 `anatomy/` 與該腳本)。
  前端逐張讀(前後各預抓 2 張),模板的 `anatomy:[series]` 決定顯示哪組;腕關節有 axial/coronal 兩組。
  目前 7 組:knee 35 / shoulder 19 / hip 22 / elbow 18 / wrist-axial 14 / wrist-coronal 8 / ankle 35。
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
- **計數器可輸出給 Worknum**:面板下方有「在中興」起訖時間欄 + 「📋 複製給 Worknum」,
  產生一列 TSV(`日期 起 訖 mriBase mriC mriNc ca ctC ctNc`,見 `~/Claude_Work/中興log_交換格式.md`)。
  三條硬規則:①日期用當地日曆日(`ymd()` 走 getFullYear/Month/Date,**不可**用 toISOString —— 台灣早上 8 點前會給前一天)
  ②**不傳金額**(單價是 Worknum `settings.xhPrices` 的責任,兩邊都存必漂移)
  ③`XH_WIRE_KEYS` 是**線路順序**,不可改成跟著 `XH_SCHEMA` 的畫面順序走。
  起訖時間欄與「🧮 計數 / 日期」同一排(永遠可見,不必展開面板);值存當日物件的 `start`/`end`,不參與件數統計。
  ⚠️ 因此 `xhApplyRemote` 的「打字中不重建 DOM」守衛範圍是 **`#xhInner`(整條計數列)**,不是只有 `#xhPanel`。
- **逐筆時間戳(2026-08-13)**:每次 ±1 / 改數字 / 打勾都記一筆 `{t:"HH:MM", k:項目, d:增減}`
  到 `counter/<日期>/log`,面板中段列出。起訖預設由 log 的最早/最晚推導;手動改過會立
  `sMan`/`eMan` 旗標,之後不再被覆蓋(清空該格則交還自動)。± 兩向都記 → log 可完整還原件數,
  按錯再按回來是 +1/−1 兩筆,不需要刪除功能。
  ⚠️ **前提是現場即時按計數**;若改回事後補登就必須停掉,否則會把「補登時刻」偽裝成量測結果
  (見 `~/Claude_Work/中興log_交換格式.md` §4)。
  ⚠️ 雲端寫入:件數走 **`update()` 不是 `set()`**(整份取代會把 log 子節點洗掉),要刪的欄位明寫 `null`;
  log 走 **`push()`** 逐筆追加,兩台機器同時記不會互相蓋掉。整天清空才用 `set(null)`。
  匯出**一顆鈕**「📋 給 Worknum」= 彙總 1 列(9 欄)+ 逐筆 N 列(4 欄),逐列看欄數辨識。
  不變式 = 逐筆各 key 總和 == 彙總件數,所以負數(按錯修正)一定要一起送。
  格式定義寫在 `~/Claude_Work/中興log_交換格式.md` §6。
  log **預設收起**,由摘要列的 `📜 紀錄 N` 鈕獨立開關(`vr_xh_logopen`),與 `🧮 計數` 面板互不牽連;
  鈕上直接帶當日筆數,不展開也知道有沒有記到。
  排法對齊 Worknum 報告 log:三欄一列(時間 / 項目 / 增減),
  項目用完整 label(基本 MRI / 額外 MRI 打藥…),選取複製出來就是「時間/項目/增減」三行。
- **LDCT 結節表的四個下拉可用數字鍵選**:游標在該格按 `N` = 第 N 個 option,`0` = 清空。
  四欄的第 0 項都是空白,所以「數字 = option 索引」是一條通用規則,不需要各欄一張對照表
  (位置 1-2 / 型態 1-5 / 肺葉 1-5,3 = RLL / 追蹤 1-3)。表頭有標數字範圍。
- **全形數字是最陰險的輸入錯誤**:`８` 在畫面上跟 `8` 幾乎一樣,但 `parseFloat("８")` = NaN。
  LDCT 的 `report-gen.js` 對解析不出的尺寸是 `continue` → **結節照印進報告,卻不列入 Lung-RADS**,
  原本畫面零提示。現在數字欄輸入時自動轉半形 + 非數字染紅 + 產生時列出被排除的列(`vldField` / `ldSyncWarn`)。
- **不要用 Bash heredoc 寫含反斜線跳脫的 JS**:這個環境會把跳脫的 tab/換行(反斜線 t、反斜線 n)
  變成**真的**控制字元。真 tab 在字串裡合法(靜靜地能跑),真換行則是 syntax error,
  而且瀏覽器只回一句 `Invalid or unexpected token` 不給行號。2026-08-13 為此 debug 一輪。
  → 含跳脫字元的 JS 一律用 Edit 工具改。快速定位法:在頁面上 `fetch` 自己,
  把每個 inline `<script>` 丟進 `new Function()` 看哪一塊炸。
- 🔴 **RTDB 寫入會立刻觸發本地 onValue 回聲,而 `xhApplyRemote` 是整包取代 `XH_ALL`**:
  2026-08-13 逐筆 log 一寫雲端就回聲,打進 `setXhCount` 改到一半的狀態,把還沒存檔的件數洗掉。
  症狀 = **log 一直增加、數字永遠回到原值**(而且本機模式測不出來,只有雲端模式會中)。
  → 一個使用者動作只能有**一次**雲端寫入:逐筆事件先排進 `xhPendingLog`,由 `xhSaveNow`
  跟件數合併成同一個 `update()`(逐筆走 `log/<pushKey>` 深層路徑)。另外 debounce 期間
  (`xhDirty`)收到的遠端快照不覆蓋當天那一包。
  測法:自己寫一個「寫完立刻同步回聲」的假雲端,不要只測本機模式。
- **`input[type=time]` / `[type=date]` 不要寫死寬度**:內在寬度會跟地區格式(12 小時制多出 AM/PM)、
  系統字體大小走。寫死 88px 在我的機器剛好、在使用者機器就把時間切掉。
  ⚠️ 而且 **`scrollWidth > clientWidth` 驗不出來** —— time/date 的日曆與時鐘圖示在 shadow DOM,
  不計入 scrollWidth,所以量到「沒被切」其實被切了。
  正確驗法:設 `width:auto` 看瀏覽器選多寬(本例 116px),那才是真正需要的寬度。
  → 用 `width:auto; min-width:…; flex:0 0 auto`,讓旁邊的彈性元素(摘要文字)去讓步。
- **固定在底部的計數列會蓋住頁面內容**:面板展開後高度從 50px 變到 250px+,
  `body` 的 `padding-bottom` 要跟著長(`xhFitBody()` = 計數列高度 + 14)。
  ⚠️ **不能只靠 ResizeObserver** —— 它的回呼綁在 rendering step,頁面沒在繪製時不一定送達
  (在無頭/背景分頁實測就是不觸發)。每個開關仍各自呼叫一次,RO 只當保險。
- **金額只在 Type 這邊顯示,絕不進匯出**(`中興log_交換格式.md` §1 硬規則:單價是 Worknum 的責任,
  兩邊都送必定漂移,而且對帳的是同一個人、漂移沒人會發現)。單價存 RTDB `counter/prices`,
  **不寫死在程式裡**,費率變動在畫面上改一次、兩台機器都跟著變。
  現行單價:基本 MRI 1000 / MRI 打藥 1000 / MRI 不打藥 800 / Ca 200 / CT 打藥 700 / CT 不打藥 450
  (以 Worknum 面板為準;拿 2026-08-07 = $16,800 與 2026-08-21 = $20,750 兩天回推驗算相符)。
  金額顯示在**計數那排、CT 不打藥後面**;缺單價 → 顯示「單價未設」,**不給一個少算的數字**。
  畫面上沒有單價編輯器(使用者要求),費率變動直接改 RTDB `counter/prices`。
- **`voiceReport/counter` 底下不是只有日期**:快捷鍵小抄借住 `counter/shortcuts`
  (rules 只把 `counter` 這一支開放給共用帳號寫,不必為了小抄改 rules)。
  因此 `xhApplyRemote` 只把**長得像 `YYYY-MM-DD` 的 key** 當計數資料,其餘另外處理 ——
  否則 shortcuts 會被當成一天,污染件數統計。
- **在 textarea 裡程式化改字,一律用 `document.execCommand("insertText")`**:直接寫 `.value` 或
  `setRangeText()` 會把瀏覽器的 undo stack 清掉,使用者按 Ctrl+Z 救不回被自動改掉的字。
  縮寫展開就是靠這點才敢自動改字。(`expander.js`)
- **上傳腳本一律只寫自己的子節點,不准 `set()` 整個 `voiceReport`**:2026-08-09 `upload_rtdb.py` 用
  `db.reference("voiceReport").set({templates,phrases,cxTemplates,meta})` 整份取代,把後來才加的
  `anatomy`(解剖切片)與 `counter`(計數器)一起清空。症狀=線上登入後解剖卡完全不出現(index 讀到空)。
  切片可從原圖重上傳,計數器只能靠瀏覽器 localStorage 首次同步回填(`xhApplyRemote` 的 first-snap 邏輯)。
- **計數器的 `oninput` 絕不能重繪 DOM**:重建 input 會讓正在打字的格子失去焦點(症狀=「只能按 ±1、不能直接打數字」)。
  拆兩層:`xhRenderPanel()` 可動 DOM(換日/±1),`xhRefreshSummary()` 只改 textContent(打字中)。
- **eval.html 目前是合成測試集**，數字只證明機制通、不代表真實口述表現;拿到真實測資要整批替換再看分數。

## 5. 接手者 cheatsheet
- **改模板 → 改 `../0 Peng Rclick.ahk`，然後 `python tools/upload_rtdb.py`(= 解析 + 上雲 + 驗證,一條命令)**。需 `service-account.json` 在 voice-report/(gitignored;Console → 服務帳戶 → 產生私密金鑰)。只想重生本地檔不上雲 → `python tools/parse_ahk.py`。瀏覽器手動備援 → `admin.html`。
- **改中興模板 → 改 `../中興標準template.txt`,然後同樣跑 `python tools/upload_rtdb.py`**
  (它會同時跑 parse_ahk.py 與 parse_cx.py 再上雲)。
- **個資有兩道關**(都在 `tools/parse_ahk.py`,改完跑 `upload_rtdb.py`):
  - `SENSITIVE_ABBREVS` = **整條不上**(目前 psh / pshid / psh1 / pshas,署名與身分證)。
  - `REDACT` = **就地塗掉、模板照留**(目前:`Operator:` / `Assistant:` 整行清空 +「中文姓名(工號)」樣式)。
    整條排除會連帶丟掉有用的模板(`tace/` 介入報告),所以簽名這類用遮蔽。
    兩者每次執行都會印出命中清單,當作證據。
- **加/換 MSK 模板 → 改 `tools/parse_cx.py` 的 `MSK` 清單**(`src` = library.json 的模板 id、
  `split` = 正文佔前幾段、`anatomy` = 對應切片系列),再跑 `upload_rtdb.py`。
- **加一組解剖切片 → `python tools/anatomy_upload.py <資料夾> <series-id> "顯示名稱"`**
  (自動壓縮 + 上 RTDB + 寫本機副本/索引),再把 series-id 填進 `parse_cx.py` 的 `anatomy=[...]`。
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
