"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { 
  Activity, TrendingUp, TrendingDown, DollarSign, Wallet, 
  CreditCard, PieChart, ArrowUpRight, ArrowDownRight, 
  Search, Plus, FileText, Loader2, X, Download, Zap, Calendar,
  Building2, Briefcase, Calculator, CheckCircle2, Edit2,
  // IMPORT ICON SET FOR MAPPING
  Terminal, BadgeDollarSign, Palette, Scale, Users, Settings2,
  LifeBuoy, Rocket, Database, Bug, ShieldCheck, Box, FolderKanban,
  Megaphone, Headphones, Globe, Cloud, Map, BarChart3, Layers
} from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";

// --- ICON MAP REGISTRY ---
const WorkspaceIconMap: Record<string, any> = {
  Terminal, TrendingUp, BadgeDollarSign, Palette, Scale, Users, 
  Settings2, LifeBuoy, Rocket, Database, Briefcase, Bug, ShieldCheck, 
  Box, FolderKanban, Megaphone, Headphones, Globe, Cloud, Map, 
  BarChart3, Layers
};

// --- CUSTOM SVG CHART COMPONENTS ---

const CashFlowWave = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return (
    <div className="h-[200px] flex items-center justify-center text-muted text-xs font-medium italic border-2 border-dashed border-border rounded-xl">
      No financial data recorded yet.
    </div>
  );

  const height = 180;
  const width = 600; 
  const maxVal = Math.max(...data.map(d => d.amount), 100); 
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.amount / maxVal) * (height - 20)); 
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="w-full h-[200px] overflow-hidden relative group">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M0,${height} ${points} V${height} H0Z`} fill="url(#gradient)" />
        <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const BurnGauge = ({ months }: { months: number }) => {
  const safeMonths = months || 0;
  const rotation = Math.min(Math.max((safeMonths / 12) * 180, 0), 180); 
  const color = safeMonths < 1 ? "text-red-500" : safeMonths < 3 ? "text-orange-500" : "text-green-500";
  
  return (
    <div className="relative w-32 h-16 overflow-hidden mx-auto mt-4">
      <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-foreground/10 box-border"></div>
      <div 
        className={`absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-transparent border-t-current ${color} transition-all duration-1000 ease-out`}
        style={{ transform: `rotate(${rotation - 45}deg)` }} 
      ></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <span className={`text-2xl font-bold ${color}`}>{safeMonths === Infinity ? "∞" : safeMonths.toFixed(1)}</span>
      </div>
    </div>
  );
};

export default function FinanceConsole() {
  const params = useParams();
  const companyId = params.companyId as any;
  const [activeTab, setActiveTab] = useState<'ledger' | 'retainers' | 'budgets'>('ledger');
  
  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isRetainerModalOpen, setIsRetainerModalOpen] = useState(false);
  const [isBudgetEditModalOpen, setIsBudgetEditModalOpen] = useState<{isOpen: boolean, wsId: Id<"workspaces"> | null, currentBudget: number}>({ isOpen: false, wsId: null, currentBudget: 0 });
  const [invoiceToast, setInvoiceToast] = useState<string | null>(null);

  // Forms
  const [newTx, setNewTx] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "Operations",
    isAdSpend: false,
    workspaceId: "" 
  });
  const [newRetainer, setNewRetainer] = useState({ clientName: "", amount: "" });
  const [budgetForm, setBudgetForm] = useState("");

  // Data
  const stats = useQuery(api.finance.getFinancialStats, { companyId });
  const transactions = useQuery(api.finance.getTransactions, { companyId });
  const budgets = useQuery(api.finance.getBudgetOverview, { companyId });
  const workspaces = useQuery(api.workspaces.getByCompany, { companyId });
  
  // Mutations
  const logTransaction = useMutation(api.finance.logTransaction);
  const deleteTx = useMutation(api.finance.deleteTransaction);
  const createRetainer = useMutation(api.finance.createRetainer);
  const setWorkspaceBudget = useMutation(api.finance.setWorkspaceBudget);

  // --- ACTIONS ---

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.description || !newTx.amount) return;

    await logTransaction({
        companyId,
        description: newTx.description,
        amount: parseFloat(newTx.amount),
        type: newTx.type,
        category: newTx.category,
        isAdSpend: newTx.isAdSpend,
        workspaceId: newTx.workspaceId ? newTx.workspaceId as Id<"workspaces"> : undefined
    });

    setNewTx({ description: "", amount: "", type: "expense", category: "Operations", isAdSpend: false, workspaceId: "" });
    setIsTxModalOpen(false);
  };

  const handleRetainerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRetainer.clientName || !newRetainer.amount) return;
    await createRetainer({ companyId, clientName: newRetainer.clientName, totalBudget: parseFloat(newRetainer.amount) });
    setNewRetainer({ clientName: "", amount: "" });
    setIsRetainerModalOpen(false);
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(isBudgetEditModalOpen.wsId && budgetForm) {
          await setWorkspaceBudget({ workspaceId: isBudgetEditModalOpen.wsId, budget: parseFloat(budgetForm) });
          setIsBudgetEditModalOpen({ isOpen: false, wsId: null, currentBudget: 0 });
          setBudgetForm("");
      }
  }

  const triggerInvoice = (client: string, amount: number) => {
    setInvoiceToast(`Generating invoice for ${client} (₹${amount})...`);
    setTimeout(() => {
        setInvoiceToast(null);
        alert("Invoice downloaded (Simulation)");
    }, 2000);
  };

  const downloadCSV = () => {
      if (!transactions || transactions.length === 0) return;
      
      const headers = ["Date", "Description", "Category", "Type", "Amount (INR)", "Author", "Department/Workspace"];
      const rows = transactions.map(t => [
        new Date(t.date).toISOString().split('T')[0],
        `"${t.description.replace(/"/g, '""')}"`,
        t.category,
        t.type,
        t.amount,
        t.authorName,
        t.workspaceName || "General"
      ]);
      
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `fiscal_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
  };

  // Helper to render icon
  const getWsIcon = (iconName: string) => {
    const Icon = WorkspaceIconMap[iconName] || Layers;
    return <Icon className="w-5 h-5 text-foreground" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans relative">
      
      {/* TOAST */}
      {invoiceToast && (
          <div className="fixed bottom-8 right-8 bg-foreground text-background px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10 z-[200]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-bold text-sm">{invoiceToast}</span>
          </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-wider mb-2">
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Financial Intelligence
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Fiscal Pulse</h1>
          <p className="text-muted text-lg font-normal">Real-time cash flow analysis & automated ledger.</p>
        </div>
        
        <button 
            onClick={() => setIsTxModalOpen(true)}
            className="apple-button h-12 px-6 flex items-center gap-3 shadow-lg hover:shadow-accent/20"
        >
            <Plus className="w-5 h-5" />
            <span>New Transaction</span>
        </button>
      </header>

      {/* --- MODALS --- */}

      {/* 1. TRANSACTION MODAL */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="glass-panel w-full max-w-lg p-8 rounded-[32px] shadow-2xl bg-background border border-white/10 relative">
                <button onClick={() => setIsTxModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-foreground/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                <h2 className="text-2xl font-bold mb-1 tracking-tight">Log Transaction</h2>
                <p className="text-sm text-muted mb-8">Enter financial details for the ledger.</p>
                
                <form onSubmit={handleTxSubmit} className="space-y-5">
                    <div>
                        <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">Title / Description</label>
                        <input 
                            autoFocus
                            className="input-field w-full" 
                            placeholder="e.g. AWS Server Costs"
                            value={newTx.description}
                            onChange={e => setNewTx({...newTx, description: e.target.value})}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                         <div>
                            <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">Amount (₹)</label>
                            <input 
                                type="number"
                                className="input-field w-full font-mono" 
                                placeholder="0.00"
                                value={newTx.amount}
                                onChange={e => setNewTx({...newTx, amount: e.target.value})}
                            />
                        </div>
                         <div>
                            <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">Type</label>
                            <select 
                                className="input-field w-full bg-background"
                                value={newTx.type}
                                onChange={e => setNewTx({...newTx, type: e.target.value as any})}
                            >
                                <option value="expense">Expense (-)</option>
                                <option value="income">Income (+)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">Category</label>
                            <select 
                                className="input-field w-full bg-background"
                                value={newTx.category}
                                onChange={e => setNewTx({...newTx, category: e.target.value})}
                            >
                                <option value="Operations">Operations & Rent</option>
                                <option value="Software">Software & SaaS</option>
                                <option value="Infrastructure">Infrastructure (Cloud)</option>
                                <option value="Talent">Talent & Contractors</option>
                                <option value="Marketing">Marketing & Ads</option>
                                <option value="Legal">Legal & Compliance</option>
                                <option value="Travel">Travel & Events</option>
                                <option value="Office">Office Supplies</option>
                                <option value="Equipment">Hardware & Equipment</option>
                                <option value="Client Payment">Client Revenue</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">Workspace (Optional)</label>
                            <select 
                                className="input-field w-full bg-background"
                                value={newTx.workspaceId}
                                onChange={e => setNewTx({...newTx, workspaceId: e.target.value})}
                            >
                                <option value="">-- General / Corporate --</option>
                                {workspaces?.map(ws => (
                                    <option key={ws._id} value={ws._id}>{ws.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex items-center pt-2">
                         <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-foreground/5 w-full transition-colors">
                             <input 
                                 type="checkbox" 
                                 checked={newTx.isAdSpend}
                                 onChange={e => setNewTx({...newTx, isAdSpend: e.target.checked})}
                                 className="w-5 h-5 rounded border-border bg-transparent text-accent focus:ring-accent"
                             />
                             <span className="text-sm font-medium text-foreground">Flag as Ad-Spend (Pass-through)</span>
                         </label>
                    </div>

                    <button type="submit" className="apple-button w-full justify-center mt-4 h-12 text-sm font-bold uppercase tracking-widest">
                        Record Entry
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* 2. RETAINER MODAL */}
      {isRetainerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="glass-panel w-full max-w-sm p-8 rounded-[32px] shadow-2xl bg-background border border-white/10 relative">
                <button onClick={() => setIsRetainerModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-foreground/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                <h2 className="text-xl font-bold mb-6">New Retainer Agreement</h2>
                <form onSubmit={handleRetainerSubmit} className="space-y-4">
                    <div>
                        <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">Client Name</label>
                        <input className="input-field w-full" placeholder="e.g. Acme Corp" value={newRetainer.clientName} onChange={e => setNewRetainer({...newRetainer, clientName: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">Total Value (₹)</label>
                        <input type="number" className="input-field w-full font-mono" placeholder="50000" value={newRetainer.amount} onChange={e => setNewRetainer({...newRetainer, amount: e.target.value})} />
                    </div>
                    <button type="submit" className="apple-button w-full justify-center h-12 mt-2">Initialize Retainer</button>
                </form>
             </div>
        </div>
      )}

      {/* 3. BUDGET EDIT MODAL */}
      {isBudgetEditModalOpen.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="glass-panel w-full max-w-sm p-8 rounded-[32px] shadow-2xl bg-background border border-white/10 relative">
                  <button onClick={() => setIsBudgetEditModalOpen({isOpen: false, wsId: null, currentBudget: 0})} className="absolute top-6 right-6 p-2 hover:bg-foreground/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                  <h2 className="text-xl font-bold mb-2">Set Budget</h2>
                  <p className="text-xs text-muted mb-6">Allocate funds for this workspace.</p>
                  <form onSubmit={handleBudgetSubmit} className="space-y-4">
                      <div className="p-4 bg-foreground/5 rounded-xl mb-4">
                          <p className="text-[10px] uppercase font-bold text-muted mb-1">Current Allocation</p>
                          <p className="text-xl font-bold font-mono">₹{isBudgetEditModalOpen.currentBudget.toLocaleString()}</p>
                      </div>
                      <div>
                          <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">New Budget (₹)</label>
                          <input type="number" autoFocus className="input-field w-full font-mono" placeholder="100000" value={budgetForm} onChange={e => setBudgetForm(e.target.value)} />
                      </div>
                      <button type="submit" className="apple-button w-full justify-center h-12 mt-2">Update Allocation</button>
                  </form>
              </div>
          </div>
      )}


      {/* --- DASHBOARD CONTENT --- */}

      {/* INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* CASH FLOW WAVE */}
          <div className="md:col-span-8 glass-panel p-6 rounded-[32px] border-border bg-background relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              <div className="flex justify-between items-start z-10 relative">
                  <div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <Activity className="w-5 h-5 text-accent" /> Net Cash Flow
                      </h3>
                      <p className="text-sm text-muted">30-Day moving trend</p>
                  </div>
                  <div className="text-right">
                      <p className="text-3xl font-bold text-foreground tracking-tight">₹{stats?.balance?.toLocaleString() || "0"}</p>
                      <p className="text-xs font-bold text-muted uppercase tracking-wider">Available Balance</p>
                  </div>
              </div>
              <div className="mt-8 -mx-6 -mb-6">
                 <CashFlowWave data={stats?.recentHistory || []} />
              </div>
          </div>

          {/* BURN RATE GAUGE */}
          <div className="md:col-span-4 glass-panel p-6 rounded-[32px] border-border bg-background flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Zap className="w-24 h-24" />
              </div>
              <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Runway Forecast</h3>
              <BurnGauge months={stats?.runwayMonths || 0} />
              <p className="mt-2 text-xs text-muted font-medium">Months remaining</p>
              
              <div className="mt-6 w-full grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div>
                      <p className="text-lg font-bold text-red-500">₹{Math.round(stats?.totalExpense || 0).toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-muted uppercase">Total Out</p>
                  </div>
                  <div>
                      <p className="text-lg font-bold text-blue-500">₹{Math.round(stats?.adSpend || 0).toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-muted uppercase">Ad Spend</p>
                  </div>
              </div>
          </div>
      </div>

      {/* SECONDARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-5 rounded-2xl border-border bg-background flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                  <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm font-bold text-muted uppercase tracking-wider">Total Income</p>
                  <p className="text-xl font-bold text-foreground">₹{stats?.totalIncome?.toLocaleString() || "0"}</p>
              </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border-border bg-background flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
                  <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm font-bold text-muted uppercase tracking-wider">Total Expenses</p>
                  <p className="text-xl font-bold text-foreground">₹{stats?.totalExpense?.toLocaleString() || "0"}</p>
              </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border-border bg-background flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <PieChart className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm font-bold text-muted uppercase tracking-wider">Net Profit</p>
                  <p className={`text-xl font-bold ${stats?.netProfit && stats.netProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                    ₹{stats?.netProfit?.toLocaleString() || "0"}
                  </p>
              </div>
          </div>
      </div>

      {/* TABS & LISTS */}
      <div className="space-y-6">
          <div className="flex items-center justify-between">
              <div className="flex bg-foreground/5 p-1 rounded-xl">
                  <button onClick={() => setActiveTab('ledger')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'ledger' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}>
                      General Ledger
                  </button>
                  <button onClick={() => setActiveTab('retainers')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'retainers' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}>
                      Client Retainers
                  </button>
                  <button onClick={() => setActiveTab('budgets')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'budgets' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}>
                      Budgets
                  </button>
              </div>
              
              <button onClick={downloadCSV} className="flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors px-3 py-2 hover:bg-foreground/5 rounded-lg">
                  <Download className="w-4 h-4" /> Export CSV
              </button>
          </div>

          {/* TAB 1: LEDGER */}
          {activeTab === 'ledger' && (
              <div className="glass-panel rounded-[32px] border-border bg-background overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-foreground/[0.02] border-b border-border">
                          <tr>
                              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-wider">Transaction</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-wider">Category</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-wider">Workspace</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-wider text-right">Amount</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-wider text-right">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                          {transactions?.length === 0 ? (
                              <tr><td colSpan={5} className="p-12 text-center text-muted italic">No transactions found. Click "New Transaction" to start.</td></tr>
                          ) : (
                              transactions?.map((t: any) => (
                                  <tr key={t._id} className="hover:bg-foreground/[0.02] group transition-colors">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                                  {t.type === 'income' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                              </div>
                                              <div>
                                                  <p className="font-bold text-sm text-foreground">{t.description}</p>
                                                  <p className="text-[10px] text-muted">Logged by {t.authorName}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className="px-2 py-1 rounded-md bg-foreground/5 text-xs font-medium border border-border">
                                              {t.category}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-xs font-medium text-muted">
                                          {t.workspaceName || "-"}
                                      </td>
                                      <td className={`px-6 py-4 text-right font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-foreground'}`}>
                                          {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button 
                                              onClick={() => deleteTx({ transactionId: t._id })}
                                              className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                          >
                                              <X className="w-4 h-4" />
                                          </button>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          )}

          {/* TAB 2: RETAINERS */}
          {activeTab === 'retainers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button 
                    onClick={() => setIsRetainerModalOpen(true)}
                    className="border-2 border-dashed border-border rounded-[32px] p-6 flex flex-col items-center justify-center gap-4 text-muted hover:text-accent hover:border-accent hover:bg-accent/[0.02] transition-all group min-h-[200px]"
                  >
                      <Plus className="w-8 h-8" />
                      <span className="text-xs font-bold uppercase tracking-wider">New Retainer</span>
                  </button>

                  {stats?.retainers?.map((r: any) => {
                      const percent = r.totalBudget > 0 ? Math.min((r.usedBudget / r.totalBudget) * 100, 100) : 0;
                      const isOver = r.usedBudget > r.totalBudget;
                      const statusColor = isOver ? 'bg-red-500' : percent > 80 ? 'bg-orange-500' : 'bg-green-500';

                      return (
                          <div key={r._id} className="glass-panel p-6 rounded-[32px] border-border bg-background relative overflow-hidden group flex flex-col justify-between">
                              <div>
                                  <div className="flex justify-between items-start mb-6">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border flex items-center justify-center font-bold text-sm">
                                              {r.clientName[0]}
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-foreground">{r.clientName}</h4>
                                              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Retainer</p>
                                          </div>
                                      </div>
                                      <button onClick={() => triggerInvoice(r.clientName, r.totalBudget)} className="p-2 bg-foreground/5 hover:bg-accent hover:text-white rounded-xl transition-all">
                                          <FileText className="w-4 h-4" />
                                      </button>
                                  </div>

                                  <div className="space-y-2 mb-4">
                                      <div className="flex justify-between text-xs font-medium">
                                          <span className={isOver ? "text-red-500 font-bold" : "text-muted"}>
                                              ₹{r.usedBudget.toLocaleString()} used
                                          </span>
                                          <span className="text-foreground font-bold">₹{r.totalBudget.toLocaleString()}</span>
                                      </div>
                                      <div className="h-2 w-full bg-foreground/10 rounded-full overflow-hidden">
                                          <div className={`h-full ${statusColor} transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }} />
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-4 border-t border-border">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${isOver ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                                      {isOver ? "Over Serviced" : "Healthy"}
                                  </span>
                                  <span className="text-[10px] text-muted">
                                      {new Date(r.lastUpdated).toLocaleDateString()}
                                  </span>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}

          {/* TAB 3: BUDGETS */}
          {activeTab === 'budgets' && (
              <div className="space-y-4">
                  <h3 className="text-lg font-bold px-1">Departmental Allocation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {budgets?.map((ws: any) => {
                          const hasBudget = ws.budget && ws.budget > 0;
                          const percent = hasBudget ? Math.min((ws.spent / ws.budget) * 100, 100) : 0;
                          const isOver = hasBudget && ws.spent > ws.budget;
                          const barColor = isOver ? "bg-red-500" : "bg-accent";

                          return (
                              <div key={ws._id} className="glass-panel p-5 rounded-2xl border-border bg-background flex items-center justify-between group">
                                  <div className="flex-1 mr-4">
                                      <div className="flex items-center gap-3 mb-3">
                                          {/* FIX: Render Icon Component */}
                                          {getWsIcon(ws.emoji)}
                                          <div>
                                              <p className="font-bold text-sm text-foreground">{ws.name}</p>
                                              <p className="text-[10px] text-muted uppercase tracking-wider">
                                                  {hasBudget ? `Budget: ₹${ws.budget.toLocaleString()}` : "No Budget Set"}
                                              </p>
                                          </div>
                                      </div>
                                      <div className="relative h-2 w-full bg-foreground/10 rounded-full overflow-hidden">
                                          {hasBudget && <div className={`absolute left-0 top-0 h-full ${barColor} transition-all duration-1000`} style={{ width: `${percent}%` }} />}
                                          {!hasBudget && <div className="absolute left-0 top-0 h-full bg-foreground/5 w-0" />}
                                      </div>
                                      <div className="flex justify-between mt-1 text-[10px] font-bold">
                                          <span className="text-muted">Spent: ₹{ws.spent.toLocaleString()}</span>
                                          <span className={isOver ? "text-red-500" : "text-accent"}>{Math.round(percent)}%</span>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={() => setIsBudgetEditModalOpen({isOpen: true, wsId: ws._id, currentBudget: ws.budget || 0})}
                                    className="p-2 rounded-xl bg-foreground/5 text-muted hover:text-foreground hover:bg-foreground/10 transition-all"
                                  >
                                      <Edit2 className="w-4 h-4" />
                                  </button>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}