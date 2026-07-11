# -*- coding: utf-8 -*-
"""
whisper_server.py — 本地 Whisper 錄音測試伺服器(B 路線 UI 雛形)

跑法:  python tools/whisper_server.py
然後瀏覽器開  http://localhost:8766  → 按 🎤 講話 → 放開 → 看轉錄結果。
全程本機,語音不出電腦。模型第一次用到才載入(small 秒載,turbo 約 7 秒)。
"""
import os
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
import json
import tempfile
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT = 8766
HERE = Path(__file__).resolve().parent
UI = HERE / "whisper_ui.html"

RADIOLOGY_PROMPT = (
    "Radiology dictation. CT of brain without contrast, chest CT with and without contrast, "
    "CTA, MRI of lumbosacral spine, CXR, KUB and IVU, esophagography, upper GI series. "
    "Findings: intracerebral hemorrhage, infarct, lymphadenopathy, pleural effusion, "
    "spinal canal stenosis, neural foramen stenosis, disc herniation, compression fracture, "
    "hydronephrosis, appendicitis, hepatocellular carcinoma, basal ganglia, L4-5, L5-S1, C5-6."
)

_models = {}
def get_model(name):
    if name not in _models:
        from faster_whisper import WhisperModel
        t0 = time.time()
        _models[name] = WhisperModel(name, device="cpu", compute_type="int8")
        print(f"[model] {name} 載入 {time.time()-t0:.1f}s")
    return _models[name]


class H(BaseHTTPRequestHandler):
    def log_message(self, fmt, *a):  # 安靜點
        pass

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self._send(200, UI.read_bytes(), "text/html; charset=utf-8")
        else:
            self._send(404, b"not found", "text/plain")

    def do_POST(self):
        if not self.path.startswith("/transcribe"):
            self._send(404, b"{}")
            return
        from urllib.parse import urlparse, parse_qs
        q = parse_qs(urlparse(self.path).query)
        model_name = (q.get("model") or ["small"])[0]
        lang = (q.get("lang") or ["en"])[0]
        n = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(n)
        suffix = ".webm" if b"webm" in self.headers.get("Content-Type", "").encode() or True else ".bin"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(raw)
            tmp = f.name
        try:
            model = get_model(model_name)
            t0 = time.time()
            segs, info = model.transcribe(
                tmp, language=(None if lang == "auto" else lang),
                initial_prompt=RADIOLOGY_PROMPT, beam_size=5)
            text = " ".join(s.text.strip() for s in segs)
            dt = time.time() - t0
            out = dict(text=text, audioSec=round(info.duration, 1),
                       transcribeSec=round(dt, 1), model=model_name)
            print(f"[ok] {info.duration:.1f}s 音檔 → {dt:.1f}s ({model_name}): {text[:60]}")
            self._send(200, json.dumps(out, ensure_ascii=False).encode())
        except Exception as e:
            print("[err]", e)
            self._send(500, json.dumps({"error": str(e)}, ensure_ascii=False).encode())
        finally:
            try: os.unlink(tmp)
            except OSError: pass


if __name__ == "__main__":
    print(f"🩻 Whisper 測試台 → http://localhost:{PORT}  (Ctrl+C 結束)")
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
