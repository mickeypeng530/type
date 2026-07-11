# -*- coding: utf-8 -*-
"""
parse_ahk.py — 把 `0 Peng Rclick.ahk`(Big5)的 hotstring 模板庫解析成
voice-report 用的 templates.js / phrases.js,並產生 tools/review.html 供人工抽查。

Source of truth 是 AHK 檔;templates.js / phrases.js 禁止手改,改模板 = 改 AHK 後重跑本腳本。

用法:  python tools/parse_ahk.py  [AHK檔路徑]
(預設路徑 = ../../0 Peng Rclick.ahk,相對於本腳本)
"""
import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent          # voice-report/tools
VR_DIR = HERE.parent                            # voice-report
DEFAULT_SRC = VR_DIR.parent / "0 Peng Rclick.ahk"

# 敏感縮寫排除名單:個資/帳密類 hotstring,永不進 templates.js / phrases.js / RTDB。
# psh = 簽名檔(姓名+email);pshid = 證號。新增密碼類縮寫直接加進來重跑。
SENSITIVE_ABBREVS = {"psh", "pshid"}

DEF_RE = re.compile(r"^:([^:]*):(.+?)::(.*)$")
TAB_SPLIT_RE = re.compile(r"\{tab\}", re.I)
ENTER_RE = re.compile(r"\{enter\}", re.I)
FULL_RE = re.compile(r"\bshows?\s*:", re.I)     # 完整報告模板的判定
# continuation section 開頭:單獨 '(' 或 '( LTrim...' 之類的選項行
PAREN_OPEN_RE = re.compile(r"^\(\s*(?:$|(?:LTrim|RTrim|Join|Comments|Com|C\b|%|`|,)\S*)", re.I)

TAB_MARK = "\x00TAB\x00"   # 內部欄位分隔記號


def unescape_ahk(text: str) -> str:
    """還原 AHK 反引號跳脫(僅處理常見者,`` 必須先換)。"""
    return (text.replace("``", "\x00BT\x00")
                .replace("`n", "\n").replace("`t", "\t")
                .replace("`;", ";").replace("`%", "%").replace("`,", ",")
                .replace("\x00BT\x00", "`"))


def split_sections(text: str):
    """以 {tab}(= PACS 跳下一欄位)切段;{enter} 視為換行。"""
    text = ENTER_RE.sub("\n", text)
    parts = [p for p in TAB_SPLIT_RE.split(text.replace(TAB_MARK, "{tab}"))]
    # 去掉整段皆空白的尾段,但保留段內原文
    while parts and parts[-1].strip() == "":
        parts.pop()
    return parts


def parse(lines):
    items, skipped = [], []
    n = len(lines)
    i = 0
    while i < n:
        m = DEF_RE.match(lines[i])
        if not m:
            i += 1
            continue
        options, abbrev, rest = m.group(1), m.group(2), m.group(3)
        def_line = i + 1  # 1-based
        note = ""
        cm = re.match(r"^\s*;(.*)$", rest)
        if cm:
            note, rest = cm.group(1).strip(), ""
        inline = rest

        if inline.strip():
            # 單行展開
            items.append(dict(abbrev=abbrev, line=def_line, kind="inline",
                              note=note, raw=lines[i],
                              sections=split_sections(unescape_ahk(inline))))
            i += 1
            continue

        # 找下一個非空白行
        j = i + 1
        while j < n and lines[j].strip() == "":
            j += 1
        if j < n and PAREN_OPEN_RE.match(lines[j].strip()) and lines[j].lstrip().startswith("("):
            # (...) continuation block
            body_start = j + 1
            k = body_start
            while k < n and not lines[k].strip().startswith(")"):
                k += 1
            body = lines[body_start:k]
            # 逐字一致驗證:抓到的行必須與原檔完全相同(建構即保證,仍防手滑)
            assert body == lines[body_start:k]
            items.append(dict(abbrev=abbrev, line=def_line, kind="block",
                              note=note, raw="\n".join(body),
                              src_span=(body_start + 1, k),
                              sections=split_sections("\n".join(body))))
            i = k + 1
            continue

        # script 型:收集到 return / 下一個 hotstring 定義為止
        k = j
        parts, buf = [], None   # parts: list[str|TAB_MARK]
        plain_sends = []
        while k < n:
            ln = lines[k]
            if DEF_RE.match(ln):
                break
            s = ln.strip()
            low = s.lower()
            if low == "return":
                k += 1
                break
            mm = re.match(r"^Clipboard\s*=\s*(.*)$", s, re.I)
            if mm is not None and ":=" not in s.split("=")[0]:
                val = mm.group(1).rstrip()
                # 去尾註解
                val = re.sub(r"\s+;.*$", "", val)
                if val == "":
                    # 期待下一行是 '(' 區塊
                    t = k + 1
                    while t < n and lines[t].strip() == "":
                        t += 1
                    if t < n and lines[t].lstrip().startswith("("):
                        b0 = t + 1
                        u = b0
                        while u < n and not lines[u].strip().startswith(")"):
                            u += 1
                        buf = "\n".join(lines[b0:u])
                        k = u + 1
                        continue
                elif "%" not in val:
                    buf = unescape_ahk(val)
            elif re.match(r"^send(?:,|\s|$)", low) or re.match(r"^sendinput", low):
                arg = re.sub(r"^send(?:input)?\s*,?\s*", "", s, flags=re.I)
                if "^v" in arg.lower():
                    if buf is not None:
                        parts.append(buf)
                        buf = None
                elif re.fullmatch(r"\{tab\}", arg.strip(), re.I):
                    parts.append(TAB_MARK)
                elif re.fullmatch(r"\{enter\}", arg.strip(), re.I):
                    parts.append("\n")
                elif arg and not re.search(r"[{^!+#]", arg):
                    plain_sends.append(unescape_ahk(arg))
            k += 1
        i = k

        if parts and any(p not in (TAB_MARK, "\n") for p in parts):
            text = "".join(p if p != TAB_MARK else "{tab}" for p in parts)
            items.append(dict(abbrev=abbrev, line=def_line, kind="script",
                              note=note, raw=text, sections=split_sections(text)))
        elif plain_sends:
            items.append(dict(abbrev=abbrev, line=def_line, kind="send",
                              note=note, raw="\n".join(plain_sends),
                              sections=["\n".join(plain_sends)]))
        else:
            skipped.append(dict(abbrev=abbrev, line=def_line,
                                reason="純鍵盤巨集/無文字內容"))
    return items, skipped


