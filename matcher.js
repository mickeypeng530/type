/* matcher.js — 免費模式規則式選模板(計分制,吃全量 TEMPLATES)
   由 index.html 與 eval.html 共用。零 build、無相依。 */

/* ── 正規化與別名 ─────────────────────────────────────────── */
// 片語級誤聽(先於斷詞處理;來源:使用者真實 iOS 聽寫對稿,2026-07-11)→ 持續補充
// 順序有意義:先修「with 系」再修 contra,讓 "with our contra" → "without contrast"
const PHRASE_MISHEAR = [
  [/\bwith whistle\b/g, " with and without "], // "with and without" → "with whistle"
  [/\bwith\s?our\b/g, " without "],            // "without" → "with our"
  [/\bcon contra\b/g, " contrast "],
  [/\bcontra\b/g, " contrast "],
  [/\bdown leg\b/g, " lung lesion "],          // "no active lung lesion" → "no active down leg"
  [/\bcity of\b/g, " ct of "],                 // "CT of" → "City of"
  [/\bcity\b/g, " ct "],
  [/\bam i\b/gi, " mri "],                     // "MRI" → "Am I"
  [/i['’]?m a g\.?\s?i\.?/gi, " upper gi "],   // "Upper GI" → "I'm a G.I."
  [/\bavoiding system\b/g, " voiding urethrocystography "],
  [/\bkubnwu\b/g, " kub and ivu "],            // "KUB and IVU" 黏成一團
  [/\bl spy\b/g, " lumbar spine "],            // "L spine" → "L spy"
  [/\bdeath and\b/g, " left ankle "],          // "left ankle" → "death and"
  [/\bsmall series\b/g, " small bowel series "],
  [/\bof our spine\b/g, " of lumbar spine "],  // "lumbosacral spine" → "our spine"
  [/\bwhole body\b/g, " chest abdomen pelvis "],   // 習慣講法(v2 遺產)
  [/\bcap\b/g, " chest abdomen pelvis "],          // "CT CAP"(v2 遺產)
];
// 口述誤聽別名(OS 聽寫對非母語口音常見誤聽)→ 持續補充
const MISHEAR = {
  frame:"brain", brian:"brain", grain:"brain", brand:"brain", brane:"brain",
  perng:"brain", prem:"brain", prince:"brain", brentwood:"brain",  // iOS 把 brain 聽成使用者姓氏等
  nama:"lumbar", lumber:"lumbar",
  spain:"spine", spy:"spine",
  avoiding:"voiding",
  trust:"chest", jest:"chest", chess:"chest",
  abdoman:"abdomen", abdomin:"abdomen", domen:"abdomen",
  navel:"neck", nick:"neck",
  spline:"spine",
  nee:"knee", me:"knee",
  anckle:"ankle", uncle:"ankle",
  sholder:"shoulder", soldier:"shoulder", threshold:"shoulder",
  rest:"wrist", risk:"wrist",
  gup:"kub", cub:"kub", coop:"kub",
  emma:"mri", mra:"mri",
};
// 名稱端縮寫展開(讓 "chest x-ray" 打得到名稱叫 CXR 的模板)
const NAME_EXPAND = {
  cxr:["chest","xray"], kub:["kidney","ureter","bladder","abdomen"],
  ivu:["ivp","urography"], hsg:["hysterosalpingography"],
  cta:["ct","angiography"], ctv:["ct","venography"], mrcp:["mri","cholangio"],
  thr:["hip","replacement"], tmj:["jaw","joint"],
  lumbosacral:["lumbar","sacral"], urethrocystography:["cystography","urethrography"],
};

// 停用詞:虛詞 + contrast 相關詞(contrast 另有專門邏輯,不進 token 計分)
const VR_STOP = new Set(("of the and or a an in to for by is was were at on with without " +
  "contrast enhancement enhanced medium media administration intravenous intra venous iv " +
  "performed before after study noted scan").split(" "));
const SYN = { both:"bilateral", film:"xray", films:"xray", radiograph:"xray", radiographs:"xray",
  cystourethrography:"urethrocystography", cystourethrogram:"urethrocystography",
  abdominal:"abdomen" };   // 口述慣用 abdominal,部分模板名用 abdomen,統一之

function vrPre(s){
  s = " "+s.toLowerCase()+" ";
  for(const [re,rep] of PHRASE_MISHEAR) s = s.replace(re, rep);
  return s;
}
function vrNorm(s){
  return vrPre(s)
    .replace(/x[\s-]?rays?/g, " xray ")
    .replace(/\bc[\s-]?spines?\b/g, " cervical spine ")
    .replace(/\bl[\s-]?spines?\b/g, " lumbar spine ")
    .replace(/\bt[\s-]?spines?\b/g, " thoracic spine ")
    .replace(/[^a-z0-9]+/g, " ");
}
function vrTokens(s, expand){
  const out=[];
  for(let t of vrNorm(s).split(" ")){
    if(!t) continue;
    if(MISHEAR[t]) t=MISHEAR[t];
    if(SYN[t]) t=SYN[t];
    if(t.length>3 && t.endsWith("s")) t=t.slice(0,-1);   // 單複數容忍
    if(VR_STOP.has(t)) continue;
    out.push(t);
    if(expand && NAME_EXPAND[t]) out.push(...NAME_EXPAND[t]);
  }
  return out;
}

/* ── modality 硬約束:口述講 x光就不該配到 CT/MRI 模板 ── */
function modalityOfName(name){
  const s=" "+name.toLowerCase()+" ";
  if(/\bmri?\b|\bmra\b|\bmrcp\b/.test(s)) return "mri";
  if(/\bcta?v?\b|\bct\b/.test(s)) return "ct";
  if(/xray|x-ray|x ray|cxr|kub|view|gram\b|babygram|series|graphy|scanogram|mammogram/.test(s)) return "xr";
  return "other";
}
function modalityOfDictation(text){
  const s=" "+vrNorm(text)+" ";
  if(/ mri | mr | magnetic | mra | mrcp | emma /.test(s)) return "mri";
  if(/ ct | cta | ctv | computed /.test(s)) return "ct";
  if(/ xray | cxr | kub | film | radiograph | plain film /.test(s)) return "xr";
  return null;
}

/* ── contrast 三態 ───────────────────────────────────────── */
function contrastOfName(name){
  const s=name.toLowerCase();
  if(/with\s*\/\s*without|without\s*\/\s*with|with and without|without and with|before and after/.test(s)) return "both";
  if(/\bwithout\b|non-?contrast/.test(s)) return "without";
  if(/\bwith\b.*(contrast|enhanc)|contrast enhanced/.test(s)) return "with";
  return "none"; // plain film 等無此概念
}
function contrastOfDictation(text){
  const s=vrPre(text);
  if(/with and without|without and with|with\s+without|with\s*\/\s*without|without\s*\/\s*with|pre and post/.test(s)) return "both";
  const wo=/\bwithout\b|non[\s-]?contrast|plain|w\/o contrast|no contrast|precontrast| nc /.test(s);
  const wi=/with contrast|with iv|contrast enhanc|enhanced|c plus|c\+|post[\s-]?contrast|\bcta\b|\bctv\b|angiograph/.test(s);
  if(wi) return "with";
  if(wo) return "without";
  return null;
}

/* ── 索引與計分 ───────────────────────────────────────────── */
let VR_INDEX=null;
function vrBuildIndex(templates){
  const df={};
  const idx=templates.map(t=>{
    const toks=[...new Set(vrTokens(t.name,true))];
    const origToks=[...new Set(vrTokens(t.name,false))];   // 未擴展,算覆蓋率用
    toks.forEach(k=>df[k]=(df[k]||0)+1);
    return {t, toks, origToks, contrast:contrastOfName(t.name), modality:modalityOfName(t.name)};
  });
  idx.forEach(e=>{
    e.w={};
    e.toks.forEach(k=>e.w[k]=1/Math.log(3+(df[k]||1)));   // 罕見詞權重高
  });
  VR_INDEX=idx;
  return idx;
}

/* 回傳排序後 [{id,name,score}] */
function vrMatch(text, topN=8){
  if(!VR_INDEX) vrBuildIndex(TEMPLATES);
  const qt=[...new Set(vrTokens(text,false))];
  const cdi=contrastOfDictation(text);
  const mdi=modalityOfDictation(text);
  const rawSet=new Set(vrNorm(text).split(" ").filter(Boolean));
  const scored=[];
  for(const e of VR_INDEX){
    let s=0, matched=0;
    for(const k of qt) if(e.w[k]){ s+=e.w[k]; matched++; }
    const isAbbrev = rawSet.has(e.t.id.toLowerCase().replace(/[^a-z0-9]/g,""));
    if(s===0 && !isAbbrev) continue;
    // 縮寫直達:口述/輸入中含正確縮寫 → 巨大加分(打字族的肌肉記憶)
    if(isAbbrev) s+=10;
    // modality 硬約束:口述有講 modality,模板不同類 → 重罰
    if(mdi && e.modality!==mdi && !(mdi==="xr" && e.modality==="other")) s-=4;
    // 覆蓋率懲罰:模板名稱裡沒被口述提到的實詞越多越扣(讓 "brain" 選純 brain 而非 brain+facial bone)
    // 只算原始名稱 token(不含縮寫擴展),否則 CXR/KUB 這類縮寫名會被自己的展開詞拖累
    const qset=new Set(qt);
    s -= 0.30*e.origToks.filter(k=>!qset.has(k)).length;
    // contrast 一致性
    if(e.contrast!=="none"){
      if(cdi==="both")      s+= e.contrast==="both" ? 2.5 : (e.contrast==="with"?0.3:-1.5);
      else if(cdi==="with") s+= e.contrast==="without" ? -3 : 2;
      else if(cdi==="without") s+= e.contrast==="with" ? -3 : (e.contrast==="without"?2:1);
      else                  s+= e.contrast==="with" ? -1 : (e.contrast==="without"?0.5:0);
    }
    scored.push({id:e.t.id, name:e.t.name, score:s});
  }
  scored.sort((a,b)=>b.score-a.score);
  return scored.slice(0,topN);
}

/* 自動選 or 給候選:回 {auto: tpl|null, candidates:[...]}
   規則:榜首夠高分,且與「不同名稱」的次名拉開差距 → 自動選。 */
function vrPick(text){
  const ranked=vrMatch(text,8);
  if(!ranked.length) return {auto:null, candidates:[]};
  const top=ranked[0];
  const rival=ranked.find(r=>r.name!==top.name);
  const clear = rival
    ? (top.score>=0.85 && (top.score-rival.score>=0.25 || rival.score<=top.score*0.72))
    : top.score>=0.35;   // 唯一候選:低門檻即可
  return {auto: clear?top:null, candidates:ranked};
}
