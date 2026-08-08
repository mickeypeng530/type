// firebase-init.js — Firebase 初始化 + 帳號常數(共用:index.html / admin.html)
// config 公開沒關係,權限由 database.rules.json 把關(retake 模式)。
// 共用專案 income-41a40;voice-report 資料在 /voiceReport 命名空間下。
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsyN2w1iKQu10ePNAJEXSAgqemj5gOS-g",
  authDomain: "income-41a40.firebaseapp.com",     // 預設,別動(firebase-auth-ios playbook)
  databaseURL: "https://income-41a40-default-rtdb.firebaseio.com",
  projectId: "income-41a40",
  storageBucket: "income-41a40.firebasestorage.app",
  messagingSenderId: "838512452225",
  appId: "1:838512452225:web:6ff8de1afa0f117f66a380",
};

// Owner(deer530530@gmail.com,Google 登入)— 有寫入權;同字串也寫在 database.rules.json
export const OWNER_UID = "QtXg0hI1XxfaVxi16lyb1ezYWin2";
// 共用密碼帳號:密碼由 Firebase Auth 保管,程式碼與 RTDB 都不存密碼。
// 換密碼 → Firebase Console → Authentication → Users → 改這個帳號的密碼即可,不用改 code。
export const SHARED_EMAIL = "viewer@voicereport.app";
export const SHARED_UID = "0pFD7DVEqkMlAPx0YON0McITYXG2";

export const fbApp = initializeApp(firebaseConfig);
export const fbAuth = getAuth(fbApp);
export const fbDb = getDatabase(fbApp);
