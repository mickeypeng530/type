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

/** 找出 value 中結束於 pos 的最長可展開縮寫;沒有就回 null。 */
function expMatch(value, pos){
  // 最長匹配:194 條縮寫本身以 "/" 結尾(lul/、panc/),用「抓一個單字」的寫法會全失效
  const head = value.slice(Math.max(0, pos - EXP.maxLen), pos);
  for(let len = head.length; len >= 1; len--){
    const typed = head.slice(head.length - len);
    const rep = EXP.map.get(typed.toLowerCase());
    if(rep === undefined) continue;
    const prev = value[pos - len - 1];
    if(prev && EXP_WORD.test(prev)) continue;    // 字中間不觸發(salt 的 lt 不算)
    return {len, typed, rep};
  }
  return null;
}

/** 試著展開游標前的縮寫;endChar = 使用者剛按下、待會才會插入的結尾字元。
 *  回傳 {abbr, text} 或 null(沒展開)。 */
function expandBefore(ta, endChar){
  if(!EXP.on || !EXP.map.size) return null;
  const pos = ta.selectionStart;
  if(pos !== ta.selectionEnd || pos === 0) return null;
  const m = expMatch(ta.value, pos);
  if(m){
    /* ⚠ 結尾字元本身可能是更長縮寫的一部分:`/` 既是結尾字元、也是 47 組縮寫的結尾
       (bd = bile duct、bd/ = bulging disc.)。若不先看一眼,打 bd/ 會在按下 `/` 的當下
       就把 bd 展成 bile duct,永遠打不出 bd/。→ 加上這個字元後仍能匹配到更長的縮寫,
       就先不展開,等下一個結尾字元再說。 */
    if(endChar && endChar.length === 1){
      const probe = ta.value.slice(0, pos) + endChar + ta.value.slice(pos);
      const longer = expMatch(probe, pos + 1);
      if(longer && longer.len > m.len) return null;
    }
    const {len, typed, rep} = m;
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
    // 把待輸入的結尾字元一起交給展開器判斷(`/` 可能是更長縮寫的一部分)
    expandBefore(ta, e.key === "Enter" ? "" : e.key);   // 不 preventDefault:結尾字元照常打進去(同 AHK)
  });
}

function expanderSetOn(on){ EXP.on = !!on; }

/* ══ 選取捷徑:移植 AHK 的 CapsLock & d / & f ══════════════════════════
   AHK 原文(行 819 / 823,皆為 live 且全域):
     CapsLock & d :: Send {shift Down}{Home}{right}{right}{shift up}
     CapsLock & f :: Send {shift Down}{End}{shift up}
   CapsLock 在瀏覽器不能當 modifier(preventDefault 擋不掉 OS 的大小寫切換),
   所以網頁版改綁 Ctrl+Shift+D / Ctrl+Shift+F。
   語意逐項對齊:
     D → 選取「行首 +2 字」到游標(模板每行都是 "> " 開頭,剛好跳過);方向 backward,
         接著按 Shift+→ 會從左緣繼續縮放,跟 AHK 一樣。
     F → 選取游標到行尾;方向 forward。
   行的定義用**邏輯行**(\n),不是視覺換行 —— 長行(如 whole body 模板)才不會選一半。 */
function editkeysAttach(ta){
  if(!ta || ta._ekBound) return;
  ta._ekBound = true;
  ta.addEventListener("keydown", e => {
    if(!e.ctrlKey || !e.shiftKey || e.altKey || e.metaKey) return;
    const k = (e.key || "").toLowerCase();
    if(k !== "d" && k !== "f") return;
    const v = ta.value, pos = ta.selectionEnd;
    if(k === "d"){
      const ls = v.lastIndexOf("\n", pos - 1) + 1;          // 邏輯行起點
      ta.setSelectionRange(Math.min(ls + 2, pos), pos, "backward");
    }else{
      let le = v.indexOf("\n", pos);
      if(le < 0) le = v.length;
      ta.setSelectionRange(pos, le, "forward");
    }
    e.preventDefault();                                     // 蓋掉瀏覽器預設(Ctrl+Shift+D = 全部分頁加書籤)
  });
}
