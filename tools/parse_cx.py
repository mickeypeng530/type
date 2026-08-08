# -*- coding: utf-8 -*-
"""
parse_cx.py — 把 `中興標準template.txt` 解析成網頁用的結構化模板。

輸出 tools/cx.json + voice-report/cx-templates.js(兩者皆 gitignored,
由 upload_rtdb.py 一併上傳到 RTDB /voiceReport/cxTemplates)。

結構:每個模板 = { id, name, body, extras:[{title, text}] }
  body   = 主模板全文(可在網頁 textarea 直接編輯後複製)
  extras = 選配句/參考表(主模板後面那些段落),網頁上做成小按鈕插入游標處

LDCT 與 Cardiac Ca 另由 report-gen.js 的輸入式產生器處理,這裡只留原文備查。
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
VR_DIR = HERE.parent
SRC = VR_DIR.parent / "中興標準template.txt"

# 主模板與「選配段」的分界標記(出現後的段落都視為 extras)
END_MARKERS = ["* For further details, please see the descriptions above."]

# 每塊的中繼資料(依檔案順序)。
#   generator=True → 由 report-gen.js 的輸入式產生器接手(不顯示 textarea)
#   group/variant  → 同 group 的多個區塊會併成上排一顆按鈕 + 內層子頁籤(如 MRCP 打不打藥)
#                    沒填 group 就自成一組。extras 在 UI 上以 group 為單位合併。
META = [
    dict(id="cx-brain-tof", name="Brain + Neck TOF MRA"),
    dict(id="cx-mrcp-wo",   name="MRCP + 上腹 MRI", group="cx-mrcp",
         groupName="MRCP + 上腹 MRI", variant="沒打藥 (without)"),
    dict(id="cx-mrcp-wc",   name="MRCP + 上腹 MRI", group="cx-mrcp",
         groupName="MRCP + 上腹 MRI", variant="有打藥 (with/without)"),
    dict(id="cx-lspine",    name="MRI 腰薦椎"),
    dict(id="cx-wspine",    name="MRI 全脊椎"),
    dict(id="cx-wholebody", name="MRI Whole Body"),
    dict(id="cx-ldct",      name="Low Dose Chest CT",     generator=True),
    dict(id="cx-cardiac",   name="Cardiac CT (Ca score)", generator=True),
]


def split_blocks(text):
    lines = text.replace("\r\n", "\n").split("\n")
    blocks, cur = [], []
    for ln in lines:
        s = ln.strip()
        if set(s) == {"-"} and len(s) >= 35:
            if cur:
                blocks.append("\n".join(cur).strip("\n"))
            cur = []
        else:
            cur.append(ln)
    if cur:
        blocks.append("\n".join(cur).strip("\n"))
    # 第一塊是檔名標題「中興標準template」,丟掉
    return [b for b in blocks if b.strip() and not b.strip().startswith("中興標準template")]


def split_extras(body):
    """主模板 vs 選配段:以 END_MARKERS 切;之後每個空行分隔的段落各成一個 extra。"""
    idx = -1
    for m in END_MARKERS:
        p = body.find(m)
        if p >= 0:
            idx = p + len(m)
            break
    if idx < 0:
        return body.strip("\n"), []
    main, tail = body[:idx], body[idx:]
    extras = []
    for para in re.split(r"\n\s*\n", tail):
        para = para.strip("\n ")
        if not para:
            continue
        # 段落內若是多個 "> " 句子 → 每句各自成為可插入的選配句
        # (非 ">" 開頭的續行如 "DDx: …" 併入前一句)
        lines = para.split("\n")
        if sum(1 for l in lines if l.lstrip().startswith(">")) > 1:
            chunks, cur = [], []
            for l in lines:
                if l.lstrip().startswith(">") and cur:
                    chunks.append("\n".join(cur))
                    cur = [l]
                else:
                    cur.append(l)
            if cur:
                chunks.append("\n".join(cur))
        else:
            chunks = [para]
        for ch in chunks:
            extras.append({"title": _title(ch), "text": ch.strip("\n")})
    return main.strip("\n"), extras


def _title(chunk):
    first = chunk.split("\n")[0].strip().lstrip("> ").rstrip(".")
    return (first[:34] + "…") if len(first) > 34 else first


def main():
    text = SRC.read_text(encoding="utf-8-sig")
    blocks = split_blocks(text)

    # LDCT 那塊後面接的 Fleischner(以 35 dashes 分隔)會自成一塊,
    # 併回 LDCT 當 extra。
    merged = []
    for b in blocks:
        if b.lstrip().startswith("Measurement of pulmonary solid nodule") and merged:
            merged[-1] = merged[-1] + "\n\n@@FLEISCHNER@@\n" + b
        else:
            merged.append(b)
    blocks = merged

    if len(blocks) != len(META):
        print(f"⚠️ 區塊數 {len(blocks)} != META {len(META)},請檢查來源檔分隔線")
        for i, b in enumerate(blocks):
            print(f"  [{i}] {b.strip()[:60]}")

    out = []
    for meta, block in zip(META, blocks):
        if "@@FLEISCHNER@@" in block:
            body, fl = block.split("@@FLEISCHNER@@")
            body, extras = split_extras(body.strip("\n"))
            extras.append({"title": "Fleischner 2017 追蹤建議", "text": fl.strip("\n")})
        else:
            body, extras = split_extras(block)
        out.append({
            "id": meta["id"], "name": meta["name"],
            "generator": meta.get("generator", False),
            "group": meta.get("group", meta["id"]),
            "groupName": meta.get("groupName", meta["name"]),
            "variant": meta.get("variant", ""),
            "body": body, "extras": extras,
        })

    (HERE / "cx.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    js = ["// 自動產生(tools/parse_cx.py)— 禁止手改;改 中興標準template.txt 後重跑。",
          "const CX_TEMPLATES = ["]
    js += [json.dumps(r, ensure_ascii=False) + "," for r in out]
    js.append("];")
    (VR_DIR / "cx-templates.js").write_text("\n".join(js), encoding="utf-8")

    print(f"中興模板 {len(out)} 個:")
    for r in out:
        print(f"  {r['id']:14} {r['name']:24} body {len(r['body']):5} 字 · extras {len(r['extras'])} 段"
              + ("  [產生器]" if r["generator"] else ""))
        for e in r["extras"]:
            print(f"      · {e['title']}")


if __name__ == "__main__":
    main()
