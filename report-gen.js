/* report-gen.js — 輸入式報告產生器(LDCT / Cardiac Ca score)
   移植自 `0 HealthExamTemplete_stu2026.ahk` 的 Lung 與 Calcium 分頁。
   忠實還原原始輸出文字;差異只有:不再有 "Mark L1:" 前綴(使用者要求),
   且結果產生在網頁內(不做 mouse move / 自動貼上)。 */

/* ============================ 選項(原文照抄 AHK 下拉) ============================ */
const LD_C    = ["", "perifissural ", "subpleural "];
const LD_TYPE = ["", "solid nodule ", "ground glass nodule ", "part-solid nodule ",
                 "calcified nodule ", "Not a true nodule "];
const LD_SIDE = ["", "RUL", "RML", "RLL", "LUL", "LLL"];
const LD_ST   = ["", " Stationary.", " Increase size.", " Decrease size."];
const LD_PLEURA = ["> Pleura: No pleural effusion, thickening, or pneumothorax.",
                   "> Pleura: Pleural thickening at bilateral lung apices."];

const FLEISCHNER = `***
If a solid nodule < 6 mm, follow-up at 12 months may be considered.
If a solid nodule 6-8 mm, a single follow-up at 6-12 months is advised, with a third CT scan at 18-24 months to be considered.
If a solid nodules > 8 mm, follow-up at 3 months or PET/CT or tissue sampling.
If multiple nodules > 6 mm, follow-up at 3-6 months and then 18-24 months.

If ground glass nodules greater than 6 mm, follow-up at 6-12 months and then every 2 years  until the 5-year mark.
If subsolid nodules greater than 6 mm, should have CT follow-up at 3-6 months and then every year for 5 years.

If any change in size, morphology and density suspicious for malignancy, please reevaluate the lesion at the chest or chest surgical outpatient clinic.
Remarks: A majority of the nodules less than 6 mm may not be cancer (risk <1% in heavy smokers and <0.15% in non-smokers). However, to exclude any possibility of malignancy, we recommend that (1) a complete evaluation by the chest specialist and/or (2) a follow-up study based on personal risk factors.
Fleischner Society 2017 Guidelines for Management of Incidentally Detected Pulmonary Nodules in Adults.`;

/* ============================ LDCT ============================ */
function ldNewRow(){ return {size:"", c:"", type:"", side:"", st:"", im:""}; }

/* Lung-RADS 2022 分級(照抄 AHK L918-1038 的判斷) */
const LD_RANK = {1:0, 2:1, 3:2, "4A":3, "4B":4};
function ldRads(rows){
  let max = 1;
  for(const n of rows){
    const size = parseFloat(n.size);
    if(!n.size || isNaN(size)) continue;
    if(/calcified|true nodule/i.test(n.type)) continue;          // → RADS 1
    let cur;
    if(n.c === "perifissural " && size < 10) cur = 2;            // AHK 只判 perifissural
    else if(n.type === "solid nodule ")
      cur = size < 6 ? 2 : size < 8 ? 3 : size < 15 ? "4A" : "4B";
    else if(n.type === "ground glass nodule ") cur = size < 30 ? 2 : 3;
    else if(n.type === "part-solid nodule ")   cur = size < 6 ? 2 : 3;
    else cur = 2;
    if(LD_RANK[cur] > LD_RANK[max]) max = cur;
  }
  return max;
}

