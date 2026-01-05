
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FarmlandTask, Marker, MarkerType, Point, PlotRange, AppState } from './types';
import { WellIcon, InletIcon, SeriesInletIcon, StarIcon, DrawIcon, PlusIcon } from './components/Icons';

// 初始化模擬數據
const generateMockTasks = (): FarmlandTask[] => {
  return Array.from({ length: 131 }).map((_, i) => ({
    id: `115-${i + 1}`,
    code: `P${String(i + 1).padStart(4, '0')}`,
    year: '115',
    owner: i % 3 === 0 ? '王大明' : (i % 3 === 1 ? '林建國' : '行政院農業部'),
    baseImage: `https://picsum.photos/seed/${i + 50}/1200/800`,
    status: 'PENDING',
    markers: [],
    ranges: [],
    formData: {
      irrigationMethods: [],
      landStatus: [],
      photos: { irrigation: [], land: [], surrounding: [] }
    }
  }));
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('farmland_app_v3');
    return saved ? JSON.parse(saved) : {
      tasks: generateMockTasks(),
      view: 'list',
      isEditingMap: true
    };
  });

  useEffect(() => {
    localStorage.setItem('farmland_app_v3', JSON.stringify(state));
  }, [state]);

  const currentTask = state.tasks.find(t => t.id === state.currentTaskId);

  const updateTask = (updates: Partial<FarmlandTask>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === state.currentTaskId ? { ...t, ...updates } : t)
    }));
  };

  const selectTask = (id: string) => {
    setState(prev => ({ ...prev, currentTaskId: id, view: 'editor', isEditingMap: true }));
  };

  if (state.view === 'list') {
    return <TaskListView tasks={state.tasks} onSelect={selectTask} />;
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

  return <div>Error State</div>;
};

