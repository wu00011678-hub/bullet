import React, { useState, useEffect } from 'react';
// 引入 Firebase 核心功能
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot 
} from "firebase/firestore";

// --- Firebase 設定區 (請換成你自己的 Firebase 專案設定) ---
// 如果你在 CodeSandbox 或本機執行，請去 firebase.google.com 申請免費專案
// 然後把你的 config 貼在這裡覆蓋掉預設值
const firebaseConfig = { 
  apiKey :"AIzaSyBfekd-qb18_0j8RNGeLQUe8LZ1xoNRhnE" , 
  authDomain : "bullet-f2309.firebaseapp.com" , 
  projectId : "bullet-f2309" , 
  storageBucket : "bullet-f2309.firebasestorage.app" , 
  messagingSenderId : "199988816797" , 
  appId : "1:199988816797:web:93efde2f5ce122fe985d74" , 
  measurementId : "G-SPHPYJ5QCR" 
};

// 初始化 Firebase (加入錯誤捕捉)
let app, auth, db;
let initError = null;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  initError = e.message;
}

// 修正 APP_ID：優先使用環境變數，解決權限不足的問題
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : "cyberpunk-bullet-journal";

// --- Cyberpunk Icons (圖標元件) ---
const StarIcon = ({ filled, colorClass, onClick, size = 20 }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={`${colorClass} transition-all duration-200 cursor-pointer hover:shadow-[0_0_8px_currentColor]`}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TrashIcon = ({ onClick, size=18 }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="text-gray-600 hover:text-red-500 hover:shadow-[0_0_10px_#ef4444] cursor-pointer transition-all">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const CheckIcon = ({ size=16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" className="text-black">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronDown = ({ onClick, className }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="text-cyan-400 mr-2 shadow-[0_0_5px_#22d3ee]">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const SyncIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

const AlertIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

// --- Helper Functions ---
const formatTimeRange = (start, end) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const dateStr = startDate.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
  const startTimeStr = startDate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  const endTimeStr = endDate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });

  const diffMs = endDate - startDate;
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  let durationStr = "";
  if (hours > 0) durationStr += `${hours}小時`;
  if (mins > 0) durationStr += `${mins}分`;

  return { text: `${dateStr} [${startTimeStr} » ${endTimeStr}]`, duration: durationStr };
};

// --- Sub Components ---
const TaskItem = ({ task, onToggle, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState("");

  const timeInfo = formatTimeRange(task.scheduledStart, task.scheduledEnd);
  
  // Cyberpunk Style Logic
  let containerClass = "bg-black/80 border-l-4";
  let borderClass = "border-gray-800";
  let textClass = "text-gray-300";
  let glowClass = "";
  
  if (task.completed) {
    containerClass = "bg-gray-900/30 opacity-50 border-gray-800";
    textClass = "text-gray-600 line-through decoration-2";
  } else {
    if (task.priority === 5) { 
      containerClass = "bg-red-950/20 border-red-500"; 
      glowClass = "shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse";
      textClass = "text-red-400 font-bold drop-shadow-[0_0_3px_#ef4444]";
    }
    else if (task.priority === 4) { 
      containerClass = "bg-fuchsia-950/20 border-fuchsia-500";
      textClass = "text-fuchsia-400";
    }
    else if (task.priority === 3) { 
      containerClass = "bg-yellow-950/20 border-yellow-400";
      textClass = "text-yellow-400";
    }
    else { 
      containerClass = "bg-cyan-950/20 border-cyan-500";
      textClass = "text-cyan-400";
    }
  }

  const handleSubtaskSubmit = () => {
    if (!subtaskInput.trim()) return;
    onAddSubtask(task.id, subtaskInput);
    setSubtaskInput("");
  };

  const completedSubtasks = task.subtasks ? task.subtasks.filter(st => st.completed).length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

  return (
    <div className={`mb-4 relative border border-gray-800 transition-all duration-300 ${containerClass} ${glowClass}`}>
      {!task.completed && (
        <>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current opacity-50"></div>
        </>
      )}

      <div className="flex items-center p-4">
        <button
          onClick={() => onToggle(task.id, task.completed)}
          className={`flex-shrink-0 w-6 h-6 mr-4 flex items-center justify-center border-2 transition-all duration-200 ${
            task.completed 
              ? "bg-cyan-500 border-cyan-500 shadow-[0_0_10px_#06b6d4]" 
              : "border-gray-600 hover:border-cyan-400 hover:shadow-[0_0_5px_#22d3ee] bg-transparent"
          }`}
        >
          {task.completed && <CheckIcon />}
        </button>

        <div className="flex-1 min-w-0 cursor-pointer group" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className={`text-lg tracking-wider font-mono truncate ${textClass}`}>
              {task.text}
            </span>
            {timeInfo && (
              <div className="flex items-center text-xs font-mono text-cyan-300 border border-cyan-900 bg-cyan-950/50 px-2 py-1 shadow-[0_0_5px_rgba(34,211,238,0.2)] whitespace-nowrap">
                <ClockIcon />
                <span>{timeInfo.text}</span>
                <span className="ml-2 text-cyan-600">//{timeInfo.duration}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center mt-2 space-x-3">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} size={14} filled={i < task.priority} 
                  colorClass={i < task.priority ? (task.completed ? "text-gray-700" : (task.priority === 5 ? "text-red-500 drop-shadow-[0_0_5px_#ef4444]" : "text-yellow-400 drop-shadow-[0_0_3px_#facc15]")) : "text-gray-800"} 
                />
              ))}
            </div>
            {totalSubtasks > 0 && (
              <div className="flex items-center">
                 <span className={`text-[10px] font-mono px-2 py-0.5 border ${completedSubtasks === totalSubtasks ? 'border-green-500 text-green-500 shadow-[0_0_5px_#22c55e]' : 'border-gray-600 text-gray-500'}`}>
                    子程序: {completedSubtasks}/{totalSubtasks}
                 </span>
                 <div className="w-16 h-1.5 bg-gray-800 ml-2 border border-gray-700">
                    <div 
                      className="h-full bg-cyan-500 shadow-[0_0_5px_#06b6d4] transition-all duration-300" 
                      style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                    ></div>
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center ml-2 space-x-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-cyan-700 hover:text-cyan-400 transition">
            <ChevronDown className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 transition">
            <TrashIcon size={18} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-800 bg-black/50 px-4 py-3 pl-14 relative">
          <div className="absolute left-10 top-0 bottom-0 w-px bg-gray-800"></div>
          
          <ul className="space-y-3 mb-4">
            {task.subtasks && task.subtasks.map(st => (
              <li key={st.id} className="flex items-center group">
                <div className="w-3 h-px bg-gray-600 mr-2"></div>
                <button
                  onClick={() => onToggleSubtask(task.id, st.id, st.completed)}
                  className={`w-4 h-4 mr-3 flex items-center justify-center border transition-all ${st.completed ? 'bg-green-500 border-green-500 shadow-[0_0_5px_#22c55e]' : 'border-gray-600 bg-black hover:border-green-500'}`}
                >
                  {st.completed && <CheckIcon size={10} />}
                </button>
                <span className={`text-sm font-mono flex-1 ${st.completed ? 'text-gray-600 line-through' : 'text-gray-400'}`}>
                  {st.text}
                </span>
                <TrashIcon size={14} onClick={() => onDeleteSubtask(task.id, st.id)} />
              </li>
            ))}
          </ul>
          
          <div className="flex items-center mt-2 border-b border-gray-700 pb-1">
            <span className="text-cyan-600 mr-2 text-lg font-mono">{">>"}</span>
            <input 
              type="text" 
              placeholder="輸入子數據..." 
              className="flex-1 bg-transparent text-cyan-400 placeholder-gray-700 outline-none text-sm font-mono"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubtaskSubmit()}
            />
            <button 
              onClick={handleSubtaskSubmit}
              disabled={!subtaskInput.trim()}
              className="text-xs text-cyan-500 hover:text-cyan-300 font-mono disabled:opacity-20 uppercase"
            >
              [上傳數據]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  // 同步代碼：只要手機和電腦輸入一樣的代碼，資料就會同步
  const [syncCode, setSyncCode] = useState(() => localStorage.getItem("cyberpunk_sync_code") || "DEFAULT_ROOM");
  const [isEditingSync, setIsEditingSync] = useState(false);
  const [systemError, setSystemError] = useState(initError || ""); // 系統錯誤訊息

  const [inputText, setInputText] = useState("");
  const [inputPriority, setInputPriority] = useState(3);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // 0. 檢查 Config 是否還是預設值
  useEffect(() => {
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
      setSystemError("尚未設定 Firebase！請修改程式碼填入 API Key 才能存檔。");
    }
  }, []);

  // 1. 初始化 Firebase Auth (修正版：優先使用 Custom Token)
  useEffect(() => {
    if (systemError) return; // 如果有設定錯誤就不嘗試連線

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          // 優先嘗試 Custom Token (適用於 Canvas 等環境)
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // 本機開發或無 Token 時使用匿名登入
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth Error", e);
        // 如果 Custom Token 失敗，嘗試 fallback 到匿名 (這可能需要根據具體環境決定)
        // 這裡顯示錯誤讓使用者知道
        setSystemError(`登入失敗: ${e.message}`);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, [systemError]);

  // 2. 監聽 Firestore 數據 (即時同步核心)
  useEffect(() => {
    if (!user || systemError) return;

    try {
      const collectionRef = collection(db, 'artifacts', APP_ID, 'public', 'data', `room_${syncCode}`);
      
      const unsubscribeSnapshot = onSnapshot(collectionRef, (snapshot) => {
        const loadedTasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTasks(loadedTasks);
        setSystemError(""); // 成功連線則清除錯誤
      }, (error) => {
        console.error("同步失敗:", error);
        if (error.code === 'permission-denied') {
          setSystemError("權限不足：請檢查 Firebase Firestore 規則是否設為 Test Mode (測試模式)");
        } else {
          setSystemError(`連線中斷: ${error.message}`);
        }
      });

      localStorage.setItem("cyberpunk_sync_code", syncCode);
      return () => unsubscribeSnapshot();
    } catch (e) {
      setSystemError(`資料庫錯誤: ${e.message}`);
    }
  }, [user, syncCode, systemError]);

  // --- CRUD Operations ---

  const addTask = async () => {
    if (systemError) {
      alert("系統錯誤，無法新增任務。請先修復上方的錯誤訊息。");
      return;
    }
    if (!inputText.trim() || !user) return;
    
    const newTask = {
      text: inputText,
      priority: inputPriority,
      completed: false,
      createdAt: Date.now(),
      scheduledStart: startTime || null,
      scheduledEnd: endTime || null,
      subtasks: []
    };

    try {
      const collectionRef = collection(db, 'artifacts', APP_ID, 'public', 'data', `room_${syncCode}`);
      await addDoc(collectionRef, newTask);
      
      setInputText("");
      setInputPriority(3);
      setStartTime("");
      setEndTime("");
    } catch (e) {
      console.error("新增失敗", e);
      setSystemError(`新增失敗: ${e.message}`);
    }
  };

  const deleteTask = async (id) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', `room_${syncCode}`, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("刪除失敗", e);
      setSystemError(`刪除失敗: ${e.message}`);
    }
  };

  const toggleTask = async (id, currentStatus) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', `room_${syncCode}`, id);
      const task = tasks.find(t => t.id === id);
      const newCompletedState = !currentStatus;
      const updatedSubtasks = task.subtasks ? task.subtasks.map(st => ({ ...st, completed: newCompletedState })) : [];

      await updateDoc(docRef, { 
        completed: newCompletedState,
        subtasks: updatedSubtasks
      });
    } catch (e) {
      console.error("更新失敗", e);
      setSystemError(`更新失敗: ${e.message}`);
    }
  };

  const addSubtask = async (taskId, text) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtasks = [...(task.subtasks || []), { id: Date.now(), text, completed: false }];
    
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', `room_${syncCode}`, taskId);
      await updateDoc(docRef, { 
        subtasks: newSubtasks,
        completed: false 
      });
    } catch (e) {
      console.error("子任務新增失敗", e);
    }
  };

  const deleteSubtask = async (taskId, subtaskId) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', `room_${syncCode}`, taskId);
      await updateDoc(docRef, { subtasks: newSubtasks });
    } catch (e) {
      console.error("子任務刪除失敗", e);
    }
  };

  const toggleSubtask = async (taskId, subtaskId, currentStatus) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !currentStatus } : st
    );
    const allCompleted = newSubtasks.length > 0 && newSubtasks.every(st => st.completed);

    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', `room_${syncCode}`, taskId);
      await updateDoc(docRef, { 
        subtasks: newSubtasks,
        completed: allCompleted
      });
    } catch (e) {
      console.error("子任務更新失敗", e);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.completed) {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.createdAt - b.createdAt;
    }
    return b.createdAt - a.createdAt;
  });

  const urgentCount = tasks.filter(t => !t.completed && t.priority === 5).length;

  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono selection:bg-cyan-500 selection:text-black">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="max-w-xl mx-auto relative z-10 pb-20">
        
        {/* Header & Sync Status */}
        <div className="pt-8 pb-6 px-4 text-center">
          <h1 className={`text-3xl font-bold tracking-widest uppercase glitch-text mb-2 ${urgentCount > 0 ? 'text-red-500 drop-shadow-[0_0_10px_#ef4444]' : 'text-cyan-400 drop-shadow-[0_0_10px_#22d3ee]'}`}>
            系統_權限覆寫
          </h1>
          
          <div className="flex flex-col items-center justify-center space-y-2">
             {/* 錯誤訊息橫幅 */}
             {systemError ? (
               <div className="flex items-center space-x-2 bg-red-900/50 border border-red-500 px-4 py-2 rounded text-xs animate-pulse mb-2">
                  <AlertIcon className="text-red-500" />
                  <span className="text-red-200 font-bold">{systemError}</span>
               </div>
             ) : (
               <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${user ? (urgentCount > 0 ? 'bg-red-500 animate-ping' : 'bg-green-500') : 'bg-yellow-500 animate-pulse'}`}></div>
                  <p className="text-xs text-gray-500 tracking-widest">
                    {user ? (urgentCount > 0 ? `嚴重警告_待處理 [${urgentCount}]` : "系統_運作正常") : "連接伺服器中..."}
                  </p>
               </div>
             )}

             {/* Sync Code Input Area */}
             <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 px-3 py-1 rounded text-xs">
                <SyncIcon className="text-cyan-500" />
                <span className="text-gray-500 uppercase">同步頻段:</span>
                {isEditingSync ? (
                  <input 
                    type="text" 
                    value={syncCode} 
                    onChange={(e) => setSyncCode(e.target.value.toUpperCase())}
                    onBlur={() => setIsEditingSync(false)}
                    className="bg-transparent text-cyan-400 outline-none w-24 uppercase font-bold"
                    autoFocus
                  />
                ) : (
                  <span 
                    onClick={() => setIsEditingSync(true)} 
                    className="text-cyan-400 font-bold cursor-pointer hover:underline"
                    title="點擊修改同步代碼"
                  >
                    {syncCode}
                  </span>
                )}
             </div>
             <p className="text-[10px] text-gray-600">在手機輸入相同頻段即可同步</p>
          </div>
        </div>

        {/* Input Console */}
        <div className="mx-4 mb-8 bg-black border border-cyan-900 shadow-[0_0_20px_rgba(34,211,238,0.1)] relative group">
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-500"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-500"></div>

          <div className="p-5">
            <div className="flex items-center mb-4 border-b border-gray-800 pb-2">
              <span className="text-cyan-500 mr-2 font-bold">{'>'}</span>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="輸入新指令..."
                className="w-full bg-transparent text-cyan-300 placeholder-gray-700 outline-none font-mono"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wider">執行_開始</label>
                <input 
                  type="datetime-local" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs bg-gray-900 border border-gray-700 text-gray-300 p-2 outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wider">執行_結束</label>
                <input 
                  type="datetime-local" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs bg-gray-900 border border-gray-700 text-gray-300 p-2 outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">優先_等級:</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} size={20} filled={star <= inputPriority} 
                      colorClass={star <= inputPriority ? (inputPriority === 5 ? "text-red-500 drop-shadow-[0_0_8px_#ef4444]" : "text-yellow-400 drop-shadow-[0_0_5px_#facc15]") : "text-gray-800"} 
                      onClick={() => setInputPriority(star)} 
                    />
                  ))}
                </div>
              </div>
              <button onClick={addTask} disabled={!inputText.trim()} 
                className={`px-6 py-1 text-sm font-bold tracking-widest border transition-all duration-300 ${!inputText.trim() ? 'border-gray-800 text-gray-800 cursor-not-allowed' : 'border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_15px_#22d3ee]'}`}>
                執行程序
              </button>
            </div>
          </div>
        </div>

        {/* Task Feed */}
        <div className="px-4 space-y-4">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-800">
              <p className="text-gray-600 text-sm tracking-widest">無執行中程序</p>
            </div>
          ) : (
            sortedTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={toggleTask} 
                onDelete={deleteTask}
                onAddSubtask={addSubtask}
                onToggleSubtask={toggleSubtask}
                onDeleteSubtask={deleteSubtask}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}