def classify(item):
    joined = "\n".join(item["sections"])
    return "full" if FULL_RE.search(joined) else "phrase"


def title_of(item):
    for ln in item["sections"][0].split("\n"):
        if ln.strip():
            t = ln.strip()
            t = re.sub(r"\s*shows?\s*:?\s*$", "", t, flags=re.I)
            return t
    return item["abbrev"]


def js_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def emit_js(path: Path, varname: str, rows: list, header: str):
    out = ["// 本檔由 tools/parse_ahk.py 自動產生 — 禁止手改;改模板請改 AHK 檔後重跑。",
           "// " + header, f"const {varname} = ["]
    for r in rows:
        out.append(json.dumps(r, ensure_ascii=False) + ",")
    out.append("];")
    path.write_text("\n".join(out), encoding="utf-8")


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    raw = src.read_bytes().decode("cp950")   # strict:編碼問題直接炸,不默默吞
    lines = raw.replace("\r\n", "\n").split("\n")

    items, skipped = parse(lines)
    n_defs = sum(1 for ln in lines if DEF_RE.match(ln))

    # 敏感項排除(帳密/個資不進資料庫)
    excluded = [it for it in items if it["abbrev"] in SENSITIVE_ABBREVS]
    items = [it for it in items if it["abbrev"] not in SENSITIVE_ABBREVS]
    for it in excluded:
        skipped.append(dict(abbrev=it["abbrev"], line=it["line"], reason="敏感排除(SENSITIVE_ABBREVS)"))
    print(f"敏感排除: {len(excluded)} 條 → {sorted(it['abbrev'] for it in excluded)}")

    templates, phrases = [], []
    for it in items:
        if classify(it) == "full":
            sec = it["sections"]
            templates.append(dict(
                id=it["abbrev"], name=title_of(it),
                findings=sec[0].strip("\n"),
                impression=(sec[1].strip("\n") if len(sec) > 1 else ""),
                extra=[s.strip("\n") for s in sec[2:]],
                note=it["note"], srcLine=it["line"], kind=it["kind"],
            ))
        else:
            text = "\n{tab}\n".join(it["sections"]) if len(it["sections"]) > 1 else it["sections"][0]
            phrases.append(dict(id=it["abbrev"], text=text,
                                note=it["note"], srcLine=it["line"], kind=it["kind"]))

    # ── 帳目核對 ─────────────────────────────────────────────
    print(f"hotstring 定義行: {n_defs}")
    print(f"解析成功: {len(items)}  (完整模板 {len(templates)} / 短語 {len(phrases)})")
    print(f"跳過(純巨集): {len(skipped)}")
    assert len(items) + len(skipped) == n_defs, "帳不平!有 hotstring 沉默丟失"
    dup = [t["id"] for t in templates if sum(1 for x in templates if x["id"] == t["id"]) > 1]
    if dup:
        print("⚠️ 重複 template id:", sorted(set(dup)))

    emit_js(VR_DIR / "templates.js", "TEMPLATES",
            templates, f"完整報告模板 {len(templates)} 個(來源:{src.name})")
    emit_js(VR_DIR / "phrases.js", "PHRASES",
            phrases, f"finding 短語 {len(phrases)} 個(來源:{src.name})")
    # 機器可讀版,給 upload_rtdb.py 用(gitignored)
    (HERE / "library.json").write_text(
        json.dumps({"templates": templates, "phrases": phrases}, ensure_ascii=False),
        encoding="utf-8")

    # ── review.html(離線可開,資料內嵌)───────────────────────
    def esc(s):
        return html.escape(s).replace("\n", "<br>")
    rows_t = "".join(
        f"<tr><td class=id>{html.escape(t['id'])}<div class=meta>L{t['srcLine']} · {t['kind']}"
        f"{' · ' + html.escape(t['note']) if t['note'] else ''}</div></td>"
        f"<td><b>{html.escape(t['name'])}</b><pre>{html.escape(t['findings'])}</pre>"
        + (f"<div class=imp>IMPRESSION ▼</div><pre>{html.escape(t['impression'])}</pre>" if t['impression'] else "")
        + "".join(f"<div class=imp>欄位{i+3} ▼</div><pre>{html.escape(x)}</pre>" for i, x in enumerate(t['extra']))
        + "</td></tr>" for t in templates)
    rows_p = "".join(
        f"<tr><td class=id>{html.escape(p['id'])}<div class=meta>L{p['srcLine']} · {p['kind']}</div></td>"
        f"<td><pre>{html.escape(p['text'])}</pre></td></tr>" for p in phrases)
    rows_s = "".join(
        f"<tr><td class=id>{html.escape(s['abbrev'])}</td><td>L{s['line']} · {html.escape(s['reason'])}</td></tr>"
        for s in skipped)
    review = f"""<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>模板庫解析審查</title>
<style>
 body{{font-family:-apple-system,"Segoe UI","Noto Sans TC",sans-serif;background:#0f1419;color:#e6edf3;margin:0;padding:16px;}}
 h2{{font-size:16px;margin:24px 0 8px;}} .cnt{{color:#8b97a7;font-weight:400;}}
 table{{border-collapse:collapse;width:100%;}} td{{border:1px solid #2e3a4a;padding:8px;vertical-align:top;}}
 td.id{{width:110px;font-family:ui-monospace,Consolas,monospace;color:#4da3ff;font-weight:600;}}
 .meta{{color:#8b97a7;font-size:11px;font-weight:400;margin-top:4px;}}
 pre{{white-space:pre-wrap;margin:6px 0 0;font-size:13px;line-height:1.45;font-family:ui-monospace,Consolas,monospace;}}
 .imp{{color:#3fd17a;font-size:11px;margin-top:8px;font-weight:600;}}
 input{{width:100%;box-sizing:border-box;padding:10px;font-size:15px;background:#1a212b;color:#e6edf3;border:1px solid #2e3a4a;border-radius:8px;margin-bottom:12px;}}
 details>summary{{cursor:pointer;padding:8px 0;}}
</style></head><body>
<h1 style="font-size:18px">VoiceReport 模板庫解析審查 <span class=cnt>(自動產生;審查重點:內容有沒有被切錯/漏掉/亂碼)</span></h1>
<input id=q placeholder="🔍 過濾(縮寫或內文)" oninput="f()">
<h2>完整報告模板 <span class=cnt>{len(templates)} 個 — findings 與 IMPRESSION 以 {{tab}} 切分</span></h2>
<table id=tt>{rows_t}</table>
<h2><details open><summary>finding 短語 <span class=cnt>{len(phrases)} 個</span></summary>
<table id=tp>{rows_p}</table></details></h2>
<h2><details><summary>跳過的純巨集 <span class=cnt>{len(skipped)} 個(不含報告文字,確認沒錯殺即可)</span></summary>
<table>{rows_s}</table></details></h2>
<script>
function f(){{const q=document.getElementById('q').value.toLowerCase();
 for(const t of ['tt','tp']) for(const r of document.getElementById(t).rows)
   r.style.display = r.textContent.toLowerCase().includes(q)?'':'none';}}
</script></body></html>"""
    (HERE / "review.html").write_text(review, encoding="utf-8")
    print(f"輸出: templates.js / phrases.js / tools/review.html")


if __name__ == "__main__":
    main()