/* mode: "plain"(尾附 Fleischner)| "rads"(尾附 Lung-RADS 分級) */
function ldGenerate({rows, cmpDate, si, pleuraIdx}, mode){
  let findings = [], impressions = [], imgNos = [];
  let nAbnormal = 0, nAny = 0;

  for(const n of rows){
    if(!String(n.size).trim()) continue;
    const im = n.im ? `${si||""}/${n.im}` : `${si||""}/`;
    if(/true nodule/i.test(n.type)){
      findings.push(`> Not a true nodule. \n`);
      nAny++;
    }else if(/calcified/i.test(n.type)){
      findings.push(`> A ${n.size} mm calcified nodule in the ${n.side} (Se/Im: ${im}), favor benign nature.${n.st}\n`);
      nAny++;
    }else{
      findings.push(`> A ${n.size} mm ${n.c}${n.type}in the ${n.side} (Se/Im: ${im}).${n.st}\n`);
      impressions.push(`> A ${n.size} mm ${n.c}${n.type}in the ${n.side}.${n.st}\n`);
      nAbnormal++; nAny++;
      if(n.im && !imgNos.includes(n.im)) imgNos.push(n.im);   // Image No 彙整(排除 calcified)
    }
  }

  const noduleBlock = (nAny === 0 ? "> No suspicious nodule at bilateral lung lobes.\n" : "") + findings.join("");
  const cmpLine = cmpDate ? `This study is compared with previous CT on ${cmpDate}.\n` : "";

  const findingsText =
`Low dose chest CT without intravenous contrast enhancement with assistance of computer assisted detection shows:
${cmpLine}
1. Lung parenchyma:
* Computer assisted detection shows the following lung nodules:
${noduleBlock}
2. Other lung and extrapulmonary findings:
> Airway: Normal.
${LD_PLEURA[pleuraIdx||0]}
> Thoracic aorta and great vessels: Normal in diameter.
> Pulmonary arteries: Normal in diameter.
> Heart, pericardium: Normal.
> Lymph nodes: No enlarged thoracic lymph nodes.
> Spine and bones: Normal.
> Chest wall: Normal.
> Visualized upper abdomen: Normal.
* Imaging results other than bilateral lungs are not necessarily included in this low-dose chest CT examination.`;

  let head, tail;
  if(mode === "rads"){
    head = nAbnormal === 0
      ? "No suspicious nodule at bilateral lung lobes.\n* Lung-RADS 2022: 1."
      : "1. The abnormal lung nodules are listed below:\n";
    tail = nAbnormal === 0 ? "" : `* Lung-RADS 2022: ${ldRads(rows)}.`;
  }else{
    head = nAbnormal === 0
      ? "No suspicious nodule at bilateral lung lobes. Suggest annual low-dose chest CT for persons with high risk factors, individual health considerations or based on expert opinion.\n"
      : "1. The abnormal lung nodules are listed below:\n";
    tail = "\n" + FLEISCHNER;
  }

  return {
    findings: findingsText,
    impression: head + impressions.join("") + tail,
    imageNos: imgNos.join(";") + (imgNos.length ? ";" : ""),
    rads: ldRads(rows),
  };
}

/* 比較日期太近提醒(AHK:距今不到 60 天會跳 MsgBox) */
function ldDateWarn(cmpDate){
  if(!cmpDate) return "";
  const d = new Date(cmpDate);
  if(isNaN(d)) return "";
  const days = Math.round((d - new Date()) / 86400000);
  return days > -60 ? `⚠️ 前次檢查距今僅 ${Math.abs(days)} 天(<60 天)` : "";
}

/* ============================ Cardiac Ca score ============================ */
/* Findings 附加段落用中興 template 版(4 行),外加使用者要求的兩個可選項:
   - 瓣膜:未鈣化 / 主動脈瓣鈣化
   - 升主動脈:正常 / 擴張(可填直徑) */
const CA_VALVE = ["> The cardiac valves are not calcified.",
                  "> Calcification of aortic valve."];
const CA_AORTA = ["> The visible ascending aorta is normal.",
                  "> Dilatation of ascending aorta with diameter about "];

function caGenerate({lm, lad, cx, rca, total, valveIdx, aortaIdx, aortaDia}){
  const v = x => (String(x).trim() === "" ? "0" : String(x).trim());
  const aorta = (aortaIdx === 1)
    ? CA_AORTA[1] + (aortaDia ? `${aortaDia} cm.` : "___ cm.")
    : CA_AORTA[0];

  const findings =
`Cardiac CT was performed without intravenous contrast administration and under ECG-gating.

Findings:
> Total Calcium Score (Equivalent Agatston Score) is ${v(total)}.
   LM calcium score is ${v(lm)}.
   LAD calcium score is ${v(lad)}.
   LCX calcium score is ${v(cx)}.
   RCA calcium score is ${v(rca)}.

Additional findings:
> The cardiac chambers are normal.
${CA_VALVE[valveIdx||0]}
${aorta}
> The visible lungs are clear.
> The visible bone is normal.`;

  return { findings, conclusion: `Total Calcium Score (Equivalent Agatston Score) is ${v(total)}.` };
}

function caAutoTotal({lm, lad, cx, rca}){
  const n = x => { const f = parseFloat(x); return isNaN(f) ? 0 : f; };
  return n(lm) + n(lad) + n(cx) + n(rca);
}
