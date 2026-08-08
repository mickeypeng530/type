# -*- coding: utf-8 -*-
"""
upload_rtdb.py — 解析 AHK + 上傳模板庫到 RTDB,一條命令全自動。

    python tools/upload_rtdb.py           # 解析 + 上傳 + 讀回驗證
    python tools/upload_rtdb.py --no-parse  # 跳過解析,直接上傳現有 library.json

需求:voice-report/service-account.json(Firebase Console → 專案設定 → 服務帳戶
→ 產生新的私密金鑰)。此檔 = income-41a40 全專案管理權,只放本機、已 gitignore。
admin.html 仍可用(瀏覽器手動備援)。
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
VR_DIR = HERE.parent
KEY = VR_DIR / "service-account.json"
DB_URL = "https://income-41a40-default-rtdb.firebaseio.com"


def main():
    if not KEY.exists():
        sys.exit(f"❌ 找不到 {KEY}\n→ Firebase Console → 專案設定 → 服務帳戶 → 產生新的私密金鑰,存成這個檔名。")

    if "--no-parse" not in sys.argv:
        print("① 解析 AHK + 中興模板 …")
        subprocess.run([sys.executable, str(HERE / "parse_ahk.py")], check=True)
        subprocess.run([sys.executable, str(HERE / "parse_cx.py")], check=True)

    lib = json.loads((HERE / "library.json").read_text(encoding="utf-8"))
    t, p = lib["templates"], lib["phrases"]
    cx = json.loads((HERE / "cx.json").read_text(encoding="utf-8"))

    print("② 上傳 RTDB …")
    import firebase_admin
    from firebase_admin import credentials, db
    firebase_admin.initialize_app(credentials.Certificate(str(KEY)), {"databaseURL": DB_URL})
    # ⚠️ 只動自己負責的四個節點,絕不 set() 整個 voiceReport ——
    #    整份取代會連同 anatomy(解剖切片)與 counter(共用計數器)一起洗掉。
    #    2026-08-09 就是這樣把 anatomy + counter 清空的,別再犯。
    db.reference("voiceReport/templates").set(t)
    db.reference("voiceReport/phrases").set(p)
    db.reference("voiceReport/cxTemplates").set(cx)
    db.reference("voiceReport/meta").set({
        "templatesCount": len(t),
        "phrasesCount": len(p),
        "cxCount": len(cx),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "0 Peng Rclick.ahk + 中興標準template.txt via parse_*.py + upload_rtdb.py",
    })

    print("③ 讀回驗證 …")
    m = db.reference("voiceReport/meta").get()
    n = len(db.reference("voiceReport/templates").get() or [])
    ncx = len(db.reference("voiceReport/cxTemplates").get() or [])
    print(f"✅ 雲端現況:模板 {n} / 短語 {m['phrasesCount']} / 中興 {ncx},更新於 {m['updatedAt']}")
    assert n == len(t) and ncx == len(cx), "讀回數量對不上!"


if __name__ == "__main__":
    main()
