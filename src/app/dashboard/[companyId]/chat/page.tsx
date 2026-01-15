"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { 
  Send, MessageCircle, ShieldCheck, Search, Users, 
  Paperclip, Smile, Hash, AtSign, Circle, CheckCheck, 
  File, X, Loader2
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function GeneralChat() {
  const params = useParams();
  const companyId = params.companyId as any;
  const { user: clerkUser } = useUser();
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
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
      // Smooth scroll to bottom
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
      // 1. Get secure upload URL
      const postUrl = await generateUploadUrl();
      
      // 2. Upload file directly to storage
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) throw new Error("Upload failed");
      
      const { storageId } = await result.json();
      
      // 3. Send message with attachment immediately
      await handleSend(undefined, storageId);
      
    } catch (error) {
      console.error("File transmission error:", error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Filter messages based on search
  const filteredMessages = messages?.filter(msg => 
    msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans pb-6">
      
      {/* MAIN CHAT STREAM */}
      <div className="flex-1 flex flex-col glass-panel rounded-[32px] overflow-hidden border border-border shadow-sm bg-background/80 backdrop-blur-xl">
        
        {/* CHAT HEADER */}
        <header className="px-6 py-4 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent border border-accent/20">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                General Intelligence
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              </h2>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live • Encrypted
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg focus-within:border-accent/50 transition-all w-56">
              <Search className="w-3.5 h-3.5 text-muted" />
              <input 
                placeholder="Search logs..." 
                className="bg-transparent border-none outline-none text-xs font-medium w-full text-foreground placeholder:text-muted"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2.5 rounded-xl transition-all border ${isSidebarOpen ? 'bg-accent/10 text-accent border-accent/20' : 'hover:bg-background text-muted hover:text-foreground border-transparent hover:border-border'}`}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-1 flex flex-col-reverse custom-scrollbar scroll-smooth bg-background/30">
          <div ref={scrollRef} /> 
          
          {filteredMessages?.map((msg, idx) => {
            const isMe = msg.user?.clerkId === clerkUser?.id;
            const prevMsg = filteredMessages[idx + 1];
            const isContinuation = prevMsg && prevMsg.user?.clerkId === msg.user?.clerkId;
            
            // Find member details for designation
            const memberDetail = members?.find(m => m.userId === msg.authorId);

            return (
              <div 
                key={msg._id} 
                className={`flex gap-3 group ${isMe ? "flex-row-reverse" : "flex-row"} ${isContinuation ? "mt-[2px]" : "mt-4"}`}
              >
                {!isContinuation ? (
                  <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-sm self-end mb-1">
                    {msg.user?.image ? (
                      <img src={msg.user.image} alt={msg.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-[10px] text-muted">{msg.user?.name?.[0]}</span>
                    )}
                  </div>
                ) : (
                  <div className="w-8 shrink-0" /> 
                )}

                <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isContinuation && !isMe && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[11px] font-bold text-foreground">{msg.user?.name}</span>
                      {memberDetail?.designation && (
                        <span className="text-[9px] px-1.5 py-0 rounded bg-foreground/5 text-muted font-bold uppercase tracking-wider border border-border">
                          {memberDetail.designation}
                        </span>
                      )}
                      <span className="text-[9px] text-muted opacity-50 font-medium">
                        {new Date(msg._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  
                  <div className={`
                    px-4 py-2 text-sm font-medium leading-relaxed shadow-sm backdrop-blur-md border relative
                    ${isMe 
                      ? "bg-accent text-white border-accent/50 rounded-2xl rounded-tr-sm" 
                      : "bg-white dark:bg-white/5 text-foreground border-border rounded-2xl rounded-tl-sm"
                    }
                  `}>
                    {/* Render Attachment if exists */}
                    {msg.attachmentUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
                        {msg.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={msg.attachmentUrl} alt="attachment" className="max-w-full h-auto max-h-60 object-cover" />
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
          
          <div className="text-center py-8 opacity-30">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">End of History</p>
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="p-4 bg-background/80 backdrop-blur-xl border-t border-border">
          <form 
            onSubmit={(e) => handleSend(e)} 
            className="glass-panel p-2 rounded-[26px] border border-border bg-background flex items-end gap-2 shadow-sm focus-within:border-accent/30 transition-all relative"
          >
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />

            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-foreground/5 text-muted hover:text-foreground transition-colors disabled:opacity-50 mb-1"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : <Paperclip className="w-5 h-5" />}
            </button>
            
            <textarea 
              placeholder="Transmit message..." 
              className="flex-1 bg-transparent border-none outline-none py-3 max-h-32 min-h-[48px] resize-none text-sm font-medium text-foreground placeholder:text-muted/70 custom-scrollbar leading-relaxed"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            
            <button type="button" className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-foreground/5 text-muted hover:text-foreground transition-colors mb-1">
              <Smile className="w-5 h-5" />
            </button>
            
            <button 
              type="submit" 
              disabled={!message.trim() && !isUploading}
              className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-accent hover:bg-accent/90 disabled:bg-muted disabled:cursor-not-allowed rounded-full text-white transition-all shadow-md shadow-accent/20 group mb-1"
            >
              <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </form>
        </div>
      </div>

      {/* MEMBER SIDEBAR */}
      {isSidebarOpen && (
        <aside className="w-72 glass-panel rounded-[32px] border border-border shadow-sm bg-background/50 backdrop-blur-3xl flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-500">
          <div className="p-5 border-b border-border bg-background/40">
            <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-accent" /> Active Personnel
            </h3>
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
      )}
    </div>
  );
}