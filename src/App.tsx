import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Sparkles, Settings as SettingsIcon, Mic, Send, Plus, X, Trash2, Calendar, Edit3, ChevronRight, Save, MoreHorizontal, Check, Clock, FileText, MapPin, StopCircle, MicOff } from 'lucide-react';
import { Task, Note, Settings, Tab } from './types';
import { storage } from './services/storage';
import { processTaskInput, processNoteInput } from './services/ai';
import { useSpeech } from './hooks/useSpeech';
import { Loading } from './components/Loading';

// --- Components defined inline for file limit efficiency ---

const BottomNav: React.FC<{ current: Tab; onChange: (t: Tab) => void }> = ({ current, onChange }) => (
  // Added pb-safe specifically here to handle Home Indicator
  <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-safe pt-2 px-8 flex justify-between items-center z-50 transition-all duration-300">
    <button 
      onClick={() => onChange('todo')}
      className={`flex flex-col items-center space-y-1 active:scale-90 transition-transform duration-200 ${current === 'todo' ? 'text-ios-blue' : 'text-gray-400'}`}
    >
      <CheckSquare size={26} strokeWidth={current === 'todo' ? 2.5 : 2} />
      <span className="text-[10px] font-semibold">待办</span>
    </button>
    
    <div className="w-px h-8 bg-gray-200/50 mx-2"></div>

    <button 
      onClick={() => onChange('inspiration')}
      className={`flex flex-col items-center space-y-1 active:scale-90 transition-transform duration-200 ${current === 'inspiration' ? 'text-purple-500' : 'text-gray-400'}`}
    >
      <Sparkles size={26} strokeWidth={current === 'inspiration' ? 2.5 : 2} />
      <span className="text-[10px] font-semibold">灵感</span>
    </button>
  </div>
);

