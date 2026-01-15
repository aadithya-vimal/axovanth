"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Plus, Search, ArrowRight, Loader2, LogOut, CheckCircle2, AlertCircle, Sun, Moon, LayoutGrid } from "lucide-react";

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>({});
  
  const createCompany = useMutation(api.companies.create);
  const requestAccess = useMutation(api.companies.requestAccess);
  const companies = useQuery(api.companies.getAll);
  const myMemberships = useQuery(api.companies.getMyMemberships);
  
  const router = useRouter();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    
    setIsCreating(true);
    try {
      const result = await createCompany({ name: companyName });
      router.push(`/dashboard/${result.companyId}/ws/${result.workspaceId}`);
    } catch (error) {
      console.error("Failed to create company:", error);
      setIsCreating(false);
    }
  };

  const handleJoin = async (companyId: string) => {
    setRequestStatus(prev => ({ ...prev, [companyId]: 'loading' }));
    try {
      await requestAccess({ companyId });
      setRequestStatus(prev => ({ ...prev, [companyId]: 'success' }));
    } catch (error: any) {
      if (error.message.includes("Membership already exists")) {
        setRequestStatus(prev => ({ ...prev, [companyId]: 'joined' }));
      } else {
        setRequestStatus(prev => ({ ...prev, [companyId]: 'error' }));
        alert("Could not join: " + error.message);
      }
    }
  };

  const handleEnter = (companyId: string) => {
    router.push(`/dashboard/${companyId}`);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center relative transition-colors duration-500 font-sans">
      
      {/* HEADER CONTROLS */}
      <div className="absolute top-6 right-8 z-50 flex items-center gap-3">
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-xl bg-background border border-border hover:bg-foreground/5 transition-colors text-muted"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <SignOutButton>
          <button className="flex items-center gap-2 text-sm font-bold text-muted hover:text-red-500 transition-colors bg-background px-4 py-2 rounded-xl border border-border shadow-sm cursor-pointer hover:bg-red-500/5">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </SignOutButton>
      </div>

      <div className="max-w-4xl w-full mt-10">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Setup your workspace</h1>
          {/* RENAMED from Enterprise OS Initialization */}
          <p className="text-muted mt-2 italic font-medium">Axovanth Enterprise Initialization</p>
          <div className="mt-4 inline-block px-4 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-widest border border-accent/20">
            Identity: {user?.fullName || "Verified User"}
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Company Section */}
          <div className="glass-panel p-8 rounded-[32px] flex flex-col h-full shadow-sm border border-border hover:border-accent/30 transition-all">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-accent/20">
              <Plus className="text-accent w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-foreground">Create Organization</h2>
            <p className="text-sm text-muted font-medium mb-8">Establish a new multi-tenant instance for your team.</p>
            
            <form onSubmit={handleCreate} className="mt-auto">
              <input
                type="text"
                placeholder="Company Name"
                className="input-field mb-4"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isCreating}
              />
              <button 
                type="submit" 
                className="apple-button w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-accent/20"
                disabled={isCreating || !companyName.trim()}
              >
                {isCreating ? <Loader2 className="animate-spin w-4 h-4" /> : "Create Workspace"}
                {!isCreating && <ArrowRight className="w-4 h-4 ml-2" />}
              </button>
            </form>
          </div>

          {/* Join Company Section */}
          <div className="glass-panel p-8 rounded-[32px] flex flex-col h-full shadow-sm border border-border hover:border-accent/30 transition-all">
            <div className="w-12 h-12 bg-foreground/5 rounded-2xl flex items-center justify-center mb-6 border border-border">
              <Search className="text-muted w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-foreground">Join Organization</h2>
            <p className="text-sm text-muted font-medium mb-4">Discovery: Browse and request access to an existing organization.</p>
            
            <div className="space-y-3 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
              {companies === undefined || myMemberships === undefined ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-16 bg-foreground/5 rounded-2xl w-full" />)}
                </div>
              ) : companies.length === 0 ? (
                <p className="text-center text-muted py-10 text-sm italic">No organizations found</p>
              ) : (
                companies.map((company) => {
                   const membership = myMemberships.find(m => m.companyId === company._id);
                   const status = requestStatus[company._id] || 'idle';
                   const isJoined = status === 'joined' || status === 'success';
                   
                   const isMember = membership?.status === "active";
                   const isPending = membership?.status === "pending" || isJoined;

                   return (
                    <div 
                      key={company._id} 
                      className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border hover:border-accent/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-foreground/5 rounded-xl flex items-center justify-center font-bold text-muted uppercase text-xs border border-border">
                          {company.name.substring(0, 2)}
                        </div>
                        <span className="font-bold text-foreground text-sm">{company.name}</span>
                      </div>
                      
                      {isMember ? (
                        <button 
                          onClick={() => handleEnter(company._id)}
                          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all text-green-600 bg-green-500/10 hover:bg-green-500/20 cursor-pointer"
                        >
                          Launch <LayoutGrid className="w-3 h-3" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => !isPending && handleJoin(company._id)}
                          disabled={status === 'loading' || isPending}
                          className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all
                            ${isPending 
                              ? "text-orange-500 bg-orange-500/10 cursor-not-allowed" 
                              : "text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 cursor-pointer"
                            }
                          `}
                        >
                          {status === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
                          {isPending && <>Pending <CheckCircle2 className="w-3 h-3" /></>}
                          {!isPending && status === 'idle' && <>Request <ArrowRight className="w-3 h-3" /></>}
                          {status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}