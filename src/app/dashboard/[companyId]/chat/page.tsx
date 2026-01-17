"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { 
  Send, MessageCircle, ShieldCheck, Search, Users, 
  Paperclip, Smile, Hash, AtSign, Circle, CheckCheck, 
  File, X, Loader2, ArrowLeft
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function GeneralChat() {
  const params = useParams();
  const companyId = params.companyId as any;
  const { user: clerkUser } = useUser();
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Responsive Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile, logic handled in render
  
  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data Queries
  const messages = useQuery(api.chat.getMessages, { companyId });
  const members = useQuery(api.companies.getMembers, { companyId });
  
  // Mutations
  const sendMessage = useMutation(api.chat.send);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Auto-scroll ref
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async (e?: React.FormEvent, attachmentId?: string) => {
    if (e) e.preventDefault();
    if (!message.trim() && !attachmentId) return;

    try {
      await sendMessage({ 
        companyId, 
        content: message, 
        attachmentId: attachmentId as any 
      });
      setMessage("");
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error("Failed to send:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      await handleSend(undefined, storageId);
      
    } catch (error) {
      console.error("File transmission error:", error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Filter messages based on search
  const filteredMessages = messages?.filter(msg => 
    msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] lg:h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans pb-4 lg:pb-6 relative">
      
      {/* MAIN CHAT STREAM */}
      <div className="flex-1 flex flex-col glass-panel rounded-[24px] lg:rounded-[32px] overflow-hidden border border-border shadow-sm bg-background/80 backdrop-blur-xl relative z-0">
        
        {/* CHAT HEADER */}
        <header className="px-4 lg:px-6 py-4 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent border border-accent/20">
              <Hash className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                General Intelligence
                <ShieldCheck className="w-3.5 h-3.5 text-green-600 hidden lg:block" />
              </h2>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="hidden lg:inline">Live • Encrypted</span>
                <span className="lg:hidden">Live</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg focus-within:border-accent/50 transition-all w-40 lg:w-56">
              <Search className="w-3.5 h-3.5 text-muted" />
              <input 
                placeholder="Search logs..." 
                className="bg-transparent border-none outline-none text-xs font-medium w-full text-foreground placeholder:text-muted"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Sidebar Toggle Button */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 lg:p-2.5 rounded-xl transition-all border ${isSidebarOpen ? 'bg-accent/10 text-accent border-accent/20' : 'hover:bg-background text-muted hover:text-foreground border-transparent hover:border-border'}`}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-1 flex flex-col-reverse custom-scrollbar scroll-smooth bg-background/30">
          <div ref={scrollRef} /> 
          
          {filteredMessages?.map((msg, idx) => {
            const isMe = msg.user?.clerkId === clerkUser?.id;
            const prevMsg = filteredMessages[idx + 1];
            const isContinuation = prevMsg && prevMsg.user?.clerkId === msg.user?.clerkId;
            const memberDetail = members?.find(m => m.userId === msg.authorId);

            return (
              <div key={msg._id} className={`flex gap-2 lg:gap-3 group ${isMe ? "flex-row-reverse" : "flex-row"} ${isContinuation ? "mt-[2px]" : "mt-4"}`}>
                {!isContinuation ? (
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-foreground/5 border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-sm self-end mb-1">
                    {msg.user?.image ? (
                      <img src={msg.user.image} alt={msg.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-[10px] text-muted">{msg.user?.name?.[0]}</span>
                    )}
                  </div>
                ) : (
                  <div className="w-7 lg:w-8 shrink-0" /> 
                )}

                <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isContinuation && !isMe && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] lg:text-[11px] font-bold text-foreground">{msg.user?.name}</span>
                      {memberDetail?.designation && (
                        <span className="text-[9px] px-1.5 py-0 rounded bg-foreground/5 text-muted font-bold uppercase tracking-wider border border-border hidden lg:inline-block">
                          {memberDetail.designation}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className={`
                    px-3 py-2 lg:px-4 lg:py-2 text-sm font-medium leading-relaxed shadow-sm backdrop-blur-md border relative break-words
                    ${isMe 
                      ? "bg-accent text-white border-accent/50 rounded-2xl rounded-tr-sm" 
                      : "bg-white dark:bg-white/5 text-foreground border-border rounded-2xl rounded-tl-sm"
                    }
                  `}>
                    {msg.attachmentUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
                        {msg.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={msg.attachmentUrl} alt="attachment" className="max-w-full h-auto max-h-48 lg:max-h-60 object-cover" />
                        ) : (
                          <div className="p-3 bg-black/5 dark:bg-white/5 flex items-center gap-2">
                            <File className="w-4 h-4" />
                            <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs underline truncate max-w-[150px]">
                              Download File
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT AREA */}
        <div className="p-3 lg:p-4 bg-background/80 backdrop-blur-xl border-t border-border">
          <form 
            onSubmit={(e) => handleSend(e)} 
            className="glass-panel p-2 rounded-[24px] lg:rounded-[26px] border border-border bg-background flex items-end gap-2 shadow-sm focus-within:border-accent/30 transition-all relative"
          >
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-foreground/5 text-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : <Paperclip className="w-5 h-5" />}
            </button>
            
            <textarea 
              placeholder="Transmit message..." 
              className="flex-1 bg-transparent border-none outline-none py-2 max-h-32 min-h-[36px] resize-none text-sm font-medium text-foreground placeholder:text-muted/70 custom-scrollbar leading-relaxed"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            
            <button 
              type="submit" 
              disabled={!message.trim() && !isUploading}
              className="h-9 w-9 flex-shrink-0 flex items-center justify-center bg-accent hover:bg-accent/90 disabled:bg-muted disabled:cursor-not-allowed rounded-full text-white transition-all shadow-md shadow-accent/20 group"
            >
              <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </form>
        </div>
      </div>

      {/* MEMBER SIDEBAR - RESPONSIVE */}
      {isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          <aside className={`
            fixed inset-y-0 right-0 z-50 w-80 shadow-2xl lg:shadow-sm lg:static lg:w-72 
            glass-panel rounded-l-[32px] lg:rounded-[32px] border border-border bg-background/95 backdrop-blur-3xl lg:bg-background/50 
            flex flex-col overflow-hidden transition-all duration-300 transform
            ${isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          `}>
            <div className="p-5 border-b border-border bg-background/40 flex items-center justify-between">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-accent" /> Active Personnel
              </h3>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="lg:hidden p-1.5 hover:bg-foreground/5 rounded-full text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {members?.map((member) => (
                <div key={member._id} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-foreground/5 transition-all border border-transparent hover:border-border cursor-pointer">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center font-bold text-xs text-muted border border-border">
                      {member.user?.name.substring(0, 1)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-background rounded-full">
                      <Circle className={`w-2 h-2 fill-current ${member.role === 'admin' ? 'text-green-500' : 'text-orange-500'}`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground truncate">{member.user?.name}</p>
                      {member.role === 'admin' && <ShieldCheck className="w-3 h-3 text-accent" />}
                    </div>
                    <p className="text-[9px] text-muted font-bold uppercase tracking-wider truncate opacity-70 group-hover:opacity-100 transition-opacity">
                      {member.roleName || member.designation || member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-border bg-foreground/[0.02]">
              <button className="w-full py-2.5 rounded-xl border border-dashed border-border text-[10px] font-bold text-muted uppercase tracking-wider hover:border-accent hover:text-accent transition-all">
                Invite Personnel
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}