const TodoPage: React.FC<{ 
  tasks: Task[]; 
  onAddTask: (text: string) => Promise<void>; 
  onUpdateTask: (id: string, content: string) => void;
  onToggle: (id: string) => void; 
  onDelete: (id: string) => void;
  onClearCompleted: () => void;
  onClearToday: () => void;
  isLoading: boolean;
}> = ({ tasks, onAddTask, onUpdateTask, onToggle, onDelete, onClearCompleted, onClearToday, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  
  const { isListening, transcript, startListening, stopListening, abortListening, setTranscript } = useSpeech();
  const editInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript) setInputValue(prev => prev ? prev + ' ' + transcript : transcript);
  }, [transcript]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Scroll to bottom when tasks change
  useEffect(() => {
    if (listRef.current && tasks.length > 0 && !editingId) {
        // Optional: logic to scroll to new task
    }
  }, [tasks.length]);

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    await onAddTask(inputValue);
    setInputValue('');
    setTranscript('');
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditValue(task.content);
  };

  const saveEditing = (id: string) => {
    if (editValue.trim()) {
      onUpdateTask(id, editValue);
    }
    setEditingId(null);
  };

  const getLocalTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const checkOverdue = (task: Task) => {
    if (task.completed) return false;
    const now = new Date();
    const todayStr = getLocalTodayStr();
    const nowTimeStr = now.toTimeString().slice(0, 5);
    if (task.date < todayStr) return true;
    if (task.date === todayStr && task.time && task.time <= nowTimeStr) return true;
    return false;
  };

  const getRelativeDateLabel = (dateStr: string) => {
    const todayStr = getLocalTodayStr();
    const now = new Date();
    const tmr = new Date(now);
    tmr.setDate(tmr.getDate() + 1);
    const tomorrowStr = `${tmr.getFullYear()}-${String(tmr.getMonth() + 1).padStart(2, '0')}-${String(tmr.getDate()).padStart(2, '0')}`;

    if (dateStr === todayStr) return '今天';
    if (dateStr === tomorrowStr) return '明天';
    const [_, m, d] = dateStr.split('-');
    return `${parseInt(m)}月${parseInt(d)}日`;
  };

  const visibleTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || '').localeCompare(b.time || '');
  });

  const formatDateTitle = () => {
    const d = new Date();
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`;
  };

  return (
    <div className="flex flex-col h-full bg-ios-bg" onClick={() => showMenu && setShowMenu(false)}>
      {/* Header: Adds pt-safe to avoid status bar overlap */}
      <header className="px-5 pt-safe mt-4 pb-2 bg-ios-bg/95 backdrop-blur-sm sticky top-0 z-30 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">待办</h1>
          <p className="text-ios-gray font-medium text-sm mt-0.5 ml-0.5">{formatDateTitle()}</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-2 bg-white rounded-full shadow-ios text-gray-600 active:bg-gray-100 transition-colors"
          >
            <MoreHorizontal size={20} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-12 w-40 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-gray-100/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-40">
              <button 
                onClick={() => { onClearCompleted(); setShowMenu(false); }}
                className="w-full text-left px-4 py-3.5 text-sm text-slate-700 active:bg-gray-100 flex items-center gap-2 border-b border-gray-100"
              >
                <CheckSquare size={16} />
                清除已完成
              </button>
              <button 
                onClick={() => { onClearToday(); setShowMenu(false); }}
                className="w-full text-left px-4 py-3.5 text-sm text-red-500 active:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} />
                清空今日
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main List: Uses scroll-y class for native momentum scrolling */}
      <main ref={listRef} className="flex-1 scroll-y px-4 pb-32 pt-2">
        <div className="space-y-3">
          {visibleTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
              <CheckSquare size={56} className="mb-4 opacity-10" />
              <p className="text-sm font-medium opacity-60">今天还没有任务</p>
              <p className="text-xs opacity-40 mt-1">试着说点什么...</p>
            </div>
          ) : (
            visibleTasks.map(task => {
              const isOverdue = checkOverdue(task);
              const dateLabel = getRelativeDateLabel(task.date);
              
              return (
                <div 
                  key={task.id} 
                  className={`group bg-white p-4 rounded-2xl shadow-ios border flex items-center transition-all duration-300 active:scale-[0.99] ${
                    task.completed 
                      ? 'opacity-60 bg-gray-50/50 border-transparent' 
                      : isOverdue 
                        ? 'border-red-500/30 shadow-red-50' 
                        : 'border-white'
                  }`}
                >
                  <button 
                    onClick={() => onToggle(task.id)}
                    className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center mr-3.5 flex-shrink-0 transition-all ${task.completed ? 'bg-ios-blue border-ios-blue scale-105' : isOverdue ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    {task.completed && <Check size={14} className="text-white" strokeWidth={3} />}
                  </button>

                  <div className="flex-1 min-w-0 mr-2">
                    {editingId === task.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          ref={editInputRef}
                          type="text" 
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEditing(task.id)}
                          className="flex-1 text-base p-1 border-b-2 border-ios-blue outline-none bg-transparent"
                        />
                        <button onClick={() => saveEditing(task.id)} className="text-ios-blue p-1"><Check size={20} /></button>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className={`text-[17px] leading-snug break-words font-normal ${task.completed ? 'line-through text-gray-400' : 'text-slate-900'}`}>
                          {task.content}
                        </span>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                            <Calendar size={10} />
                            {dateLabel}
                          </div>

                          {task.time && (
                            <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${task.completed ? 'bg-gray-100 text-gray-400' : isOverdue ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-ios-blue'}`}>
                              <Clock size={10} />
                              {task.time}
                            </div>
                          )}

                           {task.location && (
                            <div className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-green-50 text-green-600">
                              <MapPin size={10} />
                              {task.location}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {editingId !== task.id && (
                      <button 
                        onClick={() => startEditing(task)}
                        className="p-2 text-gray-300 hover:text-ios-blue active:text-ios-blue transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => onDelete(task.id)}
                      className="p-2 text-gray-300 hover:text-red-500 active:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          
          {isLoading && <Loading />}
        </div>
      </main>

      {/* Input Bar: Positioned above bottom nav with enough safe area */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+60px)] left-0 right-0 px-4 z-20">
        {isListening ? (
          <div className="bg-white/95 backdrop-blur-xl rounded-[20px] shadow-2xl border border-gray-100 p-2 flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in">
             <button 
              onClick={abortListening}
              className="p-3 bg-gray-100 text-gray-500 rounded-full active:bg-gray-200 transition-colors"
              aria-label="取消录音"
            >
              <X size={22} />
            </button>
            <div className="flex-1 flex items-center justify-center gap-2 text-red-500 font-medium animate-pulse">
               <div className="flex gap-1 items-center h-4">
                  <span className="w-1 h-2 bg-red-500 rounded-full animate-[bounce_1s_infinite]"></span>
                  <span className="w-1 h-4 bg-red-500 rounded-full animate-[bounce_1.2s_infinite]"></span>
                  <span className="w-1 h-2 bg-red-500 rounded-full animate-[bounce_1s_infinite]"></span>
               </div>
              <span className="text-sm">正在录音...</span>
            </div>
            <button 
              onClick={stopListening}
              className="p-3 bg-ios-blue text-white rounded-full shadow-lg shadow-blue-500/30 active:scale-90 transition-transform"
              aria-label="完成录音"
            >
              <Check size={22} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-xl rounded-[20px] shadow-2xl border border-gray-100 p-2 flex items-center gap-2">
            <button 
              onClick={startListening}
              className="p-3 rounded-full transition-all duration-300 bg-gray-50 text-ios-blue active:bg-gray-200"
            >
              <Mic size={22} />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="添加任务..."
              className="flex-1 px-2 py-2.5 text-[17px] bg-transparent outline-none placeholder:text-gray-400"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button 
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 bg-ios-blue text-white rounded-full shadow-md disabled:opacity-50 disabled:shadow-none transition-all active:scale-90"
            >
              <Send size={18} fill="currentColor" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InspirationPage: React.FC<{
  notes: Note[];
  onAddNoteAI: (text: string) => Promise<void>;
  onAddNoteDirect: (text: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onClearNotes: () => void;
  isLoading: boolean;
}> = ({ notes, onAddNoteAI, onAddNoteDirect, onUpdateNote, onDeleteNote, onClearNotes, isLoading }) => {
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const { isListening, transcript, startListening, stopListening, abortListening, setTranscript } = useSpeech();

  useEffect(() => {
    if (transcript) setInputText(prev => prev ? prev + ' ' + transcript : transcript);
  }, [transcript]);

  const handleAISubmit = async () => {
    if (!inputText.trim()) return;
    setShowInput(false);
    await onAddNoteAI(inputText);
    setInputText('');
    setTranscript('');
  };

  const handleDirectSubmit = () => {
    if (!inputText.trim()) return;
    setShowInput(false);
    onAddNoteDirect(inputText);
    setInputText('');
    setTranscript('');
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEditing = (id: string) => {
    if (editContent.trim()) {
      onUpdateNote(id, editContent);
    }
    setEditingId(null);
  };

  const totalWords = notes.reduce((acc, note) => acc + note.content.length, 0);

  return (
    <div className="flex flex-col h-full bg-ios-bg" onClick={() => showMenu && setShowMenu(false)}>
      {/* Header with Stats: Uses pt-safe */}
      <div className="px-5 pt-safe mt-4 pb-6 bg-white/80 backdrop-blur-md rounded-b-[30px] shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-end mb-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">灵感</h1>
            
             <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-2 bg-gray-50/80 rounded-full shadow-sm text-gray-600 active:bg-gray-200 transition-colors"
              >
                <MoreHorizontal size={20} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-12 w-40 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-gray-100/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-40">
                  <button 
                    onClick={() => { onClearNotes(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3.5 text-sm text-red-500 active:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    清空全部
                  </button>
                </div>
              )}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50/80 p-3.5 rounded-2xl border border-orange-100/50">
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">累计记录</p>
            <p className="text-2xl font-bold text-orange-600 mt-0.5">{notes.length} <span className="text-sm font-medium opacity-60">篇</span></p>
          </div>
          <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-100/50">
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">累计字数</p>
            <p className="text-2xl font-bold text-purple-600 mt-0.5">{totalWords}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 scroll-y px-4 py-6 space-y-4 pb-32">
        {isLoading && <Loading />}
        
        {notes.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-[40vh] text-gray-400">
              <Sparkles size={56} className="mb-4 opacity-10" />
              <p className="font-medium opacity-60">记录下你的第一个灵感</p>
            </div>
        )}

        {notes.sort((a,b) => b.createdAt - a.createdAt).map((note, index) => (
          <div key={note.id} className="flex gap-4">
            <div className="flex flex-col items-center pt-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300 ring-4 ring-white"></div>
              {index !== notes.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1 rounded-full"></div>}
            </div>
            <div className="flex-1 bg-white p-5 rounded-2xl shadow-ios border border-white mb-2 active:scale-[0.99] transition-transform duration-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-[17px] text-slate-800 leading-snug">{note.title}</h3>
                <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {editingId === note.id ? (
                <div className="animate-in fade-in duration-200">
                    <textarea 
                        value={editContent} 
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full h-32 p-3 bg-gray-50 border border-ios-blue/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-[15px] leading-relaxed mb-3 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setEditingId(null)} 
                            className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-100 rounded-lg active:bg-gray-200"
                        >
                            取消
                        </button>
                        <button 
                            onClick={() => saveEditing(note.id)} 
                            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg active:scale-95 transition-transform flex items-center gap-1"
                        >
                            <Save size={12} /> 保存
                        </button>
                    </div>
                </div>
              ) : (
                <>
                    <p className="text-slate-600 text-[15px] leading-relaxed whitespace-pre-line">
                        {note.content}
                    </p>
                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center group">
                        <p className="text-[10px] text-gray-400 truncate flex-1 mr-4 font-mono opacity-70">原句: {note.raw}</p>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => startEditing(note)}
                                className="p-1.5 text-gray-300 hover:text-ios-blue active:text-ios-blue transition-colors"
                            >
                                <Edit3 size={16} />
                            </button>
                            <button 
                                onClick={() => onDeleteNote(note.id)}
                                className="p-1.5 text-gray-300 hover:text-red-500 active:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* Floating Add Button: Positioned well above nav */}
      <button 
        onClick={() => setShowInput(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+70px)] right-5 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-900/30 flex items-center justify-center transition-transform active:scale-90 z-20"
      >
        <Plus size={28} />
      </button>

      {/* Input Modal: Top aligned for Safe Area */}
      {showInput && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/20 backdrop-blur-sm p-4 pt-[calc(env(safe-area-inset-top)+20px)]">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-5 animate-in slide-in-from-top-10 fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-slate-800">记录灵感</h3>
              <button onClick={() => setShowInput(false)} className="p-1.5 bg-gray-100 rounded-full active:bg-gray-200"><X size={18} /></button>
            </div>
            <textarea
              className="w-full h-40 bg-gray-50 rounded-2xl p-4 text-[17px] outline-none resize-none mb-5 focus:ring-2 ring-ios-blue/10 transition-shadow placeholder:text-gray-400"
              placeholder="说点什么..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            ></textarea>
            
            <div className="flex flex-col gap-3">
              {/* Voice Input Section */}
              {isListening ? (
                 <div className="flex items-center gap-3">
                  <button onClick={abortListening} className="px-6 py-4 bg-gray-100 rounded-2xl text-gray-500 font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform">
                    <X size={20} />
                    取消
                  </button>
                  
                  <div className="flex-1 h-[72px] bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center justify-center gap-1 text-red-500 font-bold animate-pulse">
                     <div className="flex gap-1 items-center">
                        <span className="w-1 h-3 bg-red-400 rounded-full animate-[bounce_1s_infinite]"></span>
                        <span className="w-1 h-5 bg-red-500 rounded-full animate-[bounce_1.2s_infinite]"></span>
                        <span className="w-1 h-3 bg-red-400 rounded-full animate-[bounce_1s_infinite]"></span>
                     </div>
                     <span className="text-xs">正在听...</span>
                  </div>

                  <button onClick={stopListening} className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform shadow-lg shadow-slate-900/20">
                    <Check size={20} />
                    说完了
                  </button>
                </div>
              ) : (
                <button 
                  onClick={startListening}
                  className="w-full p-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-dashed bg-gray-50 border-gray-300 text-gray-500 active:bg-gray-100"
                >
                  <Mic size={22} />
                  <span className="text-[15px] font-semibold">点击开始语音输入</span>
                </button>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button 
                  onClick={handleDirectSubmit}
                  disabled={!inputText.trim()}
                  className="py-3.5 bg-gray-100 text-slate-700 rounded-2xl font-bold disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95 transition-transform"
                >
                  <FileText size={18} />
                  直接记录
                </button>
                <button 
                  onClick={handleAISubmit}
                  disabled={!inputText.trim()}
                  className="py-3.5 bg-slate-900 text-white rounded-2xl font-bold disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-slate-900/20"
                >
                  <Sparkles size={18} />
                  AI 润色
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage: React.FC<{ 
  settings: Settings; 
  onSave: (s: Settings) => void;
  onBack: () => void;
}> = ({ settings, onSave, onBack }) => {
  const [formData, setFormData] = useState(settings);

  return (
    <div className="h-full bg-ios-bg p-5 pt-[calc(env(safe-area-inset-top)+20px)]">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="mr-4 p-3 bg-white rounded-full shadow-sm active:bg-gray-50"><ChevronRight className="rotate-180 text-slate-900" size={22} /></button>
        <h1 className="text-3xl font-extrabold text-slate-900">设置</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-6 space-y-8">
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-3">DashScope API Key</label>
          <input 
            type="password"
            value={formData.apiKey}
            onChange={e => setFormData({...formData, apiKey: e.target.value})}
            className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-ios-blue/20 transition-all font-mono text-sm text-slate-700"
            placeholder="sk-..."
          />
          <p className="text-[11px] text-gray-400 mt-2 font-medium">您的 Key 仅存储在本地设备中。</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-900 mb-3">Base URL</label>
          <input 
            type="text"
            value={formData.baseUrl}
            onChange={e => setFormData({...formData, baseUrl: e.target.value})}
            className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-ios-blue/20 text-sm font-mono text-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-900 mb-3">Model</label>
          <input 
            type="text"
            value={formData.model}
            onChange={e => setFormData({...formData, model: e.target.value})}
            className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-ios-blue/20 text-sm font-mono text-slate-700"
          />
        </div>

        <button 
          onClick={() => { onSave(formData); onBack(); }}
          className="w-full py-4 bg-ios-blue text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4"
        >
          <Save size={20} />
          保存设置
        </button>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [view, setView] = useState<Tab>('todo');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<Settings>(storage.getSettings());
  const [loading, setLoading] = useState(false);

  // Initialize data
  useEffect(() => {
    setTasks(storage.getTasks());
    setNotes(storage.getNotes());
  }, []);

  // Persist data
  useEffect(() => storage.saveTasks(tasks), [tasks]);
  useEffect(() => storage.saveNotes(notes), [notes]);
  useEffect(() => storage.saveSettings(settings), [settings]);

  const handleAddTask = async (rawInput: string) => {
    if (!settings.apiKey) {
      alert('请先配置 API Key');
      setView('settings');
      return;
    }
    setLoading(true);
    try {
      const result = await processTaskInput(rawInput, settings);
      const newTask: Task = {
        id: Date.now().toString(),
        content: result.task,
        date: result.date,
        time: result.time,
        location: result.location,
        completed: false,
        createdAt: Date.now(),
      };
      setTasks(prev => [...prev, newTask]);
    } catch (e: any) {
      alert('AI 处理失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = (id: string, content: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, content } : t));
  };

  const handleAddNoteAI = async (rawInput: string) => {
    if (!settings.apiKey) {
      alert('请先配置 API Key');
      setView('settings');
      return;
    }
    setLoading(true);
    try {
      const result = await processNoteInput(rawInput, settings);
      const newNote: Note = {
        id: Date.now().toString(),
        title: result.title,
        content: result.content,
        raw: rawInput,
        createdAt: Date.now(),
      };
      setNotes(prev => [...prev, newNote]);
    } catch (e: any) {
      alert('AI 处理失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNoteDirect = (rawInput: string) => {
    const title = rawInput.split(/[\n,，.。]/)[0].slice(0, 15);
    const newNote: Note = {
      id: Date.now().toString(),
      title: title || '无标题记录',
      content: rawInput,
      raw: rawInput,
      createdAt: Date.now(),
    };
    setNotes(prev => [...prev, newNote]);
  };

  const handleUpdateNote = (id: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('确定删除这条灵感吗？')) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleClearNotes = () => {
    if (confirm('确定清空所有灵感记录吗？此操作不可恢复。')) {
      setNotes([]);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    if (confirm('确定删除吗？')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const clearCompleted = () => {
    if (confirm('确定清除所有已完成的任务吗？')) {
      setTasks(prev => prev.filter(t => !t.completed));
    }
  };

  const clearToday = () => {
    if (confirm('确定清空今天的所有任务吗？')) {
      const todayStr = new Date().toISOString().split('T')[0];
      setTasks(prev => prev.filter(t => t.date !== todayStr));
    }
  };

  if (view === 'settings') {
    return (
      <SettingsPage 
        settings={settings} 
        onSave={(s) => setSettings(s)} 
        onBack={() => setView('todo')} 
      />
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Settings Button (Corner): Adjusted for safe area */}
      <button 
        onClick={() => setView('settings')}
        className="fixed top-[calc(env(safe-area-inset-top)+12px)] right-5 z-20 p-2.5 bg-white/60 backdrop-blur-md rounded-full shadow-sm text-slate-600 active:bg-white transition-colors"
      >
        <SettingsIcon size={22} />
      </button>

      {/* Main Content Area */}
      <div className="h-full w-full">
        {view === 'todo' ? (
          <TodoPage 
            tasks={tasks} 
            onAddTask={handleAddTask} 
            onUpdateTask={handleUpdateTask}
            onToggle={toggleTask} 
            onDelete={deleteTask}
            onClearCompleted={clearCompleted}
            onClearToday={clearToday}
            isLoading={loading}
          />
        ) : (
          <InspirationPage 
            notes={notes}
            onAddNoteAI={handleAddNoteAI}
            onAddNoteDirect={handleAddNoteDirect}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onClearNotes={handleClearNotes}
            isLoading={loading}
          />
        )}
      </div>

      {/* Bottom Nav */}
      <BottomNav current={view} onChange={setView} />
    </div>
  );
};

export default App;