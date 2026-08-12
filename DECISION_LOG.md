# VoiceReport — DECISION_LOG(append-only)

## 2026-08-08 共用計數器:雲端同步,且「基本 MRI」改成要一件件數
- 決策:計數列固定在頁面最下方、三分頁共用;資料以 RTDB `voiceReport/counter/<日期>` 為真相,
  localStorage 當離線快取。rules 只把 `counter` 子節點開放給共用密碼帳號寫(模板庫仍只有 owner 能寫)。
- **與來源 Worknum 的差異**:Worknum 的基本 MRI 是「打勾 = 一次填滿 10 份」;此專案前 10 份**要一件件數**,
  故改成 ±1 計數 + `n/10` 進度 + 數滿自動打勾;打勾保留為「直接填滿 10」的捷徑,且不設上限。
- 沒選:純 localStorage(使用者要工作站數、回家看)/ 開放整個 voiceReport 給共用帳號寫(模板庫會有被改風險)。
- 坑:首次同步若雲端空、本機有資料,必須把本機推上去,否則空快照會把既有計數洗掉(已處理)。
- 狀態:active

## 2026-08-08 v4:三頁籤單頁 + 共用密碼登入 + 中興模板/產生器
- 決策:三頁併成 `index.html` 一頁三 tab(中興模板/短句/口說),只登入一次、切換不重載;
  舊 snippets.html 改轉址頁保書籤。
- 登入改 **retake 模式**:Firebase Email/Password 共用帳號(`viewer@voicereport.app`)+ owner Google(唯一可寫)。
  密碼由 Firebase Auth 保管,程式碼/RTDB 皆不存;換密碼只在 Console 改、不用改 code、不用重部署。
  rules 由 email 制改 **UID 制**(共用帳號 email_verified=false,email 制擋不住)。
- 沒選:①三個獨立 HTML 各自登入(要登三次、切換重載)②自寫密碼比對(等於自己保管密碼雜湊,沒比較好)。
- 中興模板 6 個進 RTDB;LDCT / Cardiac Ca 移植成輸入式產生器(不做 AHK 的 mouse move,結果產生在網頁內)。
- 狀態:active

## 2026-08-08 LDCT 取消 L/N 之分(不再有 "Mark L1:" 前綴)
- 決策:網頁版結節列統一格式(= AHK 的 N 樣式),預設 6 列、可 +新增;使用者已不再使用 CAD mark 標號。
- 代價:輸出與 AHK 的 L 列不同(少了 "Mark L1:"),但使用者確認線上版不需要。
- 狀態:active

## 2026-08-08 【自我更正】先前誤報的「AHK impression 漏 N 結節」不成立
- 我先前用 130 字元截斷讀 `0 HealthExamTemplete_stu2026.ahk` L586,誤判 impression 只串 L1-L6。
  印出全行後:N1-N7 **有**串,且尾端還接 `%Var_lung_Fleischner%`。
- 真實差異是結尾:一般版附 **Fleischner 2017 全文**,Lung-RADS 版附 `* Lung-RADS 2022: X`。report-gen.js 照此實作。
- 教訓:**讀程式碼下結論前必須印完整行**,截斷輸出不足以當證據。
- 狀態:active

## 2026-07-11 模板庫上鎖:Firebase Auth + RTDB(C 方案)
- 決策:templates.js/phrases.js 退出公開 repo(.gitignore),模板搬進 RTDB `/voiceReport/{templates,phrases,meta}`;線上版 Google 登入(純 popup)後才載入,rules 鎖 `deer530530@gmail.com`(email_verified)。本地開發不受影響(有 templates.js 就走本地模式)。上傳器 = admin.html(本機開、登入、一鍵上雲)。
- **共用既有專案 `income-41a40`**(inc / paperRadar 同居,各自命名空間),config 從 inc 公開原始碼取得;沒選新開專案(登入 provider、authorized domains 都現成,Phase C 中繼也同一個 console)。
- 沒選:A 繼續公開在 GitHub Pages(模板庫=科內資產,不裸奔)/ B 換 Firebase Hosting(只是遮眼——靜態檔知道 URL 仍可讀,半吊子)。
- 代價:多一個 Firebase 依賴;改模板多一步 admin.html 上傳;首次載入多一次登入。
- 坑:RTDB 規則是整份取代——合併規則必須帶上既有的 users/paperRadar 節點,不然其他工具當場斷線。
- 狀態:active(程式完成;等貼合併規則 + admin 上傳)

