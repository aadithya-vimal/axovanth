"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, X, Loader2, Hash, File, LayoutGrid, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

export function GlobalSearch({ isOpen, onClose, companyId }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Debounce query to prevent spamming the backend
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Reset query when the modal opens/closes
  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const results = useQuery(api.search.searchGlobal, debouncedQuery ? { companyId: companyId as Id<"companies">, query: debouncedQuery } : "skip");

  const handleSelect = (link: string) => {
    onClose();
    router.push(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-border px-4 py-3 gap-3">
          <Search className="w-5 h-5 text-muted" />
          <input 
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted text-sm font-medium h-8"
            placeholder="Search tickets, assets, workspaces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} className="p-1 hover:bg-foreground/5 rounded text-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-1">
          {!query && (
            <div className="py-8 text-center text-xs text-muted">
              Type to search across your organization.
            </div>
          )}
          
          {query && results === undefined && (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
            </div>
          )}

          {query && results && results.length === 0 && (
            <div className="py-8 text-center text-xs text-muted">
              No results found for "{query}".
            </div>
          )}

          {results?.map((result: any) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result.link)}
              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-accent/10 hover:text-accent text-left group transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-muted group-hover:text-accent">
                {result.type === "Ticket" && <Hash className="w-4 h-4" />}
                {result.type === "Asset" && <File className="w-4 h-4" />}
                {result.type === "Workspace" && <LayoutGrid className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground group-hover:text-accent truncate">{result.title}</p>
                <p className="text-[10px] text-muted font-medium uppercase tracking-wider">{result.type} • {result.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted/30 group-hover:text-accent" />
            </button>
          ))}
        </div>
        
        <div className="bg-foreground/[0.02] border-t border-border px-4 py-2 flex justify-between items-center text-[10px] text-muted">
           <span>Axovanth Search</span>
           <div className="flex gap-2">
             <span>Select ↵</span>
             <span>Close Esc</span>
           </div>
        </div>
      </div>
    </div>
  );
}