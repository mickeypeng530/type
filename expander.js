/* expander.js — 報告欄位內的 AHK hotstring 展開(打 lt + 空白 → left)

   語意刻意與使用者本機的 AHK 一致,肌肉記憶不用重學。查過來源檔:1364 條 hotstring
   沒有任何一條帶 `*` 選項(空選項 1170 / R0 197),所以就是 AHK 的預設值:
     · 要打「結尾字元」才展開(空白、標點、Enter)
     · 必須是完整的字 —— 打 salt 不會被吃成 saleft
     · 結尾字元保留
     · 大小寫沿用:LT → LEFT、Lt → Left
   只收 kind="inline"(單行直接取代);多行的 block/script/send 牽涉 {tab} 跳欄位與剪貼簿,
   textarea 沒有對應語意,那批繼續走「⌨️ 短句」頁複製。

   ⚠️ 取代一律走 document.execCommand("insertText"):直接寫 textarea.value 會清掉瀏覽器的
      undo stack,展開錯了就 Ctrl+Z 不回來。 */

const EXP = { map: new Map(), maxLen: 0, on: true, onExpand: null };

// AHK 預設 EndChars(去掉 Tab —— 在網頁按 Tab 是換焦點,不該拿來觸發)
const EXP_END = new Set([" ", "-", "(", ")", "[", "]", "{", "}", ":", ";",
                         "'", '"', "/", "\\", ",", ".", "?", "!"]);
const EXP_WORD = /[A-Za-z0-9]/;

function expanderInit(phrases, opts){
  EXP.map.clear(); EXP.maxLen = 0;
  for(const p of phrases || []){
    if(p.kind !== "inline" || !p.id || p.text == null) continue;
    if(p.text.includes("\n")) continue;          // inline 理論上都是單行,有換行的跳過
    EXP.map.set(p.id.toLowerCase(), p.text);
    EXP.maxLen = Math.max(EXP.maxLen, p.id.length);
  }
  EXP.onExpand = (opts || {}).onExpand || null;
  return EXP.map.size;
}

// 依使用者打的大小寫調整輸出(AHK 預設行為)
function expCase(typed, out){
  if(/[A-Za-z]/.test(typed) && typed === typed.toUpperCase() && typed.length > 1)
    return out.toUpperCase();
  if(/^[A-Z]/.test(typed)) return out.charAt(0).toUpperCase() + out.slice(1);
  return out;
}

/** 試著展開游標前的縮寫。end 為 true 代表待會還會補上結尾字元。
 *  回傳 {abbr, text} 或 null(沒展開)。 */
function expandBefore(ta){
  if(!EXP.on || !EXP.map.size) return null;
  const pos = ta.selectionStart;
  if(pos !== ta.selectionEnd || pos === 0) return null;
  const head = ta.value.slice(Math.max(0, pos - EXP.maxLen), pos);
  // 最長匹配:194 條縮寫本身以 "/" 結尾(lul/、panc/),用「抓一個單字」的寫法會全失效
  for(let len = head.length; len >= 1; len--){
    const typed = head.slice(head.length - len);
    const rep = EXP.map.get(typed.toLowerCase());
    if(rep === undefined) continue;
    const prev = ta.value[pos - len - 1];
    if(prev && EXP_WORD.test(prev)) continue;    // 字中間不觸發(salt 的 lt 不算)
    const out = expCase(typed, rep);
    ta.setSelectionRange(pos - len, pos);
    let ok = false;
    try{ ok = document.execCommand("insertText", false, out); }catch(_){}
    if(!ok){                                     // 極少數環境不支援 → 退回去,undo 會斷
      ta.setRangeText(out, pos - len, pos, "end");
      ta.dispatchEvent(new Event("input", {bubbles: true}));
    }
    if(EXP.onExpand) EXP.onExpand(typed, out);
    return {abbr: typed, text: out};
  }
  return null;
}

/** 把展開掛到一個 textarea 上。 */
function expanderAttach(ta){
  if(!ta || ta._expBound) return;
  ta._expBound = true;
  ta.addEventListener("keydown", e => {
    if(e.isComposing || e.ctrlKey || e.altKey || e.metaKey) return;
    const isEnd = e.key === "Enter" || (e.key.length === 1 && EXP_END.has(e.key));
    if(!isEnd) return;
    expandBefore(ta);          // 不 preventDefault:結尾字元照常打進去(同 AHK)
  });
}

function expanderSetOn(on){ EXP.on = !!on; }
