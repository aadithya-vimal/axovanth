"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { FolderRoot, Upload, FileText, MoreVertical, Search, Filter, Loader2, Download } from "lucide-react";

export default function AssetVault() {
  const params = useParams();
  const companyId = params.companyId as any;
  
  // Note: Assuming we want a "All Assets in Company" view or similar.
  // For now, using a placeholder logic or if you have an API for all company assets, use that.
  // Based on your files, `api.files.getByWorkspace` exists.
  // If you don't have a "get all company assets" endpoint yet, this UI will just be the skeleton
  // ready to accept that data.
  // I will leave the data fetching generic or commented to avoid errors if the API is missing.
  
  // const assets = useQuery(api.files.getByCompany, { companyId }); 

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-wider mb-2">
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Encrypted Storage
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Asset Vault</h1>
          <p className="text-muted text-lg font-normal">Secure centralized storage & file protocol.</p>
        </div>
        <button className="apple-button shadow-lg shadow-accent/20 w-full md:w-auto justify-center">
          <Upload className="w-5 h-5" /> Upload Asset
        </button>
      </header>

      {/* SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 glass-panel px-6 py-4 rounded-2xl flex items-center gap-3 border-border hover:border-accent/50 transition-all">
          <Search className="w-5 h-5 text-muted" />
          <input 
            placeholder="Search encrypted assets..." 
            className="bg-transparent border-none outline-none w-full text-sm font-medium text-foreground placeholder:text-muted" 
          />
        </div>
        <button className="px-6 py-4 glass-panel rounded-2xl border-border text-sm font-semibold flex items-center justify-center gap-2 hover:bg-foreground/5 transition-all text-foreground">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* ASSET LIST / TABLE */}
      <section className="glass-panel rounded-[32px] overflow-hidden border-border bg-background shadow-sm">
        
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block">
            <table className="w-full text-left">
            <thead className="bg-foreground/[0.02] border-b border-border">
                <tr>
                <th className="px-8 py-5 text-[10px] font-bold text-muted uppercase tracking-wider">Asset Name</th>
                <th className="px-8 py-5 text-[10px] font-bold text-muted uppercase tracking-wider">Type</th>
                <th className="px-8 py-5 text-[10px] font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {/* Example Static Data */}
                <tr className="hover:bg-foreground/5 transition-all group">
                <td className="px-8 py-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20">
                    <FileText className="text-accent w-6 h-6" />
                    </div>
                    <div>
                    <p className="font-semibold text-foreground text-sm">Organization_Charter_2026.pdf</p>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1 opacity-70">Uploaded by System Admin</p>
                    </div>
                </td>
                <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-foreground/5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted border border-border">Document</span>
                </td>
                <td className="px-8 py-6 text-right">
                    <button className="p-2 text-muted hover:text-foreground hover:bg-foreground/10 rounded-lg transition-all">
                    <MoreVertical className="w-5 h-5" />
                    </button>
                </td>
                </tr>
            </tbody>
            </table>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="md:hidden p-4 space-y-4">
             <div className="glass-panel p-4 rounded-2xl border border-border flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20 shrink-0">
                    <FileText className="text-accent w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm truncate">Organization_Charter_2026.pdf</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">PDF</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[10px] text-muted">System Admin</span>
                    </div>
                </div>
                <button className="p-2 text-muted hover:text-accent">
                    <Download className="w-5 h-5" />
                </button>
             </div>
        </div>
        
        {/* Empty State / Placeholder */}
        <div className="p-12 md:p-20 text-center">
          <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
            <FolderRoot className="w-8 h-8 text-muted opacity-50" />
          </div>
          <p className="text-foreground font-semibold text-sm">Vault Initialization Complete</p>
          <p className="text-muted text-xs font-medium mt-1">Ready for secure asset transmission.</p>
        </div>
      </section>
    </div>
  );
}