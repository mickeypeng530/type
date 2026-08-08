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
