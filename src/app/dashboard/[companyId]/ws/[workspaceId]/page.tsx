"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { 
  Ticket, Plus, Hash, UploadCloud, File as FileIcon, Download, 
  Loader2, ArrowRightLeft, X, Send, AlertCircle, ChevronRight, 
  User, RefreshCw, BarChart3, Check, Calendar, Flag, Clock, History, MessageSquare, AlertTriangle,
  Layout, List, MessageCircle, Paperclip, Smile
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as any;
  const companyId = params.companyId as any;
  const { user: clerkUser } = useUser();

  // Data
  const tickets = useQuery(api.tickets.getByWorkspace, { workspaceId });
  const assets = useQuery(api.files.getByWorkspace, { workspaceId });
  const workspaces = useQuery(api.workspaces.getByCompany, { companyId });
  const members = useQuery(api.workspaces.getMembers, { workspaceId });
  const myPermissions = useQuery(api.workspaces.getMyself, { workspaceId });
  const chatMessages = useQuery(api.chat.getMessages, { companyId, workspaceId }); // Workspace Chat
  
  // Mutations
  const createTicket = useMutation(api.tickets.create);
  const transferTicket = useMutation(api.tickets.transfer);
  const resolveTicket = useMutation(api.tickets.resolve);
  const reopenTicket = useMutation(api.tickets.reopen);
  const addComment = useMutation(api.tickets.addComment);
  const updatePriority = useMutation(api.tickets.updatePriority);
  const assignTicket = useMutation(api.tickets.assign);
  const setDueDate = useMutation(api.tickets.setDueDate);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const sendFile = useMutation(api.files.sendFile);
  const sendChatMessage = useMutation(api.chat.send); // Chat Mutation

  // UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'board' | 'chat' | 'assets'>('overview');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<'chat' | 'audit'>('chat');
  
  // FIX: Added targetId as optional string to type definition
  const [confirmAction, setConfirmAction] = useState<{type: 'resolve' | 'reopen' | 'transfer', targetId?: string} | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [newTicket, setNewTicket] = useState({ title: "", description: "", priority: "medium" as const, type: "task" as const });
  const [isTransferring, setIsTransferring] = useState(false);
  const [targetWs, setTargetWs] = useState("");
  
  // Chat State
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedTicket = tickets?.find((t: any) => t._id === selectedTicketId) || null;
  const comments = useQuery(api.tickets.getComments, selectedTicketId ? { ticketId: selectedTicketId as any } : "skip");
  const events = useQuery(api.tickets.getEvents, selectedTicketId ? { ticketId: selectedTicketId as any } : "skip");

  const hasAdminRights = myPermissions?.isOverallAdmin || myPermissions?.workspaceRole === "admin";

  const handleTicketCreate = async () => {
    if (!newTicket.title.trim()) return;
    await createTicket({ companyId, workspaceId, ...newTicket });
    setIsModalOpen(false);
    setNewTicket({ title: "", description: "", priority: "medium", type: "task" });
  };

  const executeAction = async () => {
    if (!confirmAction || !selectedTicket) return;
    try {
      if (confirmAction.type === 'resolve') await resolveTicket({ ticketId: selectedTicket._id });
      if (confirmAction.type === 'reopen') await reopenTicket({ ticketId: selectedTicket._id });
      if (confirmAction.type === 'transfer' && confirmAction.targetId) {
        await transferTicket({ ticketId: selectedTicket._id, targetWorkspaceId: confirmAction.targetId as any });
        setIsTransferring(false);
        setTargetWs("");
      }
      setConfirmAction(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;
    try {
      await addComment({ ticketId: selectedTicket._id, content: commentText });
      setCommentText("");
      if(drawerTab === 'chat') setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { console.error(e); }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!chatInput.trim()) return;
    try {
        await sendChatMessage({ companyId, workspaceId, content: chatInput });
        setChatInput("");
        setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch(e) { console.error(e); }
  }

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await result.json();
      await sendFile({ storageId, workspaceId, fileName: file.name, fileType: file.type });
    } catch (error) { console.error(error); } finally { setIsUploading(false); }
  };

  if (!tickets || !workspaces || myPermissions === undefined || !members) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  );

  const highPriority = tickets.filter(t => t.priority === 'high' && t.status === 'open').length;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  const KanbanColumn = ({ status, label }: { status: string, label: string }) => {
    const columnTickets = tickets.filter(t => t.status === status);
    return (
      <div className="flex-1 min-w-[300px] flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status === 'open' ? 'bg-blue-500' : status === 'resolved' ? 'bg-green-500' : 'bg-orange-500'}`} />
            {label} ({columnTickets.length})
          </h3>
        </div>
        <div className="flex-1 bg-foreground/[0.02] rounded-2xl p-2 space-y-3 min-h-[500px] border border-border/50">
          {columnTickets.map(ticket => (
            <div 
              key={ticket._id}
              onClick={() => setSelectedTicketId(ticket._id)}
              className="p-4 rounded-xl bg-background border border-border hover:border-accent/50 cursor-pointer shadow-sm group transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  ticket.priority === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {ticket.priority}
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground mb-2 line-clamp-2">{ticket.title}</h4>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <div className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center text-[9px] font-bold">
                    {ticket.assignee?.name?.[0] || "?"}
                </div>
                <span className="text-[10px] text-muted">{new Date(ticket._creationTime).toLocaleDateString()}</span>
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
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Active Node
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Workspace Hub</h1>
          <p className="text-muted text-lg font-normal">Manage departmental flows and assets.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex bg-foreground/5 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}>Overview</button>
                <button onClick={() => setActiveTab('board')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'board' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}>Board</button>
                <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'chat' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}>Chat</button>
                <button onClick={() => setActiveTab('assets')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'assets' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}>Assets</button>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="apple-button shadow-lg shadow-accent/20 w-full md:w-auto justify-center">
            <Plus className="w-5 h-5" /> New Ticket
            </button>
        </div>
      </header>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in">
            {/* MATRIX */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-6 rounded-3xl flex items-center gap-4 border-border">
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600"><AlertCircle className="w-6 h-6" /></div>
                    <div><p className="text-2xl font-bold text-foreground">{highPriority}</p><p className="text-xs font-bold text-muted uppercase tracking-wider">Critical Load</p></div>
                </div>
                <div className="glass-panel p-6 rounded-3xl flex items-center gap-4 border-border">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600"><BarChart3 className="w-6 h-6" /></div>
                    <div><p className="text-2xl font-bold text-foreground">{openCount}</p><p className="text-xs font-bold text-muted uppercase tracking-wider">Active Flows</p></div>
                </div>
                <div className="glass-panel p-6 rounded-3xl flex items-center gap-4 border-border">
                    <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600"><Check className="w-6 h-6" /></div>
                    <div><p className="text-2xl font-bold text-foreground">{resolvedCount}</p><p className="text-xs font-bold text-muted uppercase tracking-wider">Resolved</p></div>
                </div>
            </section>

            {/* LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets.map((ticket) => (
                <div 
                    key={ticket._id} 
                    onClick={() => setSelectedTicketId(ticket._id)}
                    className="glass-panel p-6 rounded-3xl border border-border hover:border-accent/50 hover:bg-accent/[0.02] transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-xl"
                >
                    <div className="flex items-center justify-between mb-6">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        ticket.priority === "high" ? "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900" : 
                        ticket.priority === "medium" ? "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900" :
                        "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900"
                    }`}>
                        {ticket.priority}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-2 truncate tracking-tight">{ticket.title}</h3>
                    <p className="text-muted text-sm font-normal line-clamp-2 mb-6 leading-relaxed">{ticket.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-muted text-[10px] font-bold uppercase tracking-wider">
                        <User className="w-3 h-3" /> {ticket.assignee ? ticket.assignee.name.split(' ')[0] : 'Unassigned'}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        ticket.status === 'resolved' ? 'text-green-600' : 'text-accent'
                    }`}>
                        {ticket.status}
                    </span>
                    </div>
                </div>
                ))}
            </div>
        </div>
      )}

      {/* BOARD TAB (Kanban) */}
      {activeTab === 'board' && (
        <div className="flex gap-6 overflow-x-auto pb-6 animate-in fade-in">
            <KanbanColumn status="open" label="Backlog" />
            <KanbanColumn status="in_progress" label="In Progress" />
            <KanbanColumn status="resolved" label="Done" />
        </div>
      )}

      {/* CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="h-[600px] flex flex-col glass-panel rounded-[32px] overflow-hidden border border-border animate-in fade-in">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col-reverse bg-background/50">
                <div ref={chatScrollRef} />
                {chatMessages?.map((msg, idx) => {
                    const isMe = msg.user?.clerkId === clerkUser?.id;
                    return (
                        <div key={msg._id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-xs font-bold shrink-0">{msg.user?.name?.[0]}</div>
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm font-medium ${isMe ? "bg-accent text-white" : "bg-white dark:bg-white/10"}`}>
                                {msg.content}
                            </div>
                        </div>
                    )
                })}
            </div>
            <form onSubmit={handleSendChat} className="p-4 bg-background border-t border-border flex gap-2">
                <input 
                    className="flex-1 input-field" 
                    placeholder="Message workspace..." 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                />
                <button type="submit" className="p-3 bg-accent text-white rounded-xl shadow-lg hover:scale-105 transition-transform"><Send className="w-4 h-4" /></button>
            </form>
        </div>
      )}

      {/* ASSETS TAB */}
      {activeTab === 'assets' && (
        <div className="space-y-8 animate-in fade-in">
            <label className="relative glass-panel rounded-3xl border-2 border-dashed border-border p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-accent hover:bg-accent/[0.02] transition-all group">
            <input type="file" className="hidden" onChange={onFileUpload} disabled={isUploading} />
            <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center shadow-sm border border-border group-hover:scale-105 transition-transform">
                {isUploading ? <Loader2 className="w-6 h-6 text-accent animate-spin" /> : <UploadCloud className="w-6 h-6 text-accent" />}
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Upload Asset</p>
                <p className="text-xs text-muted font-medium mt-1">Drag & drop or click to browse</p>
            </div>
            </label>

            <div className="space-y-4">
            {assets?.map((asset) => (
                <div key={asset._id} className="flex items-center gap-4 p-4 glass-panel rounded-2xl border border-border hover:bg-foreground/5 transition-all group">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                    <FileIcon className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{asset.fileName}</p>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5">{asset.fileType.split('/')[1]}</p>
                </div>
                <a href={asset.url || "#"} target="_blank" className="p-2 text-muted hover:text-accent transition-colors rounded-lg hover:bg-accent/10">
                    <Download className="w-4 h-4" />
                </a>
                </div>
            ))}
            </div>
        </div>
      )}

      {/* TICKET DRAWER & CONFIRM MODALS (Reused from original) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end bg-black/40 backdrop-blur-md p-4 transition-all">
          <div className="glass-panel w-full max-w-4xl h-full rounded-[32px] shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col border-border bg-background">
            
            {confirmAction && (
              <div className="absolute inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-background border border-border p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
                  <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-center text-lg font-bold text-foreground mb-2">Confirm Action</h3>
                  <p className="text-center text-sm text-muted mb-6">Are you sure you want to <strong>{confirmAction.type}</strong> this ticket?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 rounded-xl border border-border text-xs font-bold uppercase hover:bg-foreground/5">Cancel</button>
                    <button onClick={executeAction} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold uppercase shadow-lg shadow-red-500/20 hover:bg-red-600">Confirm</button>
                  </div>
                </div>
              </div>
            )}

            <header className="px-8 py-5 border-b border-border bg-background/50 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent border border-accent/20">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">ID: {selectedTicket._id.substring(0,8)}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${selectedTicket.status === 'open' ? 'bg-accent/10 text-accent' : 'bg-green-500/10 text-green-600'}`}>{selectedTicket.status}</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground truncate w-96 tracking-tight">{selectedTicket.title}</h2>
                </div>
              </div>
              <button onClick={() => setSelectedTicketId(null)} className="p-2 hover:bg-foreground/5 rounded-full text-muted hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col border-r border-border min-w-0">
                <div className="flex items-center border-b border-border px-8">
                  <button onClick={() => setDrawerTab('chat')} className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all ${drawerTab === 'chat' ? 'border-accent text-foreground' : 'border-transparent text-muted'}`}>Discussion</button>
                  <button onClick={() => setDrawerTab('audit')} className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all ${drawerTab === 'audit' ? 'border-accent text-foreground' : 'border-transparent text-muted'}`}>Audit Log</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {drawerTab === 'chat' ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-foreground/[0.02] rounded-2xl border border-border">
                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                      </div>
                      <div className="space-y-2 flex flex-col">
                        {comments?.map((c) => (
                          <div key={c._id} className={`flex gap-3 ${c.author?.clerkId === clerkUser?.id ? "flex-row-reverse" : "flex-row"}`}>
                            <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-xs font-bold text-muted shrink-0">{c.author?.name?.[0]}</div>
                            <div className={`max-w-[80%] ${c.author?.clerkId === clerkUser?.id ? "items-end" : "items-start"} flex flex-col`}>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed border ${c.author?.clerkId === clerkUser?.id ? "bg-accent text-white border-accent/50 rounded-tr-sm" : "bg-white dark:bg-white/5 text-foreground border-border rounded-tl-sm"}`}>{c.content}</div>
                            </div>
                          </div>
                        ))}
                        <div ref={scrollRef} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events?.map((e, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-xl bg-foreground/[0.02] border border-border">
                          <div className="mt-1">
                            {e.type === 'created' && <Plus className="w-4 h-4 text-blue-500" />}
                            {e.type.includes('update') && <RefreshCw className="w-4 h-4 text-muted" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{e.metadata}</p>
                            <span className="text-[10px] text-muted opacity-50">{new Date(e._creationTime).toLocaleString()} • {e.actor?.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {drawerTab === 'chat' && (
                  <form onSubmit={handleComment} className="p-4 border-t border-border bg-background/50 backdrop-blur-md">
                    <div className="flex gap-2">
                      <input placeholder="Transmit update..." className="input-field py-2.5 text-sm" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                      <button type="submit" className="p-3 bg-accent hover:bg-accent/90 text-white rounded-xl shadow-lg shadow-accent/20"><Send className="w-4 h-4" /></button>
                    </div>
                  </form>
                )}
              </div>

              {/* SIDEBAR META */}
              <div className={`w-80 bg-background/50 backdrop-blur-xl p-6 space-y-8 overflow-y-auto custom-scrollbar ${!hasAdminRights && "opacity-60 pointer-events-none grayscale"} hidden lg:block`}>
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><Flag className="w-3.5 h-3.5" /> Classification</h3>
                  <div className="flex bg-foreground/5 p-1 rounded-xl">
                    {['low', 'medium', 'high'].map((p) => (
                      <button key={p} onClick={() => updatePriority({ ticketId: selectedTicket._id, priority: p as any })} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${selectedTicket.priority === p ? 'bg-white shadow-sm text-foreground' : 'text-muted'}`}>{p}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><User className="w-3.5 h-3.5" /> Assignment</h3>
                  <select className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" value={selectedTicket.assigneeId || ""} onChange={(e) => assignTicket({ ticketId: selectedTicket._id, assigneeId: e.target.value === "" ? undefined : e.target.value as any })}>
                    <option value="">Unassigned</option>
                    {members?.map((m: any) => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Target Date</h3>
                  <input type="date" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" value={selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toISOString().split('T')[0] : ""} onChange={(e) => setDueDate({ ticketId: selectedTicket._id, dueDate: e.target.value ? new Date(e.target.value).getTime() : undefined })} />
                </div>

                <div className="pt-6 border-t border-border space-y-3">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> Controls</h3>
                  {hasAdminRights ? (
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
                          <select className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-xs" onChange={(e) => setTargetWs(e.target.value)}>
                            <option value="">Select Department...</option>
                            {workspaces?.filter(ws => ws._id !== workspaceId).map(ws => (
                              <option key={ws._id} value={ws._id}>{ws.emoji} {ws.name}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button onClick={() => setIsTransferring(false)} className="flex-1 py-1 bg-foreground/5 rounded-lg text-[10px] font-bold uppercase">Cancel</button>
                            <button onClick={() => setConfirmAction({type: 'transfer', targetId: targetWs})} disabled={!targetWs} className="flex-1 py-1 bg-accent text-white rounded-lg text-[10px] font-bold uppercase">Confirm</button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-center text-muted font-medium bg-foreground/5 p-2 rounded-lg">Admin access required for critical actions.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW FLOW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="glass-panel max-w-lg w-full p-8 rounded-[40px] shadow-2xl border-border bg-background relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors">
               <X className="w-4 h-4 text-foreground" />
            </button>
            <div className="mb-8"><h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Create Ticket</h2><p className="text-muted text-sm font-normal">Define the requirements for this operation.</p></div>
            <div className="space-y-6">
              <div className="space-y-2"><label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Title</label><input placeholder="E.g. Update Security Protocol" className="input-field" value={newTicket.title} onChange={(e) => setNewTicket({...newTicket, title: e.target.value})} autoFocus /></div>
              <div className="space-y-2"><label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Type</label><div className="flex gap-2">{['task', 'bug', 'feature'].map((t) => (<button key={t} onClick={() => setNewTicket({...newTicket, type: t as any})} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${newTicket.type === t ? 'bg-accent text-white border-accent' : 'bg-background text-muted border-border hover:border-accent/50'}`}>{t}</button>))}</div></div>
              <div className="space-y-2"><label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Description</label><textarea placeholder="Detailed requirements..." className="input-field h-32 resize-none leading-relaxed" value={newTicket.description} onChange={(e) => setNewTicket({...newTicket, description: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Priority Level</label><div className="flex gap-2">{['low', 'medium', 'high'].map((p) => (<button key={p} onClick={() => setNewTicket({...newTicket, priority: p as any})} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${newTicket.priority === p ? 'bg-accent text-white border-accent' : 'bg-background text-muted border-border hover:border-accent/50'}`}>{p}</button>))}</div></div>
              <div className="pt-4"><button onClick={handleTicketCreate} className="apple-button w-full shadow-lg shadow-accent/20">Create Ticket</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}