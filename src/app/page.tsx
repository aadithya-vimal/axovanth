"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  ShieldCheck, Zap, Globe, Lock, ArrowRight, Sun, Moon, 
  LayoutGrid, Users, Command, Terminal, Cpu, CheckCircle2, Play, 
  Layers, BarChart3, Activity, Star, Code2, Database, Server, 
  Smartphone, MessageSquare, GitBranch, Workflow
} from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      storeUser();
    }
  }, [isAuthenticated, storeUser]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-blue-500/30">
      
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl transition-all border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm bg-zinc-900 dark:bg-white text-white dark:text-black border border-black/5 dark:border-white/10 overflow-hidden">
              <img src="/logo.png" alt="Axovanth Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg tracking-tight">Axovanth</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Platform</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
            {/* This link will now work */}
            <a href="#enterprise" className="hover:text-foreground transition-colors">Enterprise</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="h-5 w-px bg-border/50 hidden sm:block" />

            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2">Log In</button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 h-9 px-5 rounded-full text-sm font-bold shadow-lg transition-all transform hover:scale-105">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
            
            <SignedIn>
              <button 
                onClick={() => router.push("/onboarding")}
                className="bg-blue-600 text-white hover:bg-blue-700 h-9 px-5 rounded-full text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 lg:pt-36 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 rounded-[100%] blur-[120px] -z-10 animate-pulse duration-[5000ms]" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Axovanth 2.4 Enterprise
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 text-foreground">
            The Neural Network <br />
            for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 animate-gradient">Modern Enterprise.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10 font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Unified governance, granular access control, and seamless workflow automation. 
            Stop managing disjointed tools. Start commanding your organization.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 group hover:scale-105 active:scale-95">
                  Initialize System <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
              <button className="h-12 px-8 rounded-full bg-transparent border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground font-bold text-sm transition-all flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" /> Watch Demo
              </button>
            </SignedOut>
            <SignedIn>
              <button 
                onClick={() => router.push("/onboarding")}
                className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 group"
              >
                Launch Console <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignedIn>
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 opacity-100 transition-all duration-500">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trusted by innovative teams at</p>
             <div className="flex items-center gap-2 bg-white dark:bg-zinc-800/50 px-6 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
               <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">Zaphics</span>
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
               <span className="text-xs font-medium text-muted-foreground">Enterprise</span>
             </div>
          </div>
        </div>
      </section>

      {/* 3D INTERFACE PREVIEW */}
      <section className="px-6 pb-24 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="relative group perspective-1000 animate-in fade-in zoom-in-95 duration-1000 delay-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[32px] blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 scale-95 translate-y-8" />
            
            <div className="relative bg-zinc-50 dark:bg-zinc-900 rounded-[24px] border-[6px] border-white/50 dark:border-white/10 shadow-2xl overflow-hidden aspect-[16/10] transform transition-transform duration-700 hover:scale-[1.005] hover:rotate-x-1">
              <div className="h-10 bg-white/50 dark:bg-black/20 border-b border-border flex items-center px-4 gap-1.5 backdrop-blur-md">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto h-6 w-64 bg-black/5 dark:bg-white/5 rounded-md flex items-center justify-center border border-black/5 dark:border-white/5 shadow-sm">
                  <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> app.axovanth.com
                  </span>
                </div>
              </div>

              <div className="relative w-full h-full bg-white/50 dark:bg-black/50 p-6 overflow-hidden">
                 <div className="grid grid-cols-12 gap-4 h-full relative z-10">
                    <div className="col-span-2 hidden lg:flex flex-col gap-3 h-full border-r border-border pr-4">
                       <div className="h-8 w-8 bg-blue-600 rounded-lg mb-6 shadow-sm" />
                       {[1,2,3,4,5].map(i => (
                         <div key={i} className={`h-8 w-full rounded-lg ${i === 1 ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-transparent'}`} />
                       ))}
                    </div>
                    <div className="col-span-12 lg:col-span-10 grid grid-cols-4 gap-4">
                       <div className="col-span-4 h-12 flex justify-between items-center mb-2">
                          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                       </div>
                       <div className="col-span-3 h-64 bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
                          <div className="flex justify-between items-center mb-6">
                             <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                             <BarChart3 className="text-blue-500 w-4 h-4" />
                          </div>
                          <div className="flex items-end gap-3 h-32 w-full">
                             {[40, 70, 50, 90, 60, 80, 45, 30, 60, 75].map((h, i) => (
                               <div key={i} className="flex-1 bg-blue-500 rounded-t opacity-90" style={{ height: `${h}%` }} />
                             ))}
                          </div>
                       </div>
                       <div className="col-span-1 h-64 flex flex-col gap-4">
                          <div className="flex-1 bg-white dark:bg-zinc-900 border border-border rounded-2xl p-4 flex flex-col justify-center items-center shadow-sm">
                             <Activity className="w-8 h-8 text-purple-500 mb-3" />
                             <div className="h-6 w-16 bg-zinc-100 dark:bg-zinc-800 rounded mb-1" />
                             <span className="text-[10px] text-muted-foreground uppercase font-bold">Load</span>
                          </div>
                          <div className="flex-1 bg-zinc-900 dark:bg-blue-600 rounded-2xl p-4 flex flex-col justify-center items-center shadow-md text-white">
                             <Users className="w-8 h-8 mb-3" />
                             <div className="h-6 w-16 bg-white/20 rounded mb-1" />
                             <span className="text-[10px] uppercase font-bold opacity-80">Users</span>
                          </div>
                       </div>
                       <div className="col-span-2 h-32 bg-white dark:bg-zinc-900 border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                             <Zap className="w-6 h-6 text-orange-500" />
                          </div>
                          <div>
                             <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded mb-1.5" />
                             <div className="h-3 w-32 bg-zinc-50 dark:bg-zinc-800/50 rounded" />
                          </div>
                       </div>
                       <div className="col-span-2 h-32 bg-white dark:bg-zinc-900 border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                             <Globe className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                             <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded mb-1.5" />
                             <div className="h-3 w-32 bg-zinc-50 dark:bg-zinc-800/50 rounded" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS TICKER */}
      <section className="py-12 border-y border-border bg-background/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">Seamlessly Integrates With Your Stack</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             {[
                { icon: Code2, label: "GitHub" },
                { icon: MessageSquare, label: "Slack" },
                { icon: Database, label: "Postgres" },
                { icon: Server, label: "AWS" },
                { icon: Smartphone, label: "Mobile" },
                { icon: GitBranch, label: "Jira" },
             ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                   <item.icon className="w-6 h-6 text-foreground group-hover:text-blue-500 transition-colors" />
                   <span className="font-semibold text-sm">{item.label}</span>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* ARCHITECTURE BENTO (Enterprise/Security Section) */}
      {/* FIX: Added id="enterprise" here as well so the link works */}
      <section className="py-32" id="enterprise">
        {/* Helper span to also catch #security anchor if needed, though only one ID per element is valid in HTML. 
            We point the Enterprise link to this section. */}
        <div id="security" className="absolute -mt-32" />
        
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-20 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Engineered for Scale.</h2>
            <p className="text-muted-foreground text-lg">Built on a distributed edge network designed for 99.99% uptime and <br /> sub-millisecond latency.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
             
             {/* Large Left Card - DARK MODE FORCED */}
             <div className="md:col-span-2 rounded-[32px] bg-zinc-900 border border-zinc-800 p-8 relative overflow-hidden group hover:border-blue-500/20 transition-all shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                   <Activity className="w-48 h-48 text-blue-500" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                   <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-blue-400" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-bold mb-2 text-white">Real-Time Sync Protocol</h3>
                      <p className="text-zinc-400">Changes propagate instantly across all active nodes. No manual refreshing, no stale data. State management solved.</p>
                   </div>
                </div>
             </div>

             {/* Small Right Card - Security First - DARK MODE FORCED */}
             <div className="md:col-span-1 rounded-[32px] bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between relative overflow-hidden group shadow-sm hover:border-blue-500/30 transition-all">
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-2xl opacity-10 group-hover:scale-150 transition-transform duration-700" />
                <Lock className="w-10 h-10 text-blue-400 opacity-80" />
                <div>
                   <div className="text-2xl font-bold mb-1 text-white">Security First</div>
                   <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Developed with security in mind</p>
                </div>
             </div>

             {/* Small Left Card - DARK MODE FORCED */}
             <div className="md:col-span-1 rounded-[32px] bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between group hover:border-purple-500/20 transition-all shadow-sm">
                <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-500" />
                   <div className="w-3 h-3 rounded-full bg-yellow-500" />
                   <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div>
                   <h3 className="text-xl font-bold mb-2 text-white">Global Edge CDN</h3>
                   <p className="text-sm text-zinc-400">Assets served from 200+ edge locations worldwide.</p>
                </div>
             </div>

             {/* Large Right Card - DARK MODE FORCED */}
             <div className="md:col-span-2 rounded-[32px] bg-zinc-900 border border-zinc-800 p-8 relative overflow-hidden group hover:border-green-500/20 transition-all shadow-sm">
                <div className="absolute -right-10 top-10 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Workflow className="w-64 h-64 text-green-500" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                   <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                      <LayoutGrid className="w-6 h-6 text-green-400" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-bold mb-2 text-white">Workspace Isolation</h3>
                      <p className="text-zinc-400">Keep Engineering, Sales, and Legal contexts completely separate with granular permission barriers.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* FEATURES LIST */}
      <section className="py-24 border-t border-border bg-zinc-50 dark:bg-background" id="features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Lock}
              color="blue"
              title="Identity Kernel"
              desc="Role-Based Access Control (RBAC) with granular permissions. Secure your hierarchy from the root level down."
            />
            <FeatureCard 
              icon={Globe}
              color="green"
              title="Global Comms"
              desc="Encrypted organizational chat and broadcasting. Keep your team aligned across all timezones."
            />
            <FeatureCard 
              icon={Cpu}
              color="red"
              title="Asset Vault"
              desc="Centralized, secure storage for critical intellectual property. Drag-and-drop with version control."
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
             <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                   </div>
                   <span className="font-bold text-sm">Axovanth</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                   The operating system for modern enterprises. Built for speed, security, and scale.
                </p>
             </div>
             <div>
                <h4 className="font-bold text-sm mb-4">Product</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                   <li><a href="#" className="hover:text-foreground">Features</a></li>
                   <li><a href="#" className="hover:text-foreground">Integrations</a></li>
                   <li><a href="#" className="hover:text-foreground">Enterprise</a></li>
                   <li><a href="#" className="hover:text-foreground">Security</a></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-sm mb-4">Company</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                   <li><a href="#" className="hover:text-foreground">About Us</a></li>
                   <li><a href="#" className="hover:text-foreground">Careers</a></li>
                   <li><a href="#" className="hover:text-foreground">Blog</a></li>
                   <li><a href="#" className="hover:text-foreground">Contact</a></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-sm mb-4">Legal</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                   <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                   <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                   <li><a href="#" className="hover:text-foreground">Cookie Policy</a></li>
                </ul>
             </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                © 2026 Axovanth Inc. All rights reserved.
             </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Feature Card - Updated to forced Dark Theme
function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="p-6 rounded-[24px] bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:shadow-lg transition-all group duration-300">
      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-base font-bold mb-2 text-white tracking-tight">{title}</h3>
      <p className="text-zinc-400 leading-relaxed font-medium text-xs">{desc}</p>
    </div>
  );
}