## 2026-07-11 模板庫全量化:AHK 檔為 source of truth,parser 自動產出
- 決策:寫 `tools/parse_ahk.py` 把 `../0 Peng Rclick.ahk`(Big5)解析成 `templates.js`(236 完整模板)+ `phrases.js`(1103 短語),兩檔禁止手改,改模板 = 改 AHK 重跑。
- 沒選:①繼續手動維護 6 個內嵌模板(會與工作站 AHK 分岔,覆蓋率永遠是玩具級)②把全量直接塞 index.html(單檔爆到 200KB+ 難維護)。
- 代價:SPA 從嚴格單檔變 1+2 個資料檔(仍零 build、GitHub Pages 直上)。
- 狀態:active

## 2026-07-11 `{tab}` 語意 = PACS 跳下一欄位(findings → impression),非替代句
- 決策:模板內 `{tab}` 解析為欄位分隔,模板結構帶 `findings` / `impression` 兩欄。
- 證據:`xc/` 的 script 版明確「貼 findings → send {tab} → 貼 impression」;236 模板中 34 個帶 impression。
- 沒選:當成「保留讓人手刪的替代句」(初版猜測,被 script 證據推翻)。
- 狀態:active(待使用者臨床抽查 review.html 確認)

## 2026-07-11 斜線替代句(`A / B`)交給 LLM 依口述二選一
- 決策:模板行內的斜線替代句,智慧模式由 LLM 挑符合口述的那個並刪其餘;免費模式保留原樣(貼上後手刪,同工作站現行習慣)。
- 沒選:parser 端預切(會破壞逐字一致且免費模式反而少了選項)。
- 狀態:active(使用者裁決)

## 2026-07-11 歧義選模板:偏好記憶而非硬猜
- 決策:matcher 分不出高下時(如 chest x-ray → xcpa1 vs xc/、KUB vs KUB+IVU)顯示候選 pills;使用者點過一次即存 localStorage(`vr_pref`,key=前三候選 id 簽名),下次同樣歧義自動選。
- 沒選:提高權重硬讓某一個贏(這類歧義是使用習慣問題,不是規則能判的)。
- 狀態:active

## 2026-07-11 智慧模式 LLM 策略:兩段式 + 行號 patch;供應商可切換
- 決策:Stage 1 規則選模板(LLM 只當 fallback)、Stage 2 只給選中模板、輸出行號制 patch 由 JS apply(防 silent drift)。API base URL + 模型名做成可設定;預設 gpt-5-mini(`reasoning_effort: minimal`)。
- 沒選:①gpt-5 完整版(貴 10-20 倍 + 推理延遲,任務用不到)②整份報告重出(會漏行/悄改格式,違反逐字一致)③本地 CPU 模型當主力(i7-13700 純 CPU 每份 20-60 秒,與省時目的相反;Gemma 4 E4B 降為實驗選項,26B MoE 需加 RAM 到 32GB)。
- 狀態:active(A3 實作;模型優劣待 eval.html 數據)

## 2026-08-09 MSK 模板從 AHK 模板庫「引用」而非抄進 中興標準template.txt
- 決策:肩/膝/髖/肘/腕/踝 MRI 六組在 `tools/parse_cx.py` 的 `MSK` 清單以 id 指名 `tools/library.json`,parse 時併入中興頁。
- 沒選:把六份文字複製進 `中興標準template.txt`(同一份報告文字會有兩個 source of truth,改 AHK 時網頁不會跟著動,遲早漂移)。
- 代價:parse_cx.py 從此依賴 parse_ahk.py 的產物(library.json 不在就跳過 MSK 並印警告);`upload_rtdb.py` 本來就兩者都跑,實務上無感。
- 狀態:active

## 2026-08-09 解剖切片影像只放私有 RTDB,不進 repo
- 決策:mrimaster.com 的切片壓成 JPEG(寬 ≤900、q78)存 `voiceReport/anatomy/{index,data}`,前端登入後逐張讀;`.gitignore` 擋 `anatomy/` 與 `tools/anatomy_upload.py`。
- 理由:`mickeypeng530/type` 是 **public** repo,而該站頁尾明寫 ©All Rights Reserved —— 圖進 repo 等於公開再散布。
- 沒選:①放 repo 當靜態檔(版權問題)②每次去原站熱連(離線失效 + 對方頻寬)③整組一次載入(七組共約 8 MB base64,首屏會爆)。
- 代價:每張切片一次 RTDB 讀取(靠前後各預抓 2 張掩蓋延遲);本機開發要先跑一次 anatomy_upload.py 才有本機副本。
- 狀態:active

## 2026-08-11 報告欄縮寫展開:照抄 AHK 預設語意,只收單行片語
- 決策:`expander.js` 在中興頁四個報告欄做 hotstring 展開,收 893 條 kind=inline;
  觸發語意完全比照 AHK 預設(結尾字元才展開 / 必須是完整的字 / 結尾字元保留 / 大小寫沿用)。