// --- 子組件：任務清單 ---
const TaskListView: React.FC<{ tasks: FarmlandTask[], onSelect: (id: string) => void }> = ({ tasks, onSelect }) => {
  const [search, setSearch] = useState('');
  const filtered = tasks.filter(t => t.code.includes(search) || t.owner.includes(search));

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-slate-800">115年度農地現勘任務 <span className="text-slate-400 text-sm font-normal">({tasks.length} 筆)</span></h1>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200">
            <input 
              type="text" 
              placeholder="搜尋編號或業主..." 
              className="outline-none text-sm w-48"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(task => (
            <button 
              key={task.id}
              onClick={() => onSelect(task.id)}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all text-left group"
            >
              <div className="flex justify-between mb-3">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{task.code}</span>
                <StatusBadge status={task.status} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">{task.owner}</h3>
              <p className="text-xs text-slate-400">年度：{task.year}</p>
              <div className="mt-4 flex gap-1">
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full ${task.status === 'COMPLETED' ? 'w-full bg-emerald-500' : 'w-1/3 bg-amber-400'}`}></div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 子組件：主編輯器 ---
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
          </button>
          <div>
            <h2 className="font-bold text-lg leading-none">{task.code} - {task.owner}</h2>
            <span className="text-[10px] text-slate-400">115年度農地現勘編輯模式</span>
          </div>
        </div>
        <div className="flex gap-2">
           {isEditingMap ? (
             <button onClick={toggleMapEdit} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all">完成地圖編輯</button>
           ) : (
             <button onClick={toggleMapEdit} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl text-sm font-bold transition-all">修改地圖標記</button>
           )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Map Interactive Area */}
        <div className="flex-1 bg-slate-200 relative overflow-hidden flex items-center justify-center p-4">
           <div className="relative inline-block shadow-2xl rounded-lg overflow-hidden border-4 border-white bg-white">
              <MapInterface 
                task={task} 
                isEditing={isEditingMap} 
                activeTool={activeTool}
                onUpdate={onUpdate}
                onFinishDraw={() => setActiveTool(null)}
              />
           </div>

           {/* Marker Toolbar */}
           {isEditingMap && (
             <div className="absolute top-6 left-6 flex flex-col gap-3 bg-white/90 backdrop-blur p-3 rounded-2xl shadow-xl border border-white/50">
                <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest text-center">工具箱</p>
                <ToolBtn icon={<WellIcon />} label="地下水井" onClick={() => handleAddMarker('WELL')} />
                <ToolBtn icon={<InletIcon />} label="入水口" onClick={() => handleAddMarker('INLET')} />
                <ToolBtn icon={<SeriesInletIcon />} label="串聯入水口" onClick={() => handleAddMarker('SERIES_INLET')} />
                <ToolBtn icon={<StarIcon />} label="採樣點位" onClick={() => handleAddMarker('SAMPLE')} />
                <div className="h-px bg-slate-200 my-1" />
                <ToolBtn icon={<DrawIcon />} label="新增坵塊" onClick={handleStartDraw} active={activeTool === 'DRAW'} />
             </div>
           )}
        </div>

        {/* Right Side: Form & Photos */}
        <div className="w-full lg:w-96 bg-white border-l border-slate-200 overflow-y-auto p-6 space-y-8">
           <section>
              <h3 className="text-lg font-black text-slate-800 mb-4 border-l-4 border-emerald-500 pl-3">現勘調查表</h3>
              <div className="space-y-6">
                 <div>
                    <p className="text-sm font-bold text-slate-700 mb-3">1. 農地使用灌溉方式 (複選)</p>
                    <div className="grid grid-cols-1 gap-2">
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
                    <p className="text-sm font-bold text-slate-700 mb-3">2. 農地使用狀態 (複選)</p>
                    <div className="grid grid-cols-1 gap-2">
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
                       <div className="flex flex-col gap-2">
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
                              placeholder="請輸入其他狀態..."
                              className="border rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
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
              <h3 className="text-lg font-black text-slate-800 mb-4 border-l-4 border-emerald-500 pl-3">現勘照片上傳</h3>
              <div className="space-y-4">
                 <PhotoUploadSection 
                   title="用水型態" 
                   photos={task.formData.photos.irrigation} 
                   onUpload={(urls) => onUpdate({ formData: { ...task.formData, photos: { ...task.formData.photos, irrigation: [...task.formData.photos.irrigation, ...urls] } } })} 
                 />
                 <PhotoUploadSection 
                   title="農地現況" 
                   photos={task.formData.photos.land} 
                   onUpload={(urls) => onUpdate({ formData: { ...task.formData, photos: { ...task.formData.photos, land: [...task.formData.photos.land, ...urls] } } })} 
                 />
                 <PhotoUploadSection 
                   title="周圍現況" 
                   photos={task.formData.photos.surrounding} 
                   onUpload={(urls) => onUpdate({ formData: { ...task.formData, photos: { ...task.formData.photos, surrounding: [...task.formData.photos.surrounding, ...urls] } } })} 
                 />
              </div>
           </section>

           <div className="pt-6 border-t flex flex-col gap-3">
              <button 
                onClick={() => { onUpdate({ status: 'COMPLETED' }); alert('現勘結果已儲存！'); onBack(); }}
                className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 active:scale-95 transition-all"
              >
                儲存現勘結果
              </button>
              <button 
                onClick={() => alert('進入編輯模式')}
                className="w-full bg-white border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-2xl active:scale-95 transition-all"
              >
                編輯
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 子組件：互動地圖 (核心功能) ---
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
      
      onUpdate({ 
        markers: task.markers.map(m => m.id === id ? { ...m, x, y } : m) 
      });
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
      className="relative select-none cursor-crosshair"
      onClick={handleContainerClick}
      style={{ minWidth: '400px', maxWidth: '1000px' }}
    >
      <img src={task.baseImage} className="w-full h-auto block" alt="base" />
      
      {/* SVG Overlay for Polygons */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {task.ranges.map(range => (
          <polygon 
            key={range.id}
            points={range.points.map(p => `${p.x}%,${p.y}%`).join(' ')}
            fill="rgba(16, 185, 129, 0.2)"
            stroke="#10b981"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* Markers */}
      {task.markers.map(m => (
        <div 
          key={m.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 bg-white/50 backdrop-blur-sm rounded-full"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
          onMouseDown={(e) => handleDrag(m.id, e)}
          onTouchStart={(e) => handleDrag(m.id, e)}
        >
          {m.type === 'WELL' && <WellIcon />}
          {m.type === 'INLET' && <InletIcon />}
          {m.type === 'SERIES_INLET' && <SeriesInletIcon />}
          {m.type === 'SAMPLE' && <StarIcon />}
          {isEditing && (
            <button 
              className="absolute -top-2 -right-2 bg-slate-900 text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); onUpdate({ markers: task.markers.filter(x => x.id !== m.id) }); }}
            >✕</button>
          )}
        </div>
      ))}

      {/* Drawing Active Points Indicator */}
      {activeTool === 'DRAW' && task.ranges[task.ranges.length - 1]?.points.map((p, i) => (
        <div 
          key={i} 
          className="absolute w-2 h-2 bg-emerald-500 rounded-full -translate-x-1/2 -translate-y-1/2" 
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        />
      ))}
    </div>
  );
};

// --- 小型助手組件 ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles = {
    PENDING: 'bg-slate-100 text-slate-600',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    EDITING: 'bg-amber-100 text-amber-700'
  }[status] || 'bg-slate-100 text-slate-600';
  const label = { PENDING: '待現勘', COMPLETED: '已完成', EDITING: '修正中' }[status] || status;
  return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${styles}`}>{label}</span>;
};

const ToolBtn: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }> = ({ icon, label, onClick, active }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${active ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
  >
    <div className={active ? 'text-white' : ''}>{icon}</div>
    <span className={`text-[9px] mt-1 font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{label}</span>
  </button>
);

const Checkbox: React.FC<{ label: string, checked: boolean, onChange: () => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div 
      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white border-slate-200 text-transparent'}`}
      onClick={onChange}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
    </div>
    <span className={`text-sm font-medium ${checked ? 'text-slate-800' : 'text-slate-500'}`}>{label}</span>
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
    <div className="space-y-2">
       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
       <div className="flex gap-2 overflow-x-auto pb-1">
          <label className="flex-shrink-0 w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-slate-100 hover:border-emerald-300 cursor-pointer transition-all">
             <PlusIcon className="w-6 h-6" />
             <input type="file" multiple accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          {photos.map((p, i) => (
            <div key={i} className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 border border-slate-100 shadow-sm">
               <img src={p} className="w-full h-full object-cover" alt="upload" />
            </div>
          ))}
       </div>
    </div>
  );
};

export default App;