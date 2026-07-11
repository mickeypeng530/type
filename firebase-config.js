// firebase-config.js — Firebase 設定 + 初始化(共用:index.html / admin.html)
// config 是公開資訊(同 inc 專案),真正的門禁在 RTDB rules(鎖 email)。
// 共用專案 income-41a40;voice-report 資料放 /voiceReport 命名空間下。
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBsyN2w1iKQu10ePNAJEXSAgqemj5gOS-g",
  authDomain: "income-41a40.firebaseapp.com",     // 預設,別動(playbook)
  databaseURL: "https://income-41a40-default-rtdb.firebaseio.com",
  projectId: "income-41a40",
  storageBucket: "income-41a40.firebasestorage.app",
  messagingSenderId: "838512452225",
  appId: "1:838512452225:web:6ff8de1afa0f117f66a380",
};

export const configReady = true;
export const app = initializeApp(firebaseConfig);