- 證據:來源 AHK 1364 條 hotstring **無一帶 `*` 選項**(空選項 1170 / R0 197)→ 預設語意就是使用者的肌肉記憶。
  撞名風險以 236 模板 + 中興模板正文當語料實測:893 個縮寫只有 20 個與正文英文字撞名,且多半本身就是縮寫。
- 沒選:①收多行 block/script/send 那 196 條(牽涉 `{tab}` 跳欄位與剪貼簿,textarea 沒有對應語意,
  行為勢必與 AHK 不一致)②只做 30-50 條精選小清單(使用者已習慣全庫,砍了反而要記兩套)
  ③口說頁也掛(系統聽寫整段塞入不會逐字觸發,掛了只有誤改風險沒有好處)。
- 代價:9 組縮寫在來源檔就大小寫重複,查表小寫化後只會留最後一條;使用者若發現某條展不出來要回頭看 AHK。
- 狀態:active

## 2026-08-11 個資處理分兩道:整條排除 vs 就地遮蔽
- 決策:`SENSITIVE_ABBREVS` 負責「整條不上」(署名、身分證),新增 `REDACT` 負責「就地塗掉、模板照留」
  (`Operator:` / `Assistant:` 整行清空,加上「中文姓名(4-6 位工號)」保險網)。兩者每次跑都印命中清單。
- 起因:`tace/` 模板內含 `Operator: 彭嗣翔(96701)/黃俊傑(89088)` —— 本人與**同事**的姓名+員工號,已在 RTDB。
- 沒選:把 `tace/` 加進 SENSITIVE_ABBREVS(會連整份 TACE 介入報告模板一起丟掉,代價太大)。
- 附帶查證:AHK `CapsLock & b` 是自動登入巨集,含明文密碼。查過雲端 0 次、repo 追蹤檔 0 次,
  且 AHK 檔在 repo 之外(repo 根是 `voice-report/`,AHK 在上層 `Type/`)→ 未外洩。
- 狀態:active

## 2026-08-11 數字欄防呆:抄 AHK 的染色,但多補「靜默漏算」那一層
- 決策:LDCT 尺寸/Image No、Ca 各分支分數與直徑,輸入時 ①全形自動轉半形 ②非數字染紅
  ③產生報告時在警示列明講「第 N 列不列入 Lung-RADS」。**不擋產生**(與 AHK 一致)。
- 證據:AHK `gChkSize`(`is not number`)/`gChkImNo`(`is not digit`)→ `RedFlags` → `WM_CTLCOLOREDIT`
  染淡紅底(brush 0x8080FF);Send 按鈕不檢查 RedFlags。網頁版原本什麼都沒有,實測輸入 abc / 全形８:
  三顆結節全印進報告,但 `report-gen.js` 的 `isNaN → continue` 讓其中兩顆**靜默不列入 Lung-RADS**,
  badge 仍顯示一個看似正常的分級。Ca 同理:LM=abc 時自動加總把它當 0。
- 沒選:①只抄染色(不解決靜默漏算,而那才是會發錯報告的那一項)
  ②有紅欄就擋住產生(與 AHK 行為不一致,且醫師常需要先產生再回頭補)
  ③改 report-gen.js 讓非數字直接不印(會讓使用者以為自己漏打,比印出來更難察覺)。
- 狀態:active

## 2026-08-12 計數器加「起訖時間」並輸出 TSV 給 Worknum
- 決策:計數面板下方加「在中興 起–訖」兩格 + 「📋 複製給 Worknum」,產生一列 tab 分隔資料;
  欄位順序另立 `XH_WIRE_KEYS` 常數,與畫面用的 `XH_SCHEMA` 脫鉤。
- 為何加起訖:Worknum 那邊 2026-08-07 的實例 —— 中興做了 24 件卻在 log 上是一片空白,
  任何「空檔 = 閒置」的分析都會把當天最賺的時段判成最偷懶。填兩格換掉一個會給出反向結論的分析錯誤。
- 沒選:①線路順序直接用 `XH_SCHEMA.map(i=>i.key)`(將來在畫面上調欄位順序,會靜默把資料錯位塞進 Worknum)
  ②一併傳金額(單價歸 Worknum 的 settings.xhPrices;兩邊都存會漂移,而且對帳的是同一個人,漂移不會被發現)
  ③送逐筆時間戳(目前是事後補登,那是補登時刻不是工作時刻,會偽裝成量測結果 —— 之後若改成現場即時按計數再說)。
- 狀態:active

