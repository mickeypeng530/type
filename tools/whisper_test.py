# -*- coding: utf-8 -*-
"""
whisper_test.py — 本地 faster-whisper 放射口述測試工具(B 路線的 STT 引擎評估)

用法:
  python tools/whisper_test.py 錄音檔.m4a          # 轉錄檔案(m4a/mp3/wav 都吃)
  python tools/whisper_test.py --mic 15            # 用電腦麥克風錄 15 秒再轉錄
  python tools/whisper_test.py --mic 15 --model large-v3-turbo
選項:
  --model  small(預設,最快) / medium / large-v3-turbo(最準)
"""
import os
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")   # Windows OpenMP DLL 衝突繞道
import sys
import time

# 放射詞彙提示:給模型的領域先驗,顯著改善專有名詞辨識
RADIOLOGY_PROMPT = (
    "Radiology dictation. CT of brain without contrast, chest CT with and without contrast, "
    "CTA, MRI of lumbosacral spine, CXR, KUB and IVU, esophagography, upper GI series. "
    "Findings: intracerebral hemorrhage, infarct, lymphadenopathy, pleural effusion, "
    "spinal canal stenosis, neural foramen stenosis, disc herniation, compression fracture, "
    "hydronephrosis, appendicitis, hepatocellular carcinoma, basal ganglia, L4-5, L5-S1, C5-6."
)


def record_mic(seconds: int, path: str):
    import numpy as np
    import sounddevice as sd
    from scipy.io import wavfile  # scipy 沒有就改用 wave 模組
    sr = 16000
    print(f"🎤 開始錄音 {seconds} 秒……(講你的放射口述)")
    audio = sd.rec(int(seconds * sr), samplerate=sr, channels=1, dtype="int16")
    sd.wait()
    wavfile.write(path, sr, audio)
    print(f"錄好了 → {path}")


def main():
    args = sys.argv[1:]
    model_name = "small"
    if "--model" in args:
        i = args.index("--model")
        model_name = args[i + 1]
        del args[i:i + 2]

    if args and args[0] == "--mic":
        seconds = int(args[1]) if len(args) > 1 else 15
        src = os.path.join(os.environ.get("TEMP", "."), "vr_mic_test.wav")
        record_mic(seconds, src)
    elif args:
        src = args[0]
    else:
        print(__doc__)
        return

    from faster_whisper import WhisperModel
    t0 = time.time()
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    print(f"模型 {model_name} 載入 {time.time()-t0:.1f}s")

    t0 = time.time()
    segs, info = model.transcribe(src, language="en",
                                  initial_prompt=RADIOLOGY_PROMPT, beam_size=5)
    text = " ".join(s.text.strip() for s in segs)
    dt = time.time() - t0
    print(f"音檔 {info.duration:.1f}s → 轉錄 {dt:.1f}s (x{info.duration/dt:.1f} 即時)")
    print("─" * 60)
    print(text)


if __name__ == "__main__":
    main()
