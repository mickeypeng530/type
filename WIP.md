# 進行中

> 只記「做到一半 / 已定案但還沒動工」的事。做完就刪(結論值得留就搬去 STATE.md 或 DECISION_LOG.md)。

## 報告欄位內的 AHK hotstring 展開(已規劃,未動工)

**目標** 在網頁報告欄打 `lt` + 空白 → 變成 `left`,行為比照使用者本機 AHK,肌肉記憶不用重學。

**已完成** 只有盤點與定案,程式碼一行都還沒寫。盤點結果:
- `phrases` 1101 條中 **905 條 kind=inline**(單行直接取代),`lt/rt/bil/wo/htn` 都現成。
- AHK 1364 條 hotstring **沒有任何一條帶 `*` 選項**(空選項 1170 / `R0` 197)→ 語意 = 預設值:
  要打結尾字元才展開、必須是完整的字、結尾字元保留。
- 撞名風險低:以 236 模板 + 中興模板正文當語料,905 個縮寫只有 20 個與正文英文字撞名
  (fr / ml / orif / pipj / dipj / thr…),且多半本身就是縮寫;使用者在 AHK 上已與之共存。
- 隱私掃描 905 條 inline:身分證 0 / email 0 / 電話 0 / 7 位以上數字 0 / 密碼字樣 0。
  已排除 `psh`(署名+email)、`pshid`(身分證)。**`psh1`(彭嗣翔)、`pshas`(Assistant : Dr. 彭嗣翔)
  建議一併排除**,使用者尚未裁決。

**使用者定案(2026-08-10)**
- 套用欄位:**中興模板編輯欄 + LDCT/Ca 輸出欄**;口說頁不開(系統聽寫整段塞入不會觸發,反而干擾)。
- 收錄範圍:**只收 905 條 inline**;多行的 block/script/send 共 196 條繼續走「⌨️ 短句」頁複製。

**下一步**
1. `expander.js`:結尾字元觸發 → 游標前**最長匹配**(194 條縮寫以 `/` 結尾,不能用「抓單字」的寫法)
   → 大小寫沿用(`LT`→`LEFT`、`Lt`→`Left`)→ 用 `document.execCommand("insertText")` 取代。
2. 掛上 `#cxBody` / `#ldFindings` / `#ldImpression` / Ca 輸出欄,加開關存 localStorage。
3. 展開後狀態列閃 `lt → left`。
4. 自我測試 20 例:撞名、`/` 結尾、大小寫、行首行尾、undo。

**卡點** 無。

**怎麼驗證**
- Undo 是最容易做壞的一項:展開後按 Ctrl+Z 必須回到 `lt`,不是整欄消失。
  只有 `execCommand("insertText")` 保得住原生 undo stack,直接寫 `.value` 會清掉。
- 撞名回歸:輸入 `salt `、`heart `、`there ` 不得被展開(必須是完整的字)。

**相關檔案** `tools/library.json`(phrases)、`index.html`(欄位與 boot)、`tools/parse_ahk.py`(SENSITIVE_ABBREVS)
