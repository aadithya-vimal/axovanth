"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { 
  FolderRoot, Upload, FileText, MoreVertical, Search, Filter, 
  Loader2, Download, Trash2, FileSpreadsheet, FileImage, File, ShieldAlert,
  History, AlertTriangle, X
} from "lucide-react";

export default function AssetVault() {
  const params = useParams();
  const companyId = params.companyId as any;
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'vault' | 'audit'>('vault');
  const [filterType, setFilterType] = useState<'all' | 'doc' | 'sheet' | 'image'>('all');
  const [search, setSearch] = useState("");
  
  // Warning Dialog State
  const [warning, setWarning] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: "" });

  // Data
  const assets = useQuery(api.files.getByCompany, { companyId });
  const assetEvents = useQuery(api.files.getAssetEvents, activeTab === 'audit' ? { companyId } : "skip");
  const memberRecord = useQuery(api.companies.getMemberRecord, { companyId }); 
  
  // Mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const sendFile = useMutation(api.files.sendFile);
  const deleteFile = useMutation(api.files.deleteFile);

  const isAdmin = memberRecord?.role === "admin";

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // STRICT FORMAT VALIDATION
    const validTypes = [
        "application/pdf", 
        "application/msword", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.ms-excel", 
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "text/csv", 
        "image/png", 
        "image/jpeg", 
        "image/jpg"
    ];

    if (!validTypes.includes(file.type)) {
        setWarning({
            isOpen: true,
            message: `Format "${file.type}" is restricted. The Vault only accepts standard business documents (PDF, Word, Excel, CSV) and Images.`
        });
        e.target.value = ""; // Reset input
        return;
    }

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await result.json();
      await sendFile({ 
        storageId, 
        companyId, 
        fileName: file.name, 
        fileType: file.type 
      });
    } catch (error) { console.error(error); } finally { setIsUploading(false); }
  };

  const getCategory = (mime: string) => {
    if (mime.includes("pdf") || mime.includes("word") || mime.includes("document")) return "doc";
    if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return "sheet";
    if (mime.includes("image")) return "image";
    return "other";
  };

  const filteredAssets = assets?.filter(a => {
    const matchesSearch = a.fileName.toLowerCase().includes(search.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && getCategory(a.fileType) === filterType;
  });

  const FileIconComponent = ({ type }: { type: string }) => {
    const cat = getCategory(type);
    if (cat === 'doc') return <FileText className="w-5 h-5 text-blue-500" />;
    if (cat === 'sheet') return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    if (cat === 'image') return <FileImage className="w-5 h-5 text-purple-500" />;
    return <File className="w-5 h-5 text-muted" />;
  };

  const allowedTypes = ".pdf, .doc, .docx, .xls, .xlsx, .csv, .png, .jpg, .jpeg";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans relative">
      
      {/* WARNING MODAL UI */}
      {warning.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
              <div className="bg-background border border-border p-6 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 relative">
                  <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-4 mx-auto border border-orange-500/20">
                      <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-center text-lg font-bold text-foreground mb-2">Protocol Violation</h3>
                  <p className="text-center text-sm text-muted mb-6 leading-relaxed">{warning.message}</p>
                  <button 
                    onClick={() => setWarning({ isOpen: false, message: "" })} 
                    className="w-full py-3 rounded-xl bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                  >
                    Acknowledge
                  </button>
              </div>
          </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-wider mb-2">
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Encrypted Storage
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Asset Vault</h1>
          <p className="text-muted text-lg font-normal">Secure centralized storage & file protocol.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex bg-foreground/5 p-1 rounded-xl w-full md:w-auto">
                <button onClick={() => setActiveTab('vault')} className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'vault' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}>Vault</button>
                <button onClick={() => setActiveTab('audit')} className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'audit' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}>Log</button>
            </div>

            <label className={`apple-button shadow-lg shadow-accent/20 w-full md:w-auto justify-center cursor-pointer ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            Upload Asset
            <input type="file" className="hidden" onChange={onFileUpload} accept={allowedTypes} disabled={isUploading} />
            </label>
        </div>
      </header>

      {/* VAULT VIEW */}
      {activeTab === 'vault' && (
        <div className="space-y-6 animate-in fade-in">
            {/* SEARCH & FILTER */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 glass-panel px-6 py-4 rounded-2xl flex items-center gap-3 border-border hover:border-accent/50 transition-all">
                <Search className="w-5 h-5 text-muted" />
                <input 
                    placeholder="Search encrypted assets..." 
                    className="bg-transparent border-none outline-none w-full text-sm font-medium text-foreground placeholder:text-muted" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                </div>
                
                <div className="flex bg-foreground/5 p-1 rounded-2xl overflow-x-auto custom-scrollbar">
                    {['all', 'doc', 'sheet', 'image'].map((t) => (
                        <button 
                            key={t}
                            onClick={() => setFilterType(t as any)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                filterType === t 
                                ? 'bg-background shadow-sm text-foreground' 
                                : 'text-muted hover:text-foreground'
                            }`}
                        >
                            {t === 'all' ? 'All Files' : t === 'doc' ? 'Docs' : t === 'sheet' ? 'Sheets' : 'Images'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ASSET LIST */}
            <section className="glass-panel rounded-[32px] overflow-hidden border-border bg-background shadow-sm">
                <div className="hidden md:block">
                    <table className="w-full text-left">
                    <thead className="bg-foreground/[0.02] border-b border-border">
                        <tr>
                        <th className="px-8 py-5 text-[10px] font-bold text-muted uppercase tracking-wider">Asset Name & Origin</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-muted uppercase tracking-wider">Type</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {!assets ? (
                            <tr><td colSpan={3} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                        ) : filteredAssets?.length === 0 ? (
                            <tr><td colSpan={3} className="p-12 text-center text-sm text-muted">No assets found matching your filters.</td></tr>
                        ) : (
                            filteredAssets?.map((asset) => (
                                <tr key={asset._id} className="hover:bg-foreground/5 transition-all group">
                                <td className="px-8 py-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center border border-border">
                                        <FileIconComponent type={asset.fileType} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground text-sm truncate max-w-xs">{asset.fileName}</p>
                                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5 opacity-70">
                                            Uploaded by {asset.uploaderName} on {new Date(asset.uploadedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <span className="px-3 py-1 bg-foreground/5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted border border-border">
                                        {asset.fileType.split('/')[1] || 'Unknown'}
                                    </span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <a href={asset.url || "#"} target="_blank" className="p-2 bg-background border border-border rounded-lg text-muted hover:text-accent hover:border-accent transition-all">
                                            <Download className="w-4 h-4" />
                                        </a>
                                        {isAdmin && (
                                            <button 
                                                onClick={() => deleteFile({ assetId: asset._id })} 
                                                className="p-2 bg-background border border-border rounded-lg text-muted hover:text-red-500 hover:border-red-500 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    </table>
                </div>

                {/* MOBILE CARD VIEW */}
                <div className="md:hidden p-4 space-y-4">
                    {filteredAssets?.map((asset) => (
                        <div key={asset._id} className="glass-panel p-4 rounded-2xl border border-border flex items-center gap-4">
                            <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center border border-border shrink-0">
                                <FileIconComponent type={asset.fileType} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground text-sm truncate">{asset.fileName}</p>
                                <div className="flex flex-col gap-0.5 mt-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{asset.fileType.split('/')[1]}</span>
                                    <span className="text-[9px] text-muted opacity-70">By {asset.uploaderName}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <a href={asset.url || "#"} target="_blank" className="p-1.5 text-muted hover:text-accent"><Download className="w-4 h-4" /></a>
                                {isAdmin && (
                                    <button onClick={() => deleteFile({ assetId: asset._id })} className="p-1.5 text-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'audit' && (
          <div className="glass-panel rounded-[32px] overflow-hidden border-border bg-background shadow-sm animate-in fade-in">
              <div className="p-6 border-b border-border bg-foreground/[0.02]">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                      <History className="w-4 h-4 text-accent" /> Asset Ledger
                  </h3>
                  <p className="text-xs text-muted mt-1">Immutable record of all file operations.</p>
              </div>
              <div className="divide-y divide-border">
                  {assetEvents?.map((event: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-center gap-4 hover:bg-foreground/[0.02]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${event.type === 'upload' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                              {event.type === 'upload' ? <Upload className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{event.description}</p>
                              <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">
                                  {event.actorName} • {new Date(event._creationTime).toLocaleString()}
                              </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${event.type === 'upload' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                              {event.type}
                          </span>
                      </div>
                  ))}
                  {assetEvents?.length === 0 && <div className="p-12 text-center text-sm text-muted">No activity recorded.</div>}
              </div>
          </div>
      )}
    </div>
  );
}