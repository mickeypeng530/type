/* anatomy.js — 斷層解剖對照(掛在中興模板頁,顯示在對應部位模板下方)
   影像來源由外部注入,檢視器本身不管是本機檔還是 RTDB:
     anatomySetup({ index:{sid:{id,name,count}}, loadSlice(sid, n) -> Promise<url> })
     anatomyFor(["knee-axial"])      // 切模板時呼叫;空陣列 = 收起整張卡
   影像為第三方教學網站素材,僅個人檢索用,只存私有 RTDB(見 .gitignore)。 */

const ANAT = { index: {}, list: [], cur: null, n: 1, zoom: 1, panX: 0, panY: 0,
               cache: new Map(), load: null, bound: false };

function anatomySetup(cfg){
  ANAT.index = cfg.index || {};
  ANAT.load = cfg.loadSlice;
  if(!ANAT.bound){ anatBind(); ANAT.bound = true; }
}

function anatomyFor(ids){
  const wrap = document.getElementById("cxAnat");
  const list = (ids || []).map(id => ANAT.index[id]).filter(Boolean);
  ANAT.list = list;
  if(!list.length){ wrap.style.display = "none"; ANAT.cur = null; return; }
  wrap.style.display = "";
  const bar = document.getElementById("anatBar");
  bar.innerHTML = list.length > 1
    ? list.map(s => `<button data-sid="${s.id}">${s.name}</button>`).join("") : "";
  anatSelect(list[0].id);
}

function anatSelect(sid){
  const s = ANAT.list.find(x => x.id === sid) || ANAT.index[sid];
  if(!s) return;
  ANAT.cur = s; anatResetZoom();
  [...document.getElementById("anatBar").children].forEach(b =>
    b.classList.toggle("on", b.dataset.sid === sid));
  const sl = document.getElementById("anatSlider");
  sl.min = 1; sl.max = s.count;
  anatShow(Math.min(s.count, Math.round(s.count / 2)) || 1);   // 從中間那張開始,通常最有內容
}

async function anatShow(n){
  const s = ANAT.cur; if(!s) return;
  n = Math.max(1, Math.min(s.count, n));
  ANAT.n = n;
  document.getElementById("anatSlider").value = n;
  document.getElementById("anatCount").textContent = `${n} / ${s.count}`;
  const img = document.getElementById("anatImg");
  const key = s.id + "/" + n;
  const hit = ANAT.cache.get(key);
  if(hit){ img.src = hit; }
  else{
    try{
      const url = await ANAT.load(s.id, n);
      ANAT.cache.set(key, url);
      if(ANAT.n === n && ANAT.cur === s) img.src = url;      // 已捲到別張就別蓋回去
    }catch(e){
      document.getElementById("anatStatus").textContent = "載入失敗:" + (e.message || e);
    }
  }
  anatPrefetch(n);
}

// 預抓前後各兩張,捲動時才不會一格一格卡
function anatPrefetch(n){
  const s = ANAT.cur; if(!s) return;
  for(const d of [1, -1, 2, -2]){
    const m = n + d;
    if(m < 1 || m > s.count) continue;
    const key = s.id + "/" + m;
    if(ANAT.cache.has(key)) continue;
    ANAT.cache.set(key, "");                                  // 佔位,避免重複請求
    ANAT.load(s.id, m).then(u => ANAT.cache.set(key, u)).catch(() => ANAT.cache.delete(key));
  }
}

/* ── 縮放 / 平移 ── */
function anatApply(){
  const img = document.getElementById("anatImg");
  img.style.transform = `translate(${ANAT.panX}px, ${ANAT.panY}px) scale(${ANAT.zoom})`;
  document.getElementById("anatZoomLabel").textContent = Math.round(ANAT.zoom * 100) + "%";
  img.style.cursor = ANAT.zoom > 1 ? "grab" : "default";
}
function anatZoom(delta){
  ANAT.zoom = Math.max(1, Math.min(6, +(ANAT.zoom + delta).toFixed(2)));
  if(ANAT.zoom === 1){ ANAT.panX = ANAT.panY = 0; }
  anatApply();
}
function anatResetZoom(){ ANAT.zoom = 1; ANAT.panX = ANAT.panY = 0; anatApply(); }

const anatVisible = () => {
  const w = document.getElementById("cxAnat");
  const t = document.getElementById("tab-cx");
  return w && t && w.style.display !== "none" && t.classList.contains("on");
};

function anatBind(){
  const stage = document.getElementById("anatStage");
  const img = document.getElementById("anatImg");

  document.getElementById("anatBar").addEventListener("click", e => {
    const b = e.target.closest("button[data-sid]"); if(b) anatSelect(b.dataset.sid);
  });
  document.getElementById("anatSlider").addEventListener("input", e => anatShow(+e.target.value));
  document.getElementById("anatPrev").onclick = () => anatShow(ANAT.n - 1);
  document.getElementById("anatNext").onclick = () => anatShow(ANAT.n + 1);
  document.getElementById("anatZoomIn").onclick = () => anatZoom(+0.25);
  document.getElementById("anatZoomOut").onclick = () => anatZoom(-0.25);
  document.getElementById("anatZoomReset").onclick = anatResetZoom;
  document.getElementById("anatFull").onclick = () => {
    if(document.fullscreenElement) document.exitFullscreen();
    else if(stage.requestFullscreen) stage.requestFullscreen();
  };

  // 滾輪:一般=換切片(同 mrimaster);Ctrl+滾輪=縮放
  stage.addEventListener("wheel", e => {
    e.preventDefault();
    if(e.ctrlKey) anatZoom(e.deltaY > 0 ? -0.25 : 0.25);
    else anatShow(ANAT.n + (e.deltaY > 0 ? 1 : -1));
  }, {passive: false});

  // 放大後可拖曳
  let drag = null;
  img.addEventListener("mousedown", e => {
    if(ANAT.zoom <= 1) return;
    drag = {x: e.clientX - ANAT.panX, y: e.clientY - ANAT.panY};
    img.style.cursor = "grabbing"; e.preventDefault();
  });
  addEventListener("mousemove", e => {
    if(!drag) return;
    ANAT.panX = e.clientX - drag.x; ANAT.panY = e.clientY - drag.y; anatApply();
  });
  addEventListener("mouseup", () => { if(drag){ drag = null; anatApply(); } });

  // 手機:上下滑換切片
  let ty = null;
  stage.addEventListener("touchstart", e => { ty = e.touches[0].clientY; }, {passive: true});
  stage.addEventListener("touchmove", e => {
    if(ty === null) return;
    const dy = e.touches[0].clientY - ty;
    if(Math.abs(dy) > 22){ anatShow(ANAT.n + (dy < 0 ? 1 : -1)); ty = e.touches[0].clientY; }
  }, {passive: true});
  stage.addEventListener("touchend", () => { ty = null; });

  // 鍵盤:只在中興頁、解剖卡有顯示、且焦點不在輸入框/textarea 時才接管
  addEventListener("keydown", e => {
    if(!anatVisible()) return;
    if(/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || "")) return;
    if(e.key === "ArrowDown" || e.key === "ArrowRight"){ anatShow(ANAT.n + 1); e.preventDefault(); }
    else if(e.key === "ArrowUp" || e.key === "ArrowLeft"){ anatShow(ANAT.n - 1); e.preventDefault(); }
    else if(e.key === "+" || e.key === "=") anatZoom(+0.25);
    else if(e.key === "-") anatZoom(-0.25);
    else if(e.key === "0") anatResetZoom();
  });
}
