
import React, { useState, useEffect, useRef } from 'react';
import { FarmlandTask, Marker, MarkerType, Point, PlotRange, AppState } from './types';
import { WellIcon, InletIcon, SeriesInletIcon, StarIcon, DrawIcon, PlusIcon } from './components/Icons';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('farmland_app_v4');
    return saved ? JSON.parse(saved) : {
      projectName: '115年度農地現勘專案',
      tasks: [],
      view: 'list',
      isEditingMap: true
    };
  });

  useEffect(() => {
    localStorage.setItem('farmland_app_v4', JSON.stringify(state));
  }, [state]);

  const currentTask = state.tasks.find(t => t.id === state.currentTaskId);

  const updateTask = (updates: Partial<FarmlandTask>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === state.currentTaskId ? { ...t, ...updates } : t)
    }));
  };

  const handleExportProject = () => {
    const dataStr = JSON.stringify(state);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${state.projectName}_${new Date().toISOString().slice(0,10)}.farmland`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedState = JSON.parse(event.target?.result as string);
          setState({ ...importedState, view: 'list' });
          alert('專案載入成功！');
        } catch (err) {
          alert('匯入失敗，請確認檔案格式是否正確。');
        }
      };
      reader.readAsText(file);
    }
  };

  if (state.view === 'setup') {
    return (
      <SetupView 
        state={state} 
        setState={setState} 
        onBack={() => setState(p => ({ ...p, view: 'list' }))}
        onExport={handleExportProject}
      />
    );
  }

  if (state.view === 'list') {
    return (
      <TaskListView 
        state={state}
        onSelect={(id) => setState(p => ({ ...p, currentTaskId: id, view: 'editor', isEditingMap: true }))} 
        onGoToSetup={() => setState(p => ({ ...p, view: 'setup' }))}
        onImport={handleImportProject}
      />
    );
  }

  if (state.view === 'editor' && currentTask) {
    return (
      <EditorView 
        task={currentTask} 
        isEditingMap={state.isEditingMap}
        onBack={() => setState(p => ({ ...p, view: 'list', currentTaskId: undefined }))}
        onUpdate={updateTask}
        toggleMapEdit={() => setState(p => ({ ...p, isEditingMap: !p.isEditingMap }))}
      />
    );
  }

  return <div>系統載入中...</div>;
};

// --- 管理中心視圖 ---
const SetupView: React.FC<{ 
  state: AppState, 
  setState: React.Dispatch<React.SetStateAction<AppState>>, 
  onBack: () => void,
  onExport: () => void
}> = ({ state, setState, onBack, onExport }) => {
  const [importText, setImportText] = useState('');

  const handleBatchImport = () => {
    try {
      const lines = importText.trim().split('\n');
      const newTasks: FarmlandTask[] = lines.map((line, i) => {
        const [code, owner, baseImage] = line.split(',').map(s => s?.trim());
        return {
          id: `task-${Date.now()}-${i}`,
          code: code || `P${String(i+1).padStart(4, '0')}`,
          year: '115',
          owner: owner || '未知業主',
          baseImage: baseImage || `https://picsum.photos/seed/${i}/1200/800`,
          status: 'PENDING',
          markers: [],
          ranges: [],
          formData: {
            irrigationMethods: [],
            landStatus: [],
            photos: { irrigation: [], land: [], surrounding: [] }
          }
        };
      });
      setState(prev => ({ ...prev, tasks: [...prev.tasks, ...newTasks] }));
      setImportText('');
      alert(`已匯入 ${newTasks.length} 筆現勘對象`);
    } catch (e) {
      alert('匯入格式錯誤。請確保為：編號,業主,網址');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-center gap-6 mb-10">
           <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
           </button>
           <h1 className="text-3xl font-black text-slate-800">管理員中心</h1>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="bg-emerald-500 text-white p-2 rounded-xl text-sm">STEP 1</span>
              批次匯入現勘名單
            </h2>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-500">
                請輸入名單資料 (格式：編號,業主,現勘圖網址)
              </label>
              <textarea 
                rows={8}
                className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-4 text-sm font-mono focus:border-emerald-500 outline-none transition-all"
                placeholder="P0001,王小明,https://...&#10;P0002,陳大志,https://..."
                value={importText}
                onChange={e => setImportText(e.target.value)}
              />
              <button 
                onClick={handleBatchImport}
                className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-900 transition-all shadow-lg"
              >
                確認匯入並新增至清單
              </button>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="bg-indigo-500 text-white p-2 rounded-xl text-sm">STEP 2</span>
              產生分享專案檔
            </h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              點擊下方按鈕將下載 <span className="font-bold text-indigo-600">.farmland</span> 檔案。您可以將此檔案傳送給巡查人員，他們只需在同一個網址「載入」此檔案即可開始工作。
            </p>
            <button 
              onClick={onExport}
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all text-lg"
            >
              匯出專案分享檔
            </button>
          </section>

          <section className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100">
            <h2 className="text-lg font-bold text-rose-800 mb-4">重置區域</h2>
            <button 
              onClick={() => { if(confirm('確定要清空目前所有任務嗎？')) setState(p => ({ ...p, tasks: [] })) }}
              className="text-rose-600 font-bold hover:underline"
            >
              清空目前資料庫所有任務
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- 任務清單視圖 ---
const TaskListView: React.FC<{ 
  state: AppState, 
  onSelect: (id: string) => void, 
  onGoToSetup: () => void,
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
}> = ({ state, onSelect, onGoToSetup, onImport }) => {
  const [search, setSearch] = useState('');
  const filtered = state.tasks.filter(t => t.code.includes(search) || t.owner.includes(search));
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">{state.projectName}</h1>
            <div className="flex items-center gap-3 mt-2">
               <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">目前進度</span>
               <p className="text-slate-500 text-sm font-bold">{state.tasks.filter(t => t.status === 'COMPLETED').length} / {state.tasks.length} 筆已完成</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl text-sm font-black shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
              載入專案檔
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".farmland" onChange={onImport} />
            <button 
              onClick={onGoToSetup}
              className="bg-slate-800 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09-2.06 0-3.99.33-5.75.94 0 0 0 0 .5.5.54.54.54 1.41 0 1.95l-.25.25c-.54.54-1.41.54-1.95 0L.25 18.89c-.54-.54-.54-1.41 0-1.95l.25-.25c.54-.54 1.41-.54 1.95 0l.25.25c.54.54.54 1.41 0 1.95l-.25.25c-.54.54-1.41.54-1.95 0L.25 18.89c-.54-.54-.54-1.41 0-1.95l.25-.25c.54-.54 1.41-.54 1.95 0l.25.25c.54.54.54 1.41 0 1.95l-.25.25z" /></svg>
              管理中心
            </button>
          </div>
        </header>

        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="輸入編號、業主或關鍵字進行檢索..." 
            className="w-full bg-white border-2 border-slate-100 rounded-3xl py-5 pl-14 pr-6 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 shadow-sm transition-all font-medium text-slate-700"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {state.tasks.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-50">
             <div className="text-7xl mb-8">🔭</div>
             <h3 className="text-2xl font-black text-slate-800 mb-3">尚未載入現勘任務</h3>
             <p className="text-slate-400 mb-10 max-w-sm mx-auto font-medium leading-relaxed">請點擊上方「管理中心」建立新名單，或點擊「載入專案檔」匯入現有的調查計畫。</p>
             <button onClick={onGoToSetup} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-emerald-200 hover:scale-105 active:scale-95 transition-all">前往建立任務</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filtered.map(task => (
              <button 
                key={task.id}
                onClick={() => onSelect(task.id)}
                className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:border-emerald-500 hover:shadow-2xl transition-all text-left group relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-tighter">{task.code}</span>
                  <StatusBadge status={task.status} />
                </div>
                <h3 className="font-black text-slate-800 text-2xl mb-2 group-hover:text-emerald-700 transition-colors">{task.owner}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{task.year}年度 調查樣本</p>
                
                <div className="mt-8 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-300 group-hover:text-emerald-500 transition-colors uppercase tracking-[0.2em]">Enter Inspection</span>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- 主編輯器視圖 ---
const EditorView: React.FC<{ 
  task: FarmlandTask, 
  isEditingMap: boolean, 
  onBack: () => void, 
  onUpdate: (u: Partial<FarmlandTask>) => void,
  toggleMapEdit: () => void
}> = ({ task, isEditingMap, onBack, onUpdate, toggleMapEdit }) => {
  const [activeTool, setActiveTool] = useState<MarkerType | 'DRAW' | null>(null);
  
  const handleAddMarker = (type: MarkerType) => {
    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 50,
      y: 50
    };
    onUpdate({ markers: [...task.markers, newMarker] });
  };

  const handleStartDraw = () => {
    const newRange: PlotRange = { id: Date.now().toString(), points: [] };
    onUpdate({ ranges: [...task.ranges, newRange] });
    setActiveTool('DRAW');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-[100]">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all active:scale-90">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
          </button>
          <div>
            <h2 className="font-black text-xl tracking-tight">{task.code} - {task.owner}</h2>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Live Survey Mode</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
           {isEditingMap ? (
             <button onClick={toggleMapEdit} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-2xl text-sm font-black shadow-lg shadow-emerald-900/40 transition-all border border-emerald-400/30">完成編輯</button>
           ) : (
             <button onClick={toggleMapEdit} className="bg-slate-700 hover:bg-slate-600 px-8 py-3 rounded-2xl text-sm font-black transition-all border border-slate-600">修改</button>
           )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
        <div className="flex-1 bg-slate-200 relative overflow-hidden flex items-center justify-center p-8">
           <div className="relative inline-block shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden border-[8px] border-white bg-white">
              <MapInterface 
                task={task} 
                isEditing={isEditingMap} 
                activeTool={activeTool}
                onUpdate={onUpdate}
                onFinishDraw={() => setActiveTool(null)}
              />
           </div>

           {isEditingMap && (
             <div className="absolute top-10 left-10 flex flex-col gap-4 bg-white/95 backdrop-blur-xl p-5 rounded-[2.5rem] shadow-2xl border border-white">
                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] text-center">Toolkit</p>
                <ToolBtn icon={<WellIcon className="w-7 h-7" />} label="地下水井" onClick={() => handleAddMarker('WELL')} />
                <ToolBtn icon={<InletIcon className="w-7 h-7" />} label="入水口" onClick={() => handleAddMarker('INLET')} />
                <ToolBtn icon={<SeriesInletIcon className="w-7 h-7" />} label="串聯入水" onClick={() => handleAddMarker('SERIES_INLET')} />
                <ToolBtn icon={<StarIcon className="w-7 h-7" />} label="採樣點位" onClick={() => handleAddMarker('SAMPLE')} />
                <div className="h-px bg-slate-100 my-2 mx-2" />
                <ToolBtn icon={<DrawIcon className="w-7 h-7" />} label="新增坵塊" onClick={handleStartDraw} active={activeTool === 'DRAW'} />
             </div>
           )}
        </div>

        <div className="w-full lg:w-[450px] bg-white border-l border-slate-200 overflow-y-auto p-10 space-y-12 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.05)]">
           <section>
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight">現勘調查表</h3>
              </div>

              <div className="space-y-10">
                 <div>
                    <p className="text-sm font-black text-slate-500 mb-5 uppercase tracking-[0.1em]">1. 農地使用灌溉方式 (複選)</p>
                    <div className="space-y-3">
                       {['地下水井', '灌溉溝渠', '地下水+灌溉溝渠'].map(opt => (
                         <Checkbox 
                           key={opt} label={opt} 
                           checked={task.formData.irrigationMethods.includes(opt)}
                           onChange={() => {
                             const current = task.formData.irrigationMethods;
                             const next = current.includes(opt) ? current.filter(i => i !== opt) : [...current, opt];
                             onUpdate({ formData: { ...task.formData, irrigationMethods: next } });
                           }}
                         />
                       ))}
                    </div>
                 </div>

                 <div>
                    <p className="text-sm font-black text-slate-500 mb-5 uppercase tracking-[0.1em]">2. 農地使用狀態 (複選)</p>
                    <div className="space-y-3">
                       {['農地可採樣', '建物', '難以採樣', '果樹'].map(opt => (
                         <Checkbox 
                           key={opt} label={opt} 
                           checked={task.formData.landStatus.includes(opt)}
                           onChange={() => {
                             const current = task.formData.landStatus;
                             const next = current.includes(opt) ? current.filter(i => i !== opt) : [...current, opt];
                             onUpdate({ formData: { ...task.formData, landStatus: next } });
                           }}
                         />
                       ))}
                       <div className="flex flex-col gap-4 pt-4">
                          <Checkbox 
                            label="其他" 
                            checked={task.formData.landStatus.includes('其他')} 
                            onChange={() => {
                              const current = task.formData.landStatus;
                              const next = current.includes('其他') ? current.filter(i => i !== '其他') : [...current, '其他'];
                              onUpdate({ formData: { ...task.formData, landStatus: next } });
                            }}
                          />
                          {task.formData.landStatus.includes('其他') && (
                            <input 
                              type="text" 
                              placeholder="請輸入其他狀態描述..."
                              className="w-full border-2 border-slate-100 rounded-2xl p-5 text-sm font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all bg-slate-50"
                              value={task.formData.otherStatus || ''}
                              onChange={e => onUpdate({ formData: { ...task.formData, otherStatus: e.target.value } })}
                            />
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           </section>

           <section>
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight">現勘照片</h3>
              </div>
              <div className="space-y-8">
                 <PhotoUploadSection title="用水型態" photos={task.formData.photos.irrigation} onUpload={(urls) => onUpdate({ formData: { ...task.formData, photos: { ...task.formData.photos, irrigation: [...task.formData.photos.irrigation, ...urls] } } })} />
                 <PhotoUploadSection title="農地現況" photos={task.formData.photos.land} onUpload={(urls) => onUpdate({ formData: { ...task.formData, photos: { ...task.formData.photos, land: [...task.formData.photos.land, ...urls] } } })} />
                 <PhotoUploadSection title="周圍現況" photos={task.formData.photos.surrounding} onUpload={(urls) => onUpdate({ formData: { ...task.formData, photos: { ...task.formData.photos, surrounding: [...task.formData.photos.surrounding, ...urls] } } })} />
              </div>
           </section>

           <div className="pt-12 border-t border-slate-100 pb-16">
              <button 
                onClick={() => { onUpdate({ status: 'COMPLETED' }); alert('儲存成功！請記得回到列表匯出專案檔。'); onBack(); }}
                className="w-full bg-emerald-600 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all mb-6 text-xl tracking-tight"
              >
                儲存現勘結果
              </button>
              <button 
                onClick={() => alert('進入編輯模式')}
                className="w-full bg-white border-2 border-slate-200 text-slate-500 font-black py-4 rounded-[1.5rem] active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                編輯
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 互動地圖組件 ---
const MapInterface: React.FC<{ 
  task: FarmlandTask, 
  isEditing: boolean, 
  activeTool: string | null,
  onUpdate: (u: Partial<FarmlandTask>) => void,
  onFinishDraw: () => void
}> = ({ task, isEditing, activeTool, onUpdate, onFinishDraw }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isEditing || activeTool !== 'DRAW') return;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const lastRange = task.ranges[task.ranges.length - 1];
    const updatedRange = { ...lastRange, points: [...lastRange.points, { x, y }] };
    onUpdate({ ranges: [...task.ranges.slice(0, -1), updatedRange] });
  };

  const handleDrag = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditing) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const moveHandler = (moveEvent: any) => {
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      onUpdate({ markers: task.markers.map(m => m.id === id ? { ...m, x, y } : m) });
    };
    const endHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
    };
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('touchend', endHandler);
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative select-none ${isEditing ? 'cursor-crosshair' : 'cursor-default'}`}
      onClick={handleContainerClick}
      style={{ minWidth: '400px', maxWidth: '85vh' }}
    >
      <img src={task.baseImage} className="w-full h-auto block" alt="base" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {task.ranges.map(range => (
          <polygon 
            key={range.id}
            points={range.points.map(p => `${p.x}%,${p.y}%`).join(' ')}
            fill="rgba(16, 185, 129, 0.35)"
            stroke="#10b981"
            strokeWidth="4"
            className="drop-shadow-sm"
          />
        ))}
      </svg>
      {task.markers.map(m => (
        <div 
          key={m.id}
          className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 bg-white/90 backdrop-blur-md shadow-2xl rounded-full border-2 border-white transition-transform ${isEditing ? 'cursor-grab active:cursor-grabbing scale-150' : 'scale-110'}`}
          style={{ left: `${m.x}%`, top: `${m.y}%`, zIndex: 10 }}
          onMouseDown={(e) => handleDrag(m.id, e)}
          onTouchStart={(e) => handleDrag(m.id, e)}
        >
          {m.type === 'WELL' && <WellIcon className="w-6 h-6" />}
          {m.type === 'INLET' && <InletIcon className="w-6 h-6" />}
          {m.type === 'SERIES_INLET' && <SeriesInletIcon className="w-6 h-6" />}
          {m.type === 'SAMPLE' && <StarIcon className="w-6 h-6" />}
          {isEditing && (
            <button 
              className="absolute -top-4 -right-4 bg-slate-900 text-white w-6 h-6 rounded-full text-[10px] font-black border-2 border-white shadow-lg flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); onUpdate({ markers: task.markers.filter(x => x.id !== m.id) }); }}
            >✕</button>
          )}
        </div>
      ))}
      {activeTool === 'DRAW' && task.ranges[task.ranges.length - 1]?.points.map((p, i) => (
        <div key={i} className="absolute w-4 h-4 bg-emerald-500 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg" style={{ left: `${p.x}%`, top: `${p.y}%` }} />
      ))}
    </div>
  );
};