## 2026-08-13 逐筆時間戳:件數 update、log push,起訖由 log 推導
- 決策:每次 ±1 / 改數字 / 打勾記一筆 `{t,k,d}` 到 `counter/<日期>/log`;起訖預設取 log 的最早/最晚,
  手動改過立 `sMan`/`eMan` 旗標就不再被覆蓋。給 Worknum 的 TSV **維持 9 欄不變**。
- 前提:使用者確認是**在中興現場邊做邊按**,時間戳才是真的工作時刻。若改回事後補登必須停掉
  (中興log_交換格式.md §4:補登時刻偽裝成量測結果,Worknum 那邊為此撤掉過一版修法)。
- 雲端寫法:件數改 `update()`(原本是 `set()` 整份取代,會把 log 子節點洗掉 —— 同一個坑本專案已踩兩次);
  log 用 `push()` 逐筆追加,多機器並寫不互相覆蓋。整天清空才用 `set(null)`,連 log 一起刪。
- 沒選:①log 放 `voiceReport/counterLog` 兄弟節點(要改 RTDB rules 才能讓共用帳號寫,
  而改 rules 是整份取代、風險高於改寫入方式)②每個按鍵都記(打 "10" 會拆成 +1、+9 兩筆
  → 改成離開欄位時記淨差額)③提供刪除單筆 log(± 兩向都記就能自我修正,多一個刪除 UI 只是多一個出錯面)
  ④順便把逐筆時間送進 TSV(Worknum 端還沒有「一列一筆」的收法,送了也沒人收)。
- 狀態:active

## 2026-08-13 逐筆 log 另出「一列一筆」格式,不塞進彙總那列
- 決策:新增「📋 複製逐筆」→ 一列一筆四欄(日期/時間/項目/增減);§1 彙總列維持 9 欄不動。
  兩種格式靠**欄數**辨識,不加標頭行。格式定義寫進 `~/Claude_Work/中興log_交換格式.md` §6。
- 沒選:把時間接在彙總那列尾端(§1 靠「尾端可省略 = 當 0」解析,接上不定長度欄位會讓這條規則失效,
  解析端還得猜列尾從哪開始是時間)。
- 不變式:同一天逐筆各 key 的增減總和 == 彙總列件數 → **負數(按錯修正)必須一起送**,
  濾掉負的會讓總和對不上。要「操作次數」看列數,要「做了幾件」看總和。
- §4 前提釐清:管的是「時間戳何時**產生**」而非「何時貼上」。實際流程 = 中興現場即時按(當下寫時鐘)
  → 回頭補登進 Worknum,這樣可以送逐筆;要擋的是回家憑印象補件數那種。
- 狀態:active(Worknum 端待實作解析與匯入)

## 2026-08-13 一個動作一次雲端寫入(修「log 增加但數字不動」)
- 症狀:雲端模式按 ± → 逐筆 log 一直增加,但件數永遠回到原值;本機模式完全測不出來。
- root cause:`xhAddLog` 直接 `push()` 到 RTDB → **本地 onValue 回聲立刻觸發** →
  `xhApplyRemote` 整包取代 `XH_ALL` → 打進 `setXhCount` 改到一半的狀態,
  把「已寫進 day 物件但還沒 xhSaveNow」的件數洗掉;接著 xhSaveNow 拿到被洗過的物件,
  反而把 `mriBase` 寫成 null。
- 修法:逐筆事件先排進 `xhPendingLog`,由 `xhSaveNow` 與件數**合併成同一次 `update()`**
  (逐筆走 `log/<pushKey>` 深層路徑,key 用 `push(ref).key` 產生但不寫入)。
  debounce 期間(`xhDirty`)收到的遠端快照不覆蓋當天那一包。
- 沒選:①在 xhApplyRemote 加「忽略自己寫的回聲」旗標(要對每次寫入配對追蹤,複雜且容易漏)
  ②改成 transaction(這裡沒有真正的並發衝突,只是自我干擾,殺雞用牛刀)。
- 教訓:**雲端模式的測試不能只跑本機模式**。之後測同步一律自備「寫完立刻回聲」的假雲端。
- 狀態:active

## 2026-08-13 彙總與逐筆合併成單一匯出
- 決策:兩顆匯出鈕併成一顆「📋 給 Worknum」,一次複製彙總 1 列(9 欄)+ 逐筆 N 列(4 欄)。
- 可行的原因:§6 一開始就選了「用欄數辨識」而非標頭行,所以兩種格式天生可以疊在同一段貼上。
- Worknum 端要注意:9 欄那列一定在,4 欄的可能一列都沒有(當天沒按逐筆)→ 逐筆當選配處理。
- 狀態:active(Worknum 端待實作)
