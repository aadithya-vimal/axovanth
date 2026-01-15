"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  PlusCircle, Ticket, FolderRoot, ChevronRight, MessageSquare,
  ShieldAlert, Building2, Layers, Search, Command, Globe, Zap, Loader2,
  Menu, X, Sun, Moon, Settings, LogOut, Lock
} from "lucide-react";
import { UserButton, SignOutButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const companyId = params.companyId as any;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const company = useQuery(api.companies.getById, { id: companyId });
  const workspaces = useQuery(api.workspaces.getByCompany, { companyId });
  const userMember = useQuery(api.companies.getMemberRecord, { companyId });
  
  // Lock Logic
  const myWsIds = useQuery(api.workspaces.getMyMemberships, { companyId });
  const requestAccess = useMutation(api.workspaces.requestAccess);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleLockClick = async (wsId: string) => {
    if (confirm("This workspace is locked. Request access?")) {
      try {
        await requestAccess({ workspaceId: wsId as any });
        alert("Request sent to workspace admins.");
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  if (!company || !workspaces || !myWsIds) return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-accent" />
    </div>
  );

  const defaultWsId = workspaces.find(w => w.isDefault)?._id || workspaces[0]?._id;

  const NavItem = ({ icon: Icon, label, href, active, badge, locked, onClick }: any) => (
    <button
      onClick={() => {
        if (locked) {
          onClick();
        } else {
          router.push(href);
          setIsSidebarOpen(false);
        }
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group cursor-pointer ${
        active 
          ? "bg-white dark:bg-white/10 shadow-sm text-accent ring-1 ring-black/5 dark:ring-white/5" 
          : "text-muted hover:bg-white/50 dark:hover:bg-white/5 hover:text-foreground"
      } ${locked ? "opacity-70 grayscale" : ""}`}
    >
      {locked ? <Lock className="w-4 h-4 text-muted" /> : <Icon className={`w-4 h-4 ${active ? "text-accent" : "opacity-50 group-hover:opacity-100"}`} />}
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded-lg text-[10px] font-bold">{badge}</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* OMNIBAR */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 flex items-center gap-3 border-b border-white/5">
              <Search className="w-5 h-5 text-muted" />
              <input autoFocus placeholder="Search Axovanth..." className="bg-transparent border-none outline-none w-full text-lg font-medium text-foreground" />
              <div className="px-2 py-1 bg-foreground/5 rounded text-[10px] font-bold text-muted">ESC</div>
            </div>
            <div className="p-4 space-y-1">
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest px-2 mb-2">Quick Actions</div>
              <button onClick={() => { setIsSearchOpen(false); router.push(`/dashboard/${companyId}/admin`); }} className="w-full flex items-center gap-3 p-3 hover:bg-accent hover:text-white rounded-2xl transition-all group cursor-pointer">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-sm font-bold text-foreground group-hover:text-white">Jump to Admin Center</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 m-4 lg:relative lg:flex lg:m-4 
        glass-panel rounded-[32px] flex-col transition-all duration-500 border border-black/5 dark:border-white/10
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center overflow-hidden border border-accent/20 shadow-lg shadow-accent/20">
               {company.logoUrl ? <img src={company.logoUrl} className="w-full h-full object-cover" /> : <span className="text-white font-bold">{company.name.substring(0, 1).toUpperCase()}</span>}
             </div>
             <div className="min-w-0">
               <h2 className="font-bold text-foreground text-sm truncate leading-tight">{company.name}</h2>
               {/* RENAMED: Premium OS -> Premium Platform */}
               <span className="text-[10px] text-accent font-bold uppercase tracking-widest">
                 Premium Platform
               </span>
             </div>
          </div>
        </div>

        <div className="p-3">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-100/50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-gray-400">
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Command + K</span>
            </div>
            <Command className="w-3 h-3 text-gray-300" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
          {/* DEPARTMENTS SECTION */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest px-3 mb-2 block">Departments</span>
            {workspaces.map(ws => {
              const isLocked = !myWsIds.includes(ws._id);
              return (
                <NavItem 
                  key={ws._id} 
                  icon={Layers} 
                  label={ws.name} 
                  href={`/dashboard/${companyId}/ws/${ws._id}`} 
                  active={pathname === `/dashboard/${companyId}/ws/${ws._id}`}
                  locked={isLocked}
                  onClick={() => handleLockClick(ws._id)}
                />
              );
            })}
          </div>

          {/* SYSTEM HUB SECTION */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest px-3 mb-2 block">System Hub</span>
            <NavItem 
              icon={MessageSquare} 
              label="General Chat" 
              href={`/dashboard/${companyId}/chat`} 
              active={pathname.includes('/chat')}
              badge="Live" 
            />
            <NavItem 
              icon={Ticket} 
              label="Operation Flow" 
              href={`/dashboard/${companyId}/workflow`} 
              active={pathname.includes('/workflow')} 
            />
            <NavItem 
              icon={FolderRoot} 
              label="Asset Vault" 
              href={`/dashboard/${companyId}/assets`} 
              active={pathname.includes('/assets')}
            />
          </div>

          {/* ADMINISTRATION SECTION */}
          {userMember?.role === "admin" && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest px-3 mb-2 block">Governance</span>
              <NavItem 
                icon={ShieldAlert} 
                label="Admin Center" 
                href={`/dashboard/${companyId}/admin`} 
                active={pathname.includes("/admin")} 
              />
              <NavItem 
                icon={Settings} 
                label="System Config" 
                href={`/dashboard/${companyId}/settings`} 
                active={pathname.includes("/settings")}
              />
            </div>
          )}
        </nav>

        {/* BOTTOM SECTION WITH LOGOUT */}
        <div className="p-4 bg-foreground/[0.02] border-t border-black/5 dark:border-white/5 flex flex-col gap-3 rounded-b-[32px]">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
              <UserButton appearance={{ elements: { avatarBox: "w-9 h-9 rounded-xl shadow-sm" } }} />
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-foreground truncate w-24">Active Session</p>
                <p className="text-[9px] text-muted font-bold uppercase">v2.1.8-Premium</p>
              </div>
            </div>
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 bg-background rounded-xl border border-black/5 dark:border-white/10 hover:scale-110 transition-transform active:scale-95 shadow-sm cursor-pointer"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-accent" />}
            </button>
          </div>
          
          <SignOutButton>
             <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest cursor-pointer">
               <LogOut className="w-3.5 h-3.5" /> Terminate Session
             </button>
          </SignOutButton>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto lg:p-12 p-6 pt-24 lg:pt-12 transition-all duration-500 relative z-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}