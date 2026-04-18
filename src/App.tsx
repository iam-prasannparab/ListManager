import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  Clock, 
  CheckCircle, 
  X, 
  Save, 
  ChevronRight,
  ListTodo,
  Download,
  Activity,
  ArrowLeft,
  Menu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Item {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface LogEntry {
  timestamp: string;
  operation: "CREATE" | "UPDATE" | "DELETE" | string;
  id: string;
  title: string;
  details: string;
}

export default function App() {
  const [view, setView] = useState<"items" | "logs">("items");
  const [items, setItems] = useState<Item[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [timezone, setTimezone] = useState<"UTC" | "IST">("UTC");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (view === "items") {
      fetchItems();
    } else {
      fetchLogs();
    }
  }, [view]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/items");
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError("Connection failure: Backend unreachable.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/logs/json");
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError("Failed to fetch activity logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : "/api/items";
      const method = editingItem ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Operation failed");

      await fetchItems();
      closeModal();
    } catch (err) {
      setError("Failed to save item.");
    }
  };

  const deleteItem = async (id: number) => {
    try {
      const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError("Failed to remove item.");
    }
  };

  const openModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({ title: item.title, description: item.description });
    } else {
      setEditingItem(null);
      setFormData({ title: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ title: "", description: "" });
    setError(null);
  };

  const downloadXls = async () => {
    try {
      const response = await fetch("/api/logs/xls");
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "activity_log_ist.xls";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to download Excel file. Please try again.");
    }
  };

  const downloadTxt = async () => {
    try {
      const response = await fetch("/api/logs/txt");
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "activity_log_ist.txt";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to download text file. Please try again.");
    }
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    if (timezone === "UTC") {
      return date.toISOString().replace('T', ' ').split('.')[0] + ' UTC';
    } else {
      // IST is UTC + 5:30
      const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
      const d = istDate.toISOString().split('T')[0];
      const t = istDate.toISOString().split('T')[1].split('.')[0];
      return `${d} ${t} IST`;
    }
  };

  const getStatusColor = (op: string) => {
    switch (op) {
      case "CREATE": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "DELETE": return "bg-red-100 text-red-800 border-red-200";
      case "UPDATE": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm relative z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 font-bold text-lg md:text-xl text-primary">
            <ListTodo className="w-5 h-5 md:w-6 h-6" />
            <span className="hidden sm:inline">ListManagerSystem</span>
            <span className="sm:hidden">LMS</span>
            <span className="text-slate-400 font-normal text-xs md:text-sm">v1.0.5</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden lg:flex bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200 items-center gap-2">
            <CheckCircle className="w-3 h-3" />
            Live DB Connected
          </div>
          <div className="hidden sm:flex text-sm text-text-sub items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <strong className="font-mono text-text-main">3000</strong>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
              />
              <motion.div 
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-72 bg-white z-40 md:hidden shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3 font-bold text-xl text-primary">
                    <ListTodo className="w-6 h-6" />
                    <span>LMS Admin</span>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-text-sub" />
                  </button>
                </div>
                <div className="p-6">
                  <SidebarContent view={view} setView={(v) => { setView(v); setIsSidebarOpen(false); }} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <nav className="hidden md:flex w-64 bg-sidebar-bg border-r border-border flex-col p-6 shrink-0 overflow-y-auto shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
          <SidebarContent view={view} setView={setView} />
        </nav>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-bg flex flex-col gap-6 relative">
          <AnimatePresence mode="wait">
            {view === "items" ? (
              <motion.div 
                key="items-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-6 h-full"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-white p-4 md:p-6 rounded-2xl border border-border shadow-sm group hover:border-primary/50 transition-colors">
                    <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-text-sub mb-1 md:mb-2 group-hover:text-primary transition-colors">Total Items</div>
                    <div className="text-2xl md:text-3xl font-black">{items.length}</div>
                  </div>
                  <div className="bg-white p-4 md:p-6 rounded-2xl border border-border shadow-sm group hover:border-success/50 transition-colors text-success">
                    <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider opacity-60 mb-1 md:mb-2 group-hover:opacity-100 transition-opacity">Active Records</div>
                    <div className="text-2xl md:text-3xl font-black">{items.length}</div>
                  </div>
                  <div className="bg-white p-4 md:p-6 rounded-2xl border border-border shadow-sm group hover:border-orange-500/50 transition-colors text-orange-500">
                    <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider opacity-60 mb-1 md:mb-2 group-hover:opacity-100 transition-opacity">DB Latency</div>
                    <div className="text-2xl md:text-3xl font-black">4<span className="text-xs md:text-sm font-normal opacity-60 ml-1">ms</span></div>
                  </div>
                </div>

                <div className="bg-white border border-border rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm">
                  <div className="p-4 md:p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                    <div>
                      <h2 className="text-lg md:text-xl font-black tracking-tight text-text-main">Data Repository</h2>
                      <p className="text-[10px] md:text-xs text-text-sub mt-0.5">Live management of persistent system objects</p>
                    </div>
                    <button 
                      onClick={() => openModal()}
                      className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      Add Record
                    </button>
                  </div>

                  <div className="overflow-x-auto flex-1 scrollbar-hide">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-text-sub tracking-widest">
                          <th className="px-6 py-4 border-b border-border">UID</th>
                          <th className="px-6 py-4 border-b border-border">Title_Entity</th>
                          <th className="px-6 py-4 border-b border-border">Context_Data</th>
                          <th className="px-6 py-4 border-b border-border">Timestamp</th>
                          <th className="px-6 py-4 border-b border-border text-right">Execution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="p-20 text-center font-mono text-xs italic opacity-40">System scanning repository...</td>
                          </tr>
                        ) : items.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-20 text-center text-text-sub opacity-20 flex flex-col items-center gap-2">
                              <ListTodo className="w-12 h-12" />
                              <span className="font-mono text-xs">NO_CORES_DETECTED</span>
                            </td>
                          </tr>
                        ) : (
                          items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150 border-b border-border/50">
                              <td className="px-6 py-5 font-mono text-[10px] text-text-sub">#{item.id.toString().padStart(4, '0')}</td>
                              <td className="px-6 py-5 font-bold text-sm tracking-tight">{item.title}</td>
                              <td className="px-6 py-5 text-sm text-text-sub max-w-[300px] truncate">{item.description || "—"}</td>
                              <td className="px-6 py-5 font-mono text-[10px] text-text-sub uppercase">
                                {new Date(item.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-5 text-right flex justify-end gap-3">
                                <button 
                                  onClick={() => openModal(item)}
                                  className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                                >
                                  EDIT
                                </button>
                                <button 
                                  onClick={() => deleteItem(item.id)}
                                  className="text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                                >
                                  DELETE
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="logs-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-6 h-full"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setView("items")}
                      className="p-2 rounded-xl border border-border hover:bg-white text-text-sub transition-all"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-text-main">System Audit Logs</h2>
                      <p className="text-xs text-text-sub">Complete accountability trace of database transactions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button 
                        onClick={downloadXls}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary hover:bg-white px-3 py-1.5 rounded-lg transition-all"
                        title="Download Excel Log"
                      >
                        <Download className="w-3 h-3" />
                        <span>Excel</span>
                      </button>
                      <button 
                        onClick={downloadTxt}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary hover:bg-white px-3 py-1.5 rounded-lg transition-all"
                        title="Download Text Log"
                      >
                        <Download className="w-3 h-3" />
                        <span>Text</span>
                      </button>
                    </div>

                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setTimezone("UTC")}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                          timezone === "UTC" ? "bg-white text-primary shadow-sm" : "text-text-sub hover:text-text-main"
                        )}
                      >
                        UTC
                      </button>
                      <button
                        onClick={() => setTimezone("IST")}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                          timezone === "IST" ? "bg-white text-primary shadow-sm" : "text-text-sub hover:text-text-main"
                        )}
                      >
                        IST
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-border rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase font-bold text-text-sub tracking-widest whitespace-nowrap">
                          <th className="px-6 py-4 border-b border-border">
                            {timezone === "UTC" ? "UTC_Timestamp" : "IST_Timestamp"}
                          </th>
                          <th className="px-6 py-4 border-b border-border">Operation</th>
                          <th className="px-6 py-4 border-b border-border">Resource_ID</th>
                          <th className="px-6 py-4 border-b border-border">Record_Title</th>
                          <th className="px-6 py-4 border-b border-border">Transaction_Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="p-20 text-center font-mono text-xs opacity-40">Decrypting system logs...</td>
                          </tr>
                        ) : logs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-20 text-center text-text-sub opacity-20">
                              <Activity className="w-12 h-12 mx-auto mb-4" />
                              <span className="font-mono text-xs">NO_LOGS_ON_FILE</span>
                            </td>
                          </tr>
                        ) : (
                          [...logs].reverse().map((log, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors duration-75 border-b border-border/50">
                              <td className={cn(
                                "px-6 py-4 font-mono text-[10px] whitespace-nowrap",
                                timezone === "IST" ? "text-primary font-bold" : "text-text-sub"
                              )}>
                                {formatTimestamp(log.timestamp)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                  getStatusColor(log.operation)
                                )}>
                                  {log.operation}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-text-main">#{log.id}</td>
                              <td className="px-6 py-4 font-bold text-sm">{log.title}</td>
                              <td className="px-6 py-4 text-xs text-text-sub italic font-serif bg-slate-50/30">
                                {log.details}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-border rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-border bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-text-main">
                    {editingItem ? 'Edit Context' : 'New Allocation'}
                  </h2>
                  <p className="text-xs text-text-sub uppercase tracking-widest font-bold mt-1">Transaction Node: 3000</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-2xl transition-all">
                  <X size={24} className="text-text-main" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-sub pl-1">Target_Title</label>
                  <input 
                    autoFocus
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter unique title..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-sub pl-1">Description_Context</label>
                  <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide execution context..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary transition-all resize-none italic font-serif"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase border border-red-100 flex items-center gap-3">
                    <X size={14} />
                    CRITICAL_ERROR: {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-sub hover:bg-slate-100 transition-colors"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Save size={16} />
                    Commit Node
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({ view, setView }: { view: string, setView: (v: "items" | "logs") => void }) {
  return (
    <>
      <div className="mb-8">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-sub mb-4 flex items-center gap-2 opacity-60">
          <Activity size={10} /> Operation Mode
        </h3>
        <div className="space-y-1.5">
          <button 
            onClick={() => setView("items")}
            className={cn(
              "w-full flex items-center gap-3 p-2.5 rounded-xl text-sm transition-all duration-200",
              view === "items" 
                ? "bg-primary text-white font-bold shadow-lg shadow-blue-100" 
                : "text-text-main hover:bg-slate-50"
            )}
          >
            <ListTodo className={cn("w-4 h-4", view === "items" ? "text-white" : "text-text-sub")} />
            Data Repository
          </button>
          <button 
            onClick={() => setView("logs")}
            className={cn(
              "w-full flex items-center gap-3 p-2.5 rounded-xl text-sm transition-all duration-200",
              view === "logs" 
                ? "bg-primary text-white font-bold shadow-lg shadow-blue-100" 
                : "text-text-main hover:bg-slate-50"
            )}
          >
            <Activity className={cn("w-4 h-4", view === "logs" ? "text-white" : "text-text-sub")} />
            System Audit Logs
          </button>
        </div>
      </div>

      <div className="mt-auto">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-sub mb-4 opacity-60">Environment Details</h3>
        <div className="bg-slate-50 rounded-xl p-4 border border-border">
          <div className="font-mono text-[10px] leading-relaxed text-text-sub space-y-2">
            <div className="flex justify-between">
              <span>RUNTIME</span>
              <span className="text-text-main font-bold">NodeJS</span>
            </div>
            <div className="flex justify-between">
              <span>STORAGE</span>
              <span className="text-text-main font-bold">SQLite-3</span>
            </div>
            <div className="flex justify-between">
              <span>ENGINE</span>
              <span className="text-text-main font-bold">V8_CORE</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



