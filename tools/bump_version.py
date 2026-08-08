# -*- coding: utf-8 -*-
"""
bump_version.py — 把 index.html 的 script 版本戳升成「當天日期 + 流水號」。

    python tools/bump_version.py

規則:`?v=YYYYMMDD.N`
  - 同一天再跑 → N +1(20260808.1 → 20260808.2)
  - 換一天再跑 → 日期換今天、N 歸 1

版本戳同時是快取破壞器與畫面上的版號(index.html 的 APP_VERSION 直接讀 script src),
所以只有這一處是真相,不會與畫面顯示不一致。
"""
import re
from datetime import date
from pathlib import Path

HTML = Path(__file__).resolve().parent.parent / "index.html"
PAT = re.compile(r"(\.js\?v=)([\w.]+)(\")")


def main():
    s = HTML.read_text(encoding="utf-8")
    cur = PAT.search(s)
    if not cur:
        raise SystemExit("index.html 裡找不到 ?v= 版本戳")
    old = cur.group(2)
    today = date.today().strftime("%Y%m%d")

    m = re.match(r"^(\d{8})\.(\d+)$", old)
    serial = int(m.group(2)) + 1 if (m and m.group(1) == today) else 1
    new = f"{today}.{serial}"

    s, n = PAT.subn(lambda mm: mm.group(1) + new + mm.group(3), s)
    HTML.write_text(s, encoding="utf-8")
    print(f"版本戳 {old} → {new}(共 {n} 處)")


if __name__ == "__main__":
    main()
