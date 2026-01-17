import React, { useState, useEffect } from 'react';

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
      {/* Decorative Corners */}
      {!task.completed && (
        <>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current opacity-50"></div>
        </>
      )}

      {/* Main Task Row */}
      <div className="flex items-center p-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
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
            {/* Time Badge */}
            {timeInfo && (
              <div className="flex items-center text-xs font-mono text-cyan-300 border border-cyan-900 bg-cyan-950/50 px-2 py-1 shadow-[0_0_5px_rgba(34,211,238,0.2)] whitespace-nowrap">
                <ClockIcon />
                <span>{timeInfo.text}</span>
                <span className="ml-2 text-cyan-600">//{timeInfo.duration}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center mt-2 space-x-3">
            {/* Stars */}
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} size={14} filled={i < task.priority} 
                  colorClass={i < task.priority ? (task.completed ? "text-gray-700" : (task.priority === 5 ? "text-red-500 drop-shadow-[0_0_5px_#ef4444]" : "text-yellow-400 drop-shadow-[0_0_3px_#facc15]")) : "text-gray-800"} 
                />
              ))}
            </div>
            {/* Progress Bar Style Badge */}
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

      {/* Subtasks Area */}
      {isExpanded && (
        <div className="border-t border-gray-800 bg-black/50 px-4 py-3 pl-14 relative">
          <div className="absolute left-10 top-0 bottom-0 w-px bg-gray-800"></div>
          
          <ul className="space-y-3 mb-4">
            {task.subtasks && task.subtasks.map(st => (
              <li key={st.id} className="flex items-center group">
                <div className="w-3 h-px bg-gray-600 mr-2"></div>
                <button
                  onClick={() => onToggleSubtask(task.id, st.id)}
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
          
          {/* Add Subtask Input */}
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

// 1. 定義預設任務 (只有第一次使用，完全沒有存檔時才會顯示這些)
const DEFAULT_TASKS = [
  { 
    id: 1, 
    text: "攻破企業防火牆", 
    priority: 5, 
    completed: false, 
    createdAt: Date.now() - 10000,
    scheduledStart: null,
    scheduledEnd: null,
    subtasks: [
      { id: 101, text: "繞過 ICE 認證", completed: true },
      { id: 102, text: "注入 SQL Payload", completed: false }
    ]
  },
  { 
    id: 2, 
    text: "升級義體韌體", 
    priority: 3, 
    completed: false, 
    createdAt: Date.now(),
    scheduledStart: null,
    scheduledEnd: null,
    subtasks: []
  }
];

export default function App() {
  // 2. 初始化 State：先去 localStorage 找，找不到才用預設值
  const [tasks, setTasks] = useState(() => {
    try {
      const savedTasks = localStorage.getItem("cyberpunk_tasks");
      if (savedTasks) {
        return JSON.parse(savedTasks);
      }
    } catch (e) {
      console.error("讀取存檔失敗", e);
    }
    return DEFAULT_TASKS;
  });
  
  const [inputText, setInputText] = useState("");
  const [inputPriority, setInputPriority] = useState(3);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // 3. 監聽 tasks 變化：只要任務有任何變動，立刻存檔到 localStorage
  useEffect(() => {
    localStorage.setItem("cyberpunk_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!inputText.trim()) return;
    
    const newTask = {
      id: Date.now(),
      text: inputText,
      priority: inputPriority,
      completed: false,
      createdAt: Date.now(),
      scheduledStart: startTime || null,
      scheduledEnd: endTime || null,
      subtasks: []
    };

    setTasks([...tasks, newTask]);
    setInputText("");
    setInputPriority(3);
    setStartTime("");
    setEndTime("");
  };

  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));

  const toggleTask = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const newCompletedState = !t.completed;
        const updatedSubtasks = t.subtasks.map(st => ({ ...st, completed: newCompletedState }));
        return { ...t, completed: newCompletedState, subtasks: updatedSubtasks };
      }
      return t;
    }));
  };

  const addSubtask = (taskId, text) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: false, 
          subtasks: [...t.subtasks, { id: Date.now(), text, completed: false }]
        };
      }
      return t;
    }));
  };

  const deleteSubtask = (taskId, subtaskId) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks: t.subtasks.filter(st => st.id !== subtaskId) };
      }
      return t;
    }));
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
        return { ...t, subtasks: updatedSubtasks, completed: allCompleted };
      }
      return t;
    }));
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
        
        {/* Header */}
        <div className="pt-8 pb-6 px-4 text-center">
          <h1 className={`text-3xl font-bold tracking-widest uppercase glitch-text mb-2 ${urgentCount > 0 ? 'text-red-500 drop-shadow-[0_0_10px_#ef4444]' : 'text-cyan-400 drop-shadow-[0_0_10px_#22d3ee]'}`}>
            系統_權限覆寫
          </h1>
          <div className="flex items-center justify-center space-x-2">
             <div className={`h-2 w-2 rounded-full ${urgentCount > 0 ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></div>
             <p className="text-xs text-gray-500 tracking-widest">
               狀態: {urgentCount > 0 ? `嚴重警告_待處理 [${urgentCount}]` : "系統_運作正常"}
             </p>
          </div>
        </div>

        {/* Input Console */}
        <div className="mx-4 mb-8 bg-black border border-cyan-900 shadow-[0_0_20px_rgba(34,211,238,0.1)] relative group">
          {/* Decorative Corner Lines */}
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

            {/* Time Controls */}
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