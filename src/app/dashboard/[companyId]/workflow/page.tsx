"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { 
  Ticket, Hash, Loader2, ArrowRightLeft, X, Send, AlertCircle, ChevronRight, 
  User, RefreshCw, Check, Flag, Clock, MessageSquare, AlertTriangle, Plus,
  Layout, List, ChevronLeft, Trash2, GripVertical, Building, Calendar, Edit3, History,
  // IMPORT ICON SET
  Terminal, TrendingUp, BadgeDollarSign, Palette, Scale, Users, Settings2,
  LifeBuoy, Rocket, Database, Briefcase, Bug, ShieldCheck, Box, FolderKanban,
  Megaphone, Headphones, Globe, Cloud, Map, BarChart3, Layers
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

// --- ICON MAP REGISTRY ---
const WorkspaceIconMap: Record<string, any> = {
  Terminal, TrendingUp, BadgeDollarSign, Palette, Scale, Users, 
  Settings2, LifeBuoy, Rocket, Database, Briefcase, Bug, ShieldCheck, 
  Box, FolderKanban, Megaphone, Headphones, Globe, Cloud, Map, 
  BarChart3, Layers
};

interface AdminStats {
  isOverallAdmin: boolean;
  adminWorkspaceIds: string[];
}

export default function OperationalWorkflow() {
  const params = useParams();
  const companyId = params.companyId as any;
  const { user: clerkUser } = useUser();

  // View State
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list'); 
  const [selectedKanbanWs, setSelectedKanbanWs] = useState<string>("");

  // Data Queries
  const workspaces = useQuery(api.workspaces.getByCompany, { companyId });
  
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !selectedKanbanWs) {
        setSelectedKanbanWs(workspaces[0]._id);
    }
  }, [workspaces]);

  const tickets = useQuery(api.tickets.getAll, { companyId });
  const kanbanTasks = useQuery(api.kanban.getAll, { 
    companyId, 
    workspaceId: selectedKanbanWs ? selectedKanbanWs as any : undefined 
  });
  
  const adminStats = useQuery(api.workspaces.getMyAdminStats, { companyId }) as AdminStats | undefined;
  const members = useQuery(api.companies.getMembers, { companyId });

  // Ticket Mutations
  const createTicket = useMutation(api.tickets.create);
  const transferTicket = useMutation(api.tickets.transfer);
  const resolveTicket = useMutation(api.tickets.resolve);
  const reopenTicket = useMutation(api.tickets.reopen);
  const addTicketComment = useMutation(api.tickets.addComment);
  const updateTicketPriority = useMutation(api.tickets.updatePriority);
  const assignTicket = useMutation(api.tickets.assign);
  const setTicketDueDate = useMutation(api.tickets.setDueDate);

  // Kanban Mutations
  const createKanbanTask = useMutation(api.kanban.create);
  const updateKanbanStatus = useMutation(api.kanban.updateStatus);
  const updateKanbanDetails = useMutation(api.kanban.updateDetails);
  const deleteKanbanTask = useMutation(api.kanban.deleteTask);
  const addKanbanComment = useMutation(api.kanban.addComment);

  // Ticket UI State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [tab, setTab] = useState<'chat' | 'audit'>('chat');
  const [confirmAction, setConfirmAction] = useState<{type: 'resolve' | 'reopen' | 'transfer', targetId?: string} | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [targetWs, setTargetWs] = useState("");

  // Ticket Modal State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ 
    title: "", description: "", priority: "medium" as const, type: "task" as const, workspaceId: "" 
  });

  // Kanban Task Modal State (Creation)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: "", description: "", priority: "medium" as const, status: "backlog" as const, 
    assigneeId: "", dueDate: "" 
  });

  // Kanban Detail Drawer State (Editing)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [kanbanTab, setKanbanTab] = useState<'chat' | 'audit'>('chat');
  const [kanbanComment, setKanbanComment] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const kanbanScrollRef = useRef<HTMLDivElement>(null);
  
  // Derived Data (Ticket)
  const selectedTicket = tickets?.find((t: any) => t._id === selectedTicketId) || null;
  const ticketComments = useQuery(api.tickets.getComments, selectedTicketId ? { ticketId: selectedTicketId as any } : "skip");
  const ticketEvents = useQuery(api.tickets.getEvents, selectedTicketId ? { ticketId: selectedTicketId as any } : "skip");

  // Derived Data (Kanban)
  const selectedTask = kanbanTasks?.find((t: any) => t._id === selectedTaskId) || null;
  const kanbanComments = useQuery(api.kanban.getComments, selectedTaskId ? { taskId: selectedTaskId as any } : "skip");
  const kanbanEvents = useQuery(api.kanban.getEvents, selectedTaskId ? { taskId: selectedTaskId as any } : "skip");

  const hasEditRights = (wsId: string) => {
    if (!adminStats) return false;
    if (adminStats.isOverallAdmin) return true;
    return adminStats.adminWorkspaceIds.includes(wsId);
  };

  // Helper to render icon
  const getWsIcon = (iconName: string) => {
    const Icon = WorkspaceIconMap[iconName] || Layers;
    return <Icon className="w-5 h-5 text-foreground" />;
  };

  const handleTicketComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;
    try {
      await addTicketComment({ ticketId: selectedTicket._id, content: commentText });
      setCommentText("");
      if(tab === 'chat') setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { console.error(e); }
  };

  const handleKanbanComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kanbanComment.trim() || !selectedTask) return;
    try {
        await addKanbanComment({ taskId: selectedTask._id, content: kanbanComment });
        setKanbanComment("");
        if(kanbanTab === 'chat') setTimeout(() => kanbanScrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch(e) { console.error(e); }
  }

  const executeAction = async () => {
    if (!confirmAction || !selectedTicket) return;
    try {
      if (confirmAction.type === 'resolve') await resolveTicket({ ticketId: selectedTicket._id });
      if (confirmAction.type === 'reopen') await reopenTicket({ ticketId: selectedTicket._id });
      if (confirmAction.type === 'transfer' && targetWs) {
        await transferTicket({ ticketId: selectedTicket._id, targetWorkspaceId: targetWs as any });
        setIsTransferring(false);
        setTargetWs("");
      }
      setConfirmAction(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.workspaceId) return;
    try {
      await createTicket({ 
        companyId, 
        workspaceId: newTicket.workspaceId as any,
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        type: newTicket.type
      });
      setIsTicketModalOpen(false);
      setNewTicket({ title: "", description: "", priority: "medium", type: "task", workspaceId: "" });
    } catch(e: any) { alert("Failed: " + e.message); }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !selectedKanbanWs) return;
    await createKanbanTask({ 
        companyId, 
        workspaceId: selectedKanbanWs as any,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: newTask.status,
        assigneeId: newTask.assigneeId ? newTask.assigneeId as any : undefined,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).getTime() : undefined
    });
    setIsTaskModalOpen(false);
    setNewTask({ title: "", description: "", priority: "medium", status: "backlog", assigneeId: "", dueDate: "" });
  };

  const moveTask = (taskId: any, currentStatus: string, direction: 'next' | 'prev') => {
    const statuses = ['backlog', 'todo', 'in_progress', 'done'];
    const idx = statuses.indexOf(currentStatus);
    if (idx === -1) return;
    const newIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (newIdx >= 0 && newIdx < statuses.length) {
        updateKanbanStatus({ taskId, status: statuses[newIdx] as any });
    }
  };

  if (!tickets || !workspaces || !adminStats || !kanbanTasks) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
      <p className="text-muted text-sm font-medium animate-pulse">Synchronizing Global Workflow...</p>
    </div>
  );

  const KanbanColumn = ({ status, label }: { status: string, label: string }) => {
    const tasks = kanbanTasks.filter(t => t.status === status);
    
    return (
      <div className="flex-1 min-w-[280px] md:min-w-[300px] flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status === 'done' ? 'bg-green-500' : status === 'in_progress' ? 'bg-blue-500' : 'bg-orange-500'}`} />
            {label} ({tasks.length})
          </h3>
          <button onClick={() => { setNewTask({ ...newTask, status: status as any }); setIsTaskModalOpen(true); }} className="p-1 hover:bg-foreground/5 rounded text-muted hover:text-foreground">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 bg-foreground/[0.02] rounded-2xl p-2 space-y-3 min-h-[500px] border border-border/50">
          {tasks.map(task => (
            <div 
                key={task._id} 
                className="p-4 rounded-xl bg-background border border-border shadow-sm group hover:border-accent/50 transition-all cursor-pointer"
                onClick={() => setSelectedTaskId(task._id)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  task.priority === 'high' ? 'bg-red-500/10 text-red-500' : task.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'
                }`}>
                  {task.priority}
                </span>
                <button 
                    onClick={(e) => { e.stopPropagation(); deleteKanbanTask({ taskId: task._id }); }} 
                    className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-opacity"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <h4 className="text-sm font-bold text-foreground mb-3 leading-snug">{task.title}</h4>
              
              <div className="flex items-center justify-between border-t border-border pt-3">
                 <button onClick={(e) => { e.stopPropagation(); moveTask(task._id, task.status, 'prev'); }} disabled={task.status === 'backlog'} className="p-1.5 rounded hover:bg-foreground/5 disabled:opacity-30"><ChevronLeft className="w-4 h-4 text-muted" /></button>
                 {task.assignee ? <div className="w-4 h-4 bg-accent/10 rounded-full flex items-center justify-center text-[8px] font-bold text-accent">{task.assignee.name?.[0]}</div> : <User className="w-3 h-3 text-muted/30" />}
                 <button onClick={(e) => { e.stopPropagation(); moveTask(task._id, task.status, 'next'); }} disabled={task.status === 'done'} className="p-1.5 rounded hover:bg-foreground/5 disabled:opacity-30"><ChevronRight className="w-4 h-4 text-muted" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-700 font-sans h-full">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-wider mb-2">
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Command Center
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Operational Workflow</h1>
          <p className="text-muted text-lg font-normal">Manage departmental tickets and internal tasks.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          {viewMode === 'board' && (
              <div className="relative w-full md:w-48">
                 <select 
                    className="w-full bg-background text-foreground border border-border rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer appearance-none hover:border-accent/50 focus:border-accent outline-none"
                    value={selectedKanbanWs}
                    onChange={(e) => setSelectedKanbanWs(e.target.value)}
                 >
                    {workspaces.map(ws => (
                        <option key={ws._id} value={ws._id} className="bg-background text-foreground">{ws.name}</option>
                    ))}
                 </select>
                 <Building className="absolute right-3 top-2.5 w-4 h-4 text-muted pointer-events-none" />
              </div>
          )}

          <div className="flex bg-foreground/5 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex-1 md:flex-none justify-center px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              <List className="w-4 h-4" /> Stream
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`flex-1 md:flex-none justify-center px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'board' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              <Layout className="w-4 h-4" /> Board
            </button>
          </div>

          <button 
            onClick={() => viewMode === 'list' ? setIsTicketModalOpen(true) : setIsTaskModalOpen(true)}
            className="apple-button shadow-lg shadow-accent/20 w-full md:w-auto justify-center"
          >
            <Plus className="w-5 h-5" /> 
            {viewMode === 'list' ? 'Ticket' : 'Task'}
          </button>
        </div>
      </header>

      {/* VIEW CONTENT */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 mb-2">
             <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Active Tickets ({tickets.length})</h3>
          </div>
          {tickets.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl">
              <p className="text-muted text-sm font-medium">No active tickets in the system.</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div 
                key={ticket._id}
                onClick={() => setSelectedTicketId(ticket._id)}
                className="glass-panel p-4 md:p-6 rounded-2xl border border-border hover:border-accent/50 hover:bg-accent/[0.02] transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start md:items-center gap-4 md:gap-6">
                  {/* FIX: Render Icon Component */}
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-foreground/5 border border-border shrink-0`}>
                    {getWsIcon(ticket.workspace?.emoji || "Layers")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground tracking-tight text-sm md:text-base line-clamp-1">{ticket.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted">{ticket.workspace?.name}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        ticket.priority === 'high' ? 'text-red-500' : ticket.priority === 'medium' ? 'text-orange-500' : 'text-green-500'
                      }`}>{ticket.priority}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border/50">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-bold">
                        {ticket.assignee?.name?.[0] || "?"}
                     </div>
                     <span className="text-xs font-medium md:hidden">{ticket.assignee?.name || "Unassigned"}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        ticket.status === 'open' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-green-500/10 text-green-600 border-green-500/20'
                    }`}>
                        {ticket.status}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent hidden md:block" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x snap-mandatory">
          <div className="snap-center"><KanbanColumn status="backlog" label="Backlog" /></div>
          <div className="snap-center"><KanbanColumn status="todo" label="Todo" /></div>
          <div className="snap-center"><KanbanColumn status="in_progress" label="In Progress" /></div>
          <div className="snap-center"><KanbanColumn status="done" label="Done" /></div>
        </div>
      )}

      {/* 3. CREATE TICKET MODAL */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="glass-panel max-w-lg w-full p-8 rounded-[40px] shadow-2xl border-border bg-background relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsTicketModalOpen(false)} className="absolute top-6 right-6 p-2 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors">
               <X className="w-4 h-4 text-foreground" />
            </button>
            <div className="mb-8"><h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Create Ticket</h2><p className="text-muted text-sm font-normal">Define the requirements for this operation.</p></div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Target Workspace</label>
                <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-muted" />
                    <select 
                        className="input-field pl-10 bg-background text-foreground" 
                        value={newTicket.workspaceId} 
                        onChange={(e) => setNewTicket({...newTicket, workspaceId: e.target.value})}
                    >
                        <option value="" className="bg-background text-foreground">Select Department...</option>
                        {workspaces?.map(ws => (
                            <option key={ws._id} value={ws._id} className="bg-background text-foreground">{ws.name}</option>
                        ))}
                    </select>
                </div>
              </div>
              <div className="space-y-2"><label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Title</label><input placeholder="E.g. Update Security Protocol" className="input-field" value={newTicket.title} onChange={(e) => setNewTicket({...newTicket, title: e.target.value})} autoFocus /></div>
              <div className="space-y-2"><label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Type</label><div className="flex gap-2">{['task', 'bug', 'feature'].map((t) => (<button key={t} onClick={() => setNewTicket({...newTicket, type: t as any})} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${newTicket.type === t ? 'bg-accent text-white border-accent' : 'bg-background text-muted border-border hover:border-accent/50'}`}>{t}</button>))}</div></div>
              <div className="space-y-2"><label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Description</label><textarea placeholder="Detailed requirements..." className="input-field h-32 resize-none leading-relaxed" value={newTicket.description} onChange={(e) => setNewTicket({...newTicket, description: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Priority Level</label><div className="flex gap-2">{['low', 'medium', 'high'].map((p) => (<button key={p} onClick={() => setNewTicket({...newTicket, priority: p as any})} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${newTicket.priority === p ? 'bg-accent text-white border-accent' : 'bg-background text-muted border-border hover:border-accent/50'}`}>{p}</button>))}</div></div>
              <div className="pt-4"><button onClick={handleCreateTicket} className="apple-button w-full shadow-lg shadow-accent/20">Create Ticket</button></div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CREATE TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-200">
             <div className="glass-panel max-w-md w-full p-8 rounded-[40px] shadow-2xl border-border bg-background relative animate-in zoom-in-95 duration-200">
                <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-6 right-6 p-2 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors">
                    <X className="w-4 h-4 text-foreground" />
                </button>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">New Task</h2>
                    <p className="text-muted text-sm font-normal">Add a card to the Kanban board.</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Title</label>
                        <input 
                            className="input-field mt-1" 
                            placeholder="e.g. Design Homepage"
                            value={newTask.title} 
                            onChange={(e) => setNewTask({...newTask, title: e.target.value})} 
                            autoFocus 
                        />
                    </div>
                    <div>
                         <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Assignee</label>
                         <select 
                            className="input-field mt-1 text-xs bg-background text-foreground"
                            value={newTask.assigneeId} 
                            onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
                         >
                            <option value="">Unassigned</option>
                            {members?.map((m: any) => (<option key={m.user._id} value={m.user._id}>{m.user.name}</option>))}
                         </select>
                    </div>
                    <div>
                         <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Priority</label>
                         <select 
                            className="input-field mt-1 text-xs bg-background text-foreground" 
                            value={newTask.priority} 
                            onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                         >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                         </select>
                    </div>

                    <button onClick={handleCreateTask} className="apple-button w-full justify-center mt-2">Create Task</button>
                </div>
            </div>
        </div>
      )}

      {/* TICKET DRAWER */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end bg-black/40 backdrop-blur-md p-0 md:p-4 transition-all">
          <div className="glass-panel w-full max-w-5xl h-full md:rounded-[32px] shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col border-border bg-background">
             
             {/* Confirm Action Modal */}
            {confirmAction && (
              <div className="absolute inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-background border border-border p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
                  <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-center text-lg font-bold text-foreground mb-2">Confirm Critical Action</h3>
                  <p className="text-center text-sm text-muted mb-6">
                    Are you sure you want to <strong>{confirmAction.type}</strong> this ticket? This action will be logged.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 rounded-xl border border-border text-xs font-bold uppercase hover:bg-foreground/5">Cancel</button>
                    <button onClick={executeAction} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold uppercase shadow-lg shadow-red-500/20 hover:bg-red-600">Confirm</button>
                  </div>
                </div>
              </div>
            )}

            <header className="px-6 md:px-8 py-5 border-b border-border bg-background/50 backdrop-blur-xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent border border-accent/20 shrink-0">
                  <Hash className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted hidden md:inline">ID: {selectedTicket._id.substring(0,8)}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${selectedTicket.status === 'open' ? 'bg-accent/10 text-accent' : 'bg-green-500/10 text-green-600'}`}>{selectedTicket.status}</span>
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-foreground truncate w-full tracking-tight leading-tight">{selectedTicket.title}</h2>
                </div>
              </div>
              <button onClick={() => setSelectedTicketId(null)} className="p-2 hover:bg-foreground/5 rounded-full text-muted hover:text-foreground shrink-0">
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
              <div className="flex-1 flex flex-col border-r border-border min-w-0 h-full overflow-hidden">
                <div className="flex items-center border-b border-border px-4 md:px-8 shrink-0 overflow-x-auto">
                  <button onClick={() => setTab('chat')} className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all whitespace-nowrap ${tab === 'chat' ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}>Discussion</button>
                  <button onClick={() => setTab('audit')} className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all whitespace-nowrap ${tab === 'audit' ? 'border-accent text-foreground' : 'border-transparent text-muted'}`}>Audit Log</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
                  {tab === 'chat' && (
                    <div className="space-y-6">
                      <div className="p-4 md:p-6 bg-foreground/[0.02] rounded-2xl border border-border">
                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                      </div>
                      <div className="space-y-2 flex flex-col pb-4">
                        {ticketComments?.map((c) => {
                          const isMe = c.author?.clerkId === clerkUser?.id;
                          return (
                            <div key={c._id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-xs font-bold text-muted shrink-0">
                                {c.author?.name?.[0]}
                              </div>
                              <div className={`max-w-[85%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed border ${
                                  isMe ? "bg-accent text-white border-accent/50 rounded-tr-sm" : "bg-white dark:bg-white/5 text-foreground border-border rounded-tl-sm"
                                }`}>
                                  {c.content}
                                </div>
                                <span className="text-[9px] text-muted opacity-60">{new Date(c._creationTime).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})} • {c.author?.name}</span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={scrollRef} />
                      </div>
                    </div>
                  )}
                  
                  {tab === 'audit' && (
                    <div className="space-y-4">
                      {ticketEvents?.map((e, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-xl bg-foreground/[0.02] border border-border">
                          <div className="mt-1">
                            {e.type === 'created' && <Plus className="w-4 h-4 text-blue-500" />}
                            {e.type === 'status_change' && <Check className="w-4 h-4 text-green-500" />}
                            {e.type.includes('update') && <RefreshCw className="w-4 h-4 text-muted" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{e.metadata}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted">{e.actor?.name}</span>
                              <span className="text-[10px] text-muted opacity-50">{new Date(e._creationTime).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {tab === 'chat' && (
                  <form onSubmit={handleTicketComment} className="p-4 border-t border-border bg-background/50 backdrop-blur-md shrink-0">
                    <div className="flex gap-2">
                      <input placeholder="Transmit update..." className="input-field py-2.5 text-sm" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                      <button type="submit" className="p-3 bg-accent hover:bg-accent/90 text-white rounded-xl shadow-lg shadow-accent/20"><Send className="w-4 h-4" /></button>
                    </div>
                  </form>
                )}
              </div>

              {/* SIDEBAR META */}
              <div className="w-80 bg-background/50 backdrop-blur-xl p-6 space-y-8 overflow-y-auto custom-scrollbar border-l border-border hidden lg:block">
                <div className={`space-y-8 ${!hasEditRights(selectedTicket.workspaceId) ? "opacity-50 pointer-events-none grayscale" : ""}`}>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><Flag className="w-3.5 h-3.5" /> Priority</h3>
                    <div className="flex bg-foreground/5 p-1 rounded-xl">
                      {['low', 'medium', 'high'].map((p) => (
                        <button key={p} onClick={() => updateTicketPriority({ ticketId: selectedTicket._id, priority: p as any })} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${selectedTicket.priority === p ? 'bg-white shadow-sm text-foreground' : 'text-muted'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><User className="w-3.5 h-3.5" /> Assignee</h3>
                    <select className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground" value={selectedTicket.assigneeId || ""} onChange={(e) => assignTicket({ ticketId: selectedTicket._id, assigneeId: e.target.value === "" ? undefined : e.target.value as any })}>
                      <option value="" className="bg-background text-foreground">Unassigned</option>
                      {members?.map((m: any) => (<option key={m.user._id} value={m.user._id} className="bg-background text-foreground">{m.user.name}</option>))}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Target Date</h3>
                    <input type="date" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground" value={selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toISOString().split('T')[0] : ""} onChange={(e) => setTicketDueDate({ ticketId: selectedTicket._id, dueDate: e.target.value ? new Date(e.target.value).getTime() : undefined })} />
                  </div>
                </div>
                <div className="pt-6 border-t border-border space-y-3">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> Controls</h3>
                  {!hasEditRights(selectedTicket.workspaceId) && <p className="text-xs text-red-500 font-medium bg-red-500/10 p-2 rounded-lg">Read Only Access</p>}
                  {hasEditRights(selectedTicket.workspaceId) && (
                    <>
                      {selectedTicket.status === 'open' ? (
                        <button onClick={() => setConfirmAction({type: 'resolve'})} className="w-full py-2 bg-green-500/10 text-green-600 border border-green-500/20 rounded-xl text-xs font-bold uppercase hover:bg-green-500 hover:text-white transition-all">Mark Resolved</button>
                      ) : (
                        <button onClick={() => setConfirmAction({type: 'reopen'})} className="w-full py-2 bg-foreground/5 text-foreground border border-border rounded-xl text-xs font-bold uppercase hover:bg-foreground/10 transition-all flex items-center justify-center gap-2"><RefreshCw className="w-3 h-3" /> Reopen</button>
                      )}
                      {!isTransferring ? (
                        <button onClick={() => setIsTransferring(true)} className="w-full py-2 bg-background border border-border text-muted rounded-xl text-xs font-bold uppercase hover:border-accent hover:text-accent transition-all">Transfer Node</button>
                      ) : (
                        <div className="space-y-2 animate-in fade-in">
                          <select className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-xs text-foreground" onChange={(e) => setTargetWs(e.target.value)}>
                            <option value="" className="bg-background text-foreground">Select Department...</option>
                            {workspaces?.filter(ws => ws._id !== selectedTicket.workspaceId).map(ws => (
                              <option key={ws._id} value={ws._id} className="bg-background text-foreground">{ws.name}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button onClick={() => setIsTransferring(false)} className="flex-1 py-1 bg-foreground/5 rounded-lg text-[10px] font-bold uppercase">Cancel</button>
                            <button onClick={() => setConfirmAction({type: 'transfer', targetId: targetWs})} disabled={!targetWs} className="flex-1 py-1 bg-accent text-white rounded-lg text-[10px] font-bold uppercase">Confirm</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KANBAN TASK DRAWER */}
      {selectedTask && (
          <div className="fixed inset-0 z-[150] flex items-center justify-end bg-black/40 backdrop-blur-md p-0 md:p-4 transition-all">
              <div className="glass-panel w-full max-w-2xl h-full md:rounded-[32px] shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col border-border bg-background">
                  <header className="px-6 py-5 border-b border-border bg-background/50 backdrop-blur-xl flex items-center justify-between shrink-0">
                      <h2 className="text-xl font-bold">{selectedTask.title}</h2>
                      <button onClick={() => setSelectedTaskId(null)} className="p-2 hover:bg-foreground/5 rounded-full"><X className="w-5 h-5" /></button>
                  </header>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                       {/* Task Meta */}
                       <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="p-4 bg-foreground/5 rounded-2xl">
                               <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Status</p>
                               <select 
                                  className="w-full bg-transparent font-bold text-sm outline-none"
                                  value={selectedTask.status}
                                  onChange={(e) => updateKanbanStatus({ taskId: selectedTask._id, status: e.target.value as any })}
                               >
                                   <option value="backlog">Backlog</option>
                                   <option value="todo">To Do</option>
                                   <option value="in_progress">In Progress</option>
                                   <option value="done">Done</option>
                               </select>
                           </div>
                           <div className="p-4 bg-foreground/5 rounded-2xl">
                               <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Priority</p>
                               <span className={`text-sm font-bold uppercase ${selectedTask.priority === 'high' ? 'text-red-500' : 'text-blue-500'}`}>{selectedTask.priority}</span>
                           </div>
                       </div>
                       
                       <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Description</h3>
                       <p className="text-sm leading-relaxed mb-8">{selectedTask.description || "No description provided."}</p>

                       <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Activity</h3>
                       <div className="space-y-4 mb-20">
                           {kanbanComments?.map((c) => (
                               <div key={c._id} className="flex gap-3">
                                   <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                                       {c.author?.name?.[0]}
                                   </div>
                                   <div className="bg-foreground/5 p-3 rounded-xl rounded-tl-none">
                                       <p className="text-xs font-bold mb-1">{c.author?.name}</p>
                                       <p className="text-sm">{c.content}</p>
                                   </div>
                               </div>
                           ))}
                           <div ref={kanbanScrollRef} />
                       </div>
                  </div>

                  <form onSubmit={handleKanbanComment} className="p-4 border-t border-border bg-background/50 backdrop-blur-md shrink-0">
                      <div className="flex gap-2">
                          <input 
                            placeholder="Add comment..." 
                            className="input-field py-2.5 text-sm" 
                            value={kanbanComment} 
                            onChange={(e) => setKanbanComment(e.target.value)} 
                          />
                          <button type="submit" className="p-3 bg-accent hover:bg-accent/90 text-white rounded-xl shadow-lg shadow-accent/20">
                              <Send className="w-4 h-4" />
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}