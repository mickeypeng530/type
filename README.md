# VoiceReport 🩻

口說打放射報告 — 對手機/電腦說一句話,自動挑模板、把該翻陽性的項目填好,輸出可貼進 PACS 的報告文字。

> 例:說「CT noncontrast brain, no bleeding」→ 出 CT brain 全正常模板。
> 說「…acute hemorrhage at right basal ganglia」→ 同模板,對應行翻成陽性、其餘維持正常。

單檔 SPA、零 build、GitHub Pages 部署。**STT 用 OS 內建聽寫**(iOS 鍵盤 🎤 / Win+H),app 本身不做語音辨識。

## v3 架構:程式公開、模板上鎖

- **模板庫(236 個完整報告模板 + 1101 條慣用短語)不在 repo 裡**——存 Firebase RTDB(`/voiceReport`),Google 登入後才載入,rules 鎖授權帳號。
- 模板的 source of truth 是工作站的 AHK hotstring 檔,由 `tools/parse_ahk.py` 解析、`tools/upload_rtdb.py` 一鍵上雲(需本機 service-account 金鑰,不進 repo)。
- 本地開發:目錄裡有 `templates.js` 就自動走本地模式,完全不碰 Firebase。

## 兩種模式

- 🆓 **免費(預設)**:本地計分制選模板(modality/contrast 約束 + 口音誤聽別名 + 縮寫直達如 `ct2b`),歧義時給候選 pills、記住你的選擇。顯示模板原文,findings/IMPRESSION 分欄複製。**零 key、零成本、文字不外送**。
- 🧠 **智慧**:口述文字送 LLM 依模板自動翻陽性填寫。API 端點/模型可設定(預設 OpenAI gpt-5-mini;可指本地 Ollama)。key 只存瀏覽器 localStorage。

## 使用

1. 開 https://mickeypeng530.github.io/type/ → 🔐 Google 登入(授權帳號)→ 模板自動載入。
2. 點①口述框 → 鍵盤 🎤 說話或打字 → 產生報告 → 複製。
3. 智慧模式才需要 ⚙️ 填 API key。

## 隱私

- 模板庫僅授權帳號可讀;API key 只存本機 localStorage。
- ⚠️ 智慧模式文字會送往你設定的 API 端點;口述勿念病歷號/姓名。免費模式不外送。

## 開發工具(本機)

| 檔 | 用途 |
|---|---|
| `tools/parse_ahk.py` | AHK → templates.js/phrases.js(含敏感縮寫排除) |
| `tools/upload_rtdb.py` | 解析 + 上傳 RTDB + 驗證,一條命令 |
| `admin.html` | 瀏覽器手動上傳備援 |
| `eval.html` | 選模板命中率跑分(真實口述測資 + 合成) |
| `tools/whisper_server.py` | 本地 faster-whisper 錄音測試台(B 路線 POC) |
| `whisper.html` | 純瀏覽器 Whisper(零安裝備胎) |

## Roadmap

- [x] A1 模板全量化(AHK → 236 模板)
- [x] A2 免費模式計分制選擇器 + eval 基礎設施
- [x] C 方案部署:程式公開、模板上鎖(Firebase Auth + RTDB)
- [ ] A3 智慧模式行號制 patch + LLM 選模板 fallback
- [ ] B 工作站直通(faster-whisper 本地 STT,POC 已過)
- [ ] 手機→工作站中繼(選配,B 走不通才做)

細節見 [STATE.md](STATE.md) / [DECISION_LOG.md](DECISION_LOG.md)。