// --- 小型輔助組件 ---
const ToolBtn: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }> = ({ icon, label, onClick, active }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-24 h-24 rounded-[2rem] transition-all ${active ? 'bg-emerald-600 text-white shadow-2xl scale-110 border-2 border-emerald-400/50' : 'bg-slate-50 text-slate-600 hover:bg-white hover:shadow-xl hover:text-emerald-600'}`}>
    {icon}
    <span className={`text-[10px] mt-2 font-black uppercase tracking-tighter ${active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'}`}>{label}</span>
  </button>
);

const Checkbox: React.FC<{ label: string, checked: boolean, onChange: () => void }> = ({ label, checked, onChange }) => (
  <label className={`flex items-center gap-5 cursor-pointer group p-5 rounded-3xl transition-all border-2 ${checked ? 'bg-emerald-50/50 border-emerald-500 shadow-lg shadow-emerald-50' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`} onClick={onChange}>
    <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${checked ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-200'}`}>
      {checked && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
    </div>
    <span className={`text-base font-black ${checked ? 'text-emerald-900' : 'text-slate-600'}`}>{label}</span>
  </label>
);

const PhotoUploadSection: React.FC<{ title: string, photos: string[], onUpload: (urls: string[]) => void }> = ({ title, photos, onUpload }) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => onUpload([reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };
  return (
    <div className="space-y-4">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
       <div className="flex gap-4 overflow-x-auto pb-4 px-2">
          <label className="flex-shrink-0 w-28 h-28 bg-slate-50 border-3 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 hover:bg-white hover:border-emerald-400 hover:text-emerald-500 cursor-pointer transition-all shadow-sm">
             <PlusIcon className="w-10 h-10" />
             <input type="file" multiple accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          {photos.map((p, i) => (
            <div key={i} className="flex-shrink-0 w-28 h-28 rounded-[2rem] overflow-hidden bg-white border-4 border-white shadow-xl relative group">
               <img src={p} className="w-full h-full object-cover" alt="upload" />
            </div>
          ))}
       </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles = {
    PENDING: 'bg-slate-100 text-slate-500',
    COMPLETED: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200',
    EDITING: 'bg-amber-400 text-white shadow-lg shadow-amber-200'
  }[status] || 'bg-slate-100 text-slate-600';
  const label = { PENDING: '待處理', COMPLETED: '已完成', EDITING: '修正中' }[status] || status;
  return <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.1em] ${styles}`}>{label}</span>;
};

export default App;
