"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { 
  Ticket, Hash, Loader2, ArrowRightLeft, X, Send, AlertCircle, ChevronRight, 
  User, RefreshCw, Check, Calendar, Flag, Clock, History, MessageSquare, AlertTriangle
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function OperationalWorkflow() {
  const params = useParams();
  const companyId = params.companyId as any;
  const { user: clerkUser } = useUser();

  // Global Data
  const tickets = useQuery(api.tickets.getAll, { companyId });
  const workspaces = useQuery(api.workspaces.getByCompany, { companyId });
  const adminStats = useQuery(api.workspaces.getMyAdminStats, { companyId });
  const members = useQuery(api.companies.getMembers, { companyId });

  // Mutations
  const transferTicket = useMutation(api.tickets.transfer);
  const resolveTicket = useMutation(api.tickets.resolve);
  const reopenTicket = useMutation(api.tickets.reopen);
  const addComment = useMutation(api.tickets.addComment);
  const updatePriority = useMutation(api.tickets.updatePriority);
  const assignTicket = useMutation(api.tickets.assign);
  const setDueDate = useMutation(api.tickets.setDueDate);

  // UI State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [tab, setTab] = useState<'chat' | 'audit'>('chat');
  const [confirmAction, setConfirmAction] = useState<{type: 'resolve' | 'reopen' | 'transfer', targetId?: string} | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [targetWs, setTargetWs] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  
  const selectedTicket = tickets?.find((t: any) => t._id === selectedTicketId) || null;
  const comments = useQuery(api.tickets.getComments, selectedTicketId ? { ticketId: selectedTicketId as any } : "skip");
  const events = useQuery(api.tickets.getEvents, selectedTicketId ? { ticketId: selectedTicketId as any } : "skip");

  // Permission Logic
  const canEdit = (ticketWsId: string) => {
    if (!adminStats) return false;
    if (adminStats.isOverallAdmin) return true;
    return adminStats.adminWorkspaceIds.includes(ticketWsId);
  };

  const hasEditRights = selectedTicket ? canEdit(selectedTicket.workspaceId) : false;

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;
    try {
      await addComment({ ticketId: selectedTicket._id, content: commentText });
      setCommentText("");
      if(tab === 'chat') setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { console.error(e); }
  };

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
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!tickets || !workspaces || !adminStats) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
      <p className="text-muted text-sm font-medium animate-pulse">Synchronizing Global Workflow...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-700 font-sans">
      
      {/* GLOBAL HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-wider mb-2">
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Global Overview
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Operational Workflow</h1>
          <p className="text-muted text-lg font-normal">Centralized command for all departmental tickets.</p>
        </div>
      </header>

      {/* TICKET LIST */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl">
            <p className="text-muted text-sm font-medium">No active flows in the system.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div 
              key={ticket._id}
              onClick={() => setSelectedTicketId(ticket._id)}
              className="glass-panel p-6 rounded-2xl border border-border hover:border-accent/50 hover:bg-accent/[0.02] transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-foreground/5 border border-border`}>
                  {ticket.workspace?.emoji || "📂"}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground tracking-tight">{ticket.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted">{ticket.workspace?.name}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      ticket.priority === 'high' ? 'text-red-500' : ticket.priority === 'medium' ? 'text-orange-500' : 'text-green-500'
                    }`}>{ticket.priority}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-foreground">{ticket.assignee?.name || "Unassigned"}</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider">Assignee</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  ticket.status === 'open' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-green-500/10 text-green-600 border-green-500/20'
                }`}>
                  {ticket.status}
                </div>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ENHANCED DRAWER */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end bg-black/40 backdrop-blur-md p-4 transition-all">
          <div className="glass-panel w-full max-w-5xl h-full rounded-[32px] shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col border-border bg-background">
            
            {/* CONFIRMATION MODAL */}
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

            <header className="px-8 py-5 border-b border-border bg-background/50 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent border border-accent/20">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground truncate w-96 tracking-tight">{selectedTicket.title}</h2>
                  <p className="text-xs text-muted font-medium">{selectedTicket.workspace?.name} Workspace</p>
                </div>
              </div>
              <button onClick={() => setSelectedTicketId(null)} className="p-2 hover:bg-foreground/5 rounded-full text-muted hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col border-r border-border min-w-0">
                
                {/* TABS */}
                <div className="flex items-center border-b border-border px-8">
                  <button 
                    onClick={() => setTab('chat')} 
                    className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all ${tab === 'chat' ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}
                  >
                    <MessageSquare className="w-3 h-3 inline mr-2" /> Discussion
                  </button>
                  <button 
                    onClick={() => setTab('audit')} 
                    className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all ${tab === 'audit' ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}
                  >
                    <History className="w-3 h-3 inline mr-2" /> Audit Log
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {tab === 'chat' ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-foreground/[0.02] rounded-2xl border border-border">
                        <p className="text-foreground text-sm leading-relaxed">{selectedTicket.description}</p>
                      </div>
                      <div className="space-y-4">
                        {comments?.map((c) => {
                          const isMe = c.author?.clerkId === clerkUser?.id;
                          return (
                            <div key={c._id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-xs font-bold text-muted shrink-0">
                                {c.author?.name?.[0]}
                              </div>
                              <div className={`max-w-[80%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
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
                  ) : (
                    <div className="space-y-4">
                      {events?.map((e, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-xl bg-foreground/[0.02] border border-border">
                          <div className="mt-1">
                            {e.type === 'created' && <Plus className="w-4 h-4 text-blue-500" />}
                            {e.type === 'status_change' && <Check className="w-4 h-4 text-green-500" />}
                            {e.type === 'priority_update' && <Flag className="w-4 h-4 text-orange-500" />}
                            {e.type === 'transferred' && <ArrowRightLeft className="w-4 h-4 text-purple-500" />}
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
                  <form onSubmit={handleComment} className="p-4 border-t border-border bg-background/50 backdrop-blur-md">
                    <div className="flex gap-2">
                      <input placeholder="Transmit update..." className="input-field py-2.5 text-sm" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                      <button type="submit" className="p-3 bg-accent hover:bg-accent/90 text-white rounded-xl shadow-lg shadow-accent/20"><Send className="w-4 h-4" /></button>
                    </div>
                  </form>
                )}
              </div>

              {/* SIDEBAR */}
              <div className="w-80 bg-background/50 backdrop-blur-xl p-6 space-y-8 overflow-y-auto custom-scrollbar border-l border-border">
                <div className={`space-y-8 ${!hasEditRights ? "opacity-50 pointer-events-none grayscale" : ""}`}>
                  
                  {/* Priority */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><Flag className="w-3.5 h-3.5" /> Priority</h3>
                    <div className="flex bg-foreground/5 p-1 rounded-xl">
                      {['low', 'medium', 'high'].map((p) => (
                        <button
                          key={p}
                          onClick={() => updatePriority({ ticketId: selectedTicket._id, priority: p as any })}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                            selectedTicket.priority === p ? 'bg-white shadow-sm text-foreground' : 'text-muted'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><User className="w-3.5 h-3.5" /> Assignee</h3>
                    <select 
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                      value={selectedTicket.assigneeId || ""}
                      onChange={(e) => assignTicket({ ticketId: selectedTicket._id, assigneeId: e.target.value === "" ? undefined : e.target.value as any })}
                    >
                      <option value="">Unassigned</option>
                      {members?.map((m: any) => (
                        <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Target Date</h3>
                    <input 
                      type="date" 
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                      value={selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toISOString().split('T')[0] : ""}
                      onChange={(e) => setDueDate({ ticketId: selectedTicket._id, dueDate: e.target.value ? new Date(e.target.value).getTime() : undefined })}
                    />
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="pt-6 border-t border-border space-y-3">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> Controls</h3>
                  
                  {!hasEditRights && <p className="text-xs text-red-500 font-medium bg-red-500/10 p-2 rounded-lg">Read Only Access</p>}

                  {hasEditRights && (
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
                            {workspaces?.filter(ws => ws._id !== selectedTicket.workspaceId).map(ws => (
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}