"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Settings, Save, AlertTriangle, Trash2, User, Key, Edit2, X, Check, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function SystemConfig() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as any;
  const { user: clerkUser } = useUser();
  
  // Data
  const company = useQuery(api.companies.getById, { id: companyId });
  const currentUser = useQuery(api.users.currentUser);
  const members = useQuery(api.companies.getMembers, { companyId });
  const roles = useQuery(api.roles.getRoles, { companyId });
  
  // Mutations
  const updateDetails = useMutation(api.companies.updateDetails);
  const deleteCompany = useMutation(api.companies.deleteCompany);
  const requestRole = useMutation(api.roles.requestRole);
  const updateUserName = useMutation(api.users.updateName);
  
  // State
  const [activeTab, setActiveTab] = useState<'profile' | 'system'>('profile');
  const [name, setName] = useState(company?.name || "");
  const [desc, setDesc] = useState(company?.description || "");
  const [logo, setLogo] = useState(company?.logoUrl || "");
  const [transferId, setTransferId] = useState("");
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newName, setNewName] = useState("");

  // Role Request Modal State
  const [roleRequestModal, setRoleRequestModal] = useState<{
    isOpen: boolean;
    roleId: Id<"roles"> | null;
    roleName: string;
  }>({ isOpen: false, roleId: null, roleName: "" });

  const handleUpdate = async () => {
    await updateDetails({ companyId, name, description: desc, logoUrl: logo });
    // Optional: Add a toast here instead of alert, but for now we remove the alert
  };

  const handleDelete = async () => {
    if (confirm("CRITICAL: This will destroy the entire organization. Are you sure?")) {
      await deleteCompany({ companyId });
      router.push("/");
    }
  };

  const openRoleRequestModal = (roleId: Id<"roles">, roleName: string) => {
    setRoleRequestModal({ isOpen: true, roleId, roleName });
  };

  const confirmRoleRequest = async () => {
    if (!roleRequestModal.roleId) return;
    try {
      await requestRole({ companyId, roleId: roleRequestModal.roleId });
      setRoleRequestModal({ isOpen: false, roleId: null, roleName: "" });
    } catch (e: any) {
      alert(e.message); // Fallback for actual errors
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    await updateUserName({ name: newName });
    setIsEditingProfile(false);
  };

  // Sync default form values
  if(company && name === "") { setName(company.name); setDesc(company.description || ""); setLogo(company.logoUrl || ""); }

  // Check if current user is admin
  const myRecord = members?.find(m => m.user?.clerkId === clerkUser?.id);
  const isAdmin = myRecord?.role === 'admin';

  return (
    <div className="max-w-5xl space-y-12 pb-40 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans">
      
      {/* ---------------------------------------------------------------------- */}
      {/* ROLE REQUEST MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {roleRequestModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="glass-panel max-w-sm w-full p-8 rounded-[32px] shadow-2xl border-border bg-background relative animate-in zoom-in-95">
            <button 
              onClick={() => setRoleRequestModal({ ...roleRequestModal, isOpen: false })} 
              className="absolute top-4 right-4 p-2 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
            
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 mx-auto border border-accent/20">
              <Key className="w-6 h-6" />
            </div>
            
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold mb-2 text-foreground tracking-tight">Request Assignment</h3>
              <p className="text-muted text-sm leading-relaxed px-2 font-normal">
                Submit a request to be assigned the <span className="font-bold text-foreground">{roleRequestModal.roleName}</span> role?
              </p>
            </div>
            
            <button 
              onClick={confirmRoleRequest} 
              className="apple-button w-full justify-center shadow-lg shadow-accent/20 mb-3"
            >
              Confirm Request
            </button>
            
            <button 
              onClick={() => setRoleRequestModal({ ...roleRequestModal, isOpen: false })} 
              className="w-full py-3 rounded-xl bg-foreground/5 font-semibold text-xs uppercase tracking-wider border border-border hover:bg-foreground/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-wider mb-2">
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Preferences
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted text-lg font-normal">Manage your identity and workspace configuration.</p>
        </div>
        
        {/* TAB SWITCHER */}
        <div className="flex gap-2 bg-foreground/5 p-1 rounded-xl self-start md:self-auto">
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'profile' 
                ? 'bg-background shadow-sm text-foreground ring-1 ring-border' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            My Profile
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('system')} 
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'system' 
                  ? 'bg-background shadow-sm text-foreground ring-1 ring-border' 
                  : 'text-muted hover:text-foreground'
              }`}
            >
              System
            </button>
          )}
        </div>
      </header>

      {/* EDIT NAME MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel max-w-sm w-full p-8 rounded-[32px] shadow-2xl border-border bg-background relative animate-in zoom-in-95">
            <button onClick={() => setIsEditingProfile(false)} className="absolute top-4 right-4 p-2 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors">
              <X className="w-4 h-4 text-foreground" />
            </button>
            
            <h3 className="text-xl font-bold mb-6 text-foreground">Update Identity</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Display Name</label>
                <input 
                  className="input-field mt-1" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder={currentUser?.name}
                  autoFocus
                />
              </div>
              <button 
                onClick={handleUpdateName} 
                className="apple-button w-full justify-center shadow-lg shadow-accent/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <section className="glass-panel p-6 lg:p-8 rounded-[32px] border-border bg-background space-y-8 animate-in fade-in duration-500">
          <div>
            <h2 className="text-lg font-bold text-foreground">My Access & Roles</h2>
            <p className="text-sm text-muted mt-1">View your current standing and request new privileges.</p>
          </div>

          <div className="p-6 bg-foreground/5 rounded-2xl border border-border flex flex-col sm:flex-row items-center sm:items-start gap-6 relative group text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center text-2xl font-bold overflow-hidden shrink-0">
              {currentUser?.image ? (
                <img src={currentUser.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                currentUser?.name?.[0]
              )}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <h3 className="font-bold text-lg text-foreground">{currentUser?.name}</h3>
                <button 
                  onClick={() => { setNewName(currentUser?.name || ""); setIsEditingProfile(true); }}
                  className="p-1.5 bg-background rounded-lg text-muted hover:text-accent transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-border cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase">{myRecord?.role}</span>
                {myRecord?.roleName && <span className="px-3 py-1 bg-foreground/10 text-foreground rounded-full text-xs font-bold uppercase">{myRecord.roleName}</span>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Available Roles</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {roles?.map(r => (
                <div key={r._id} className="p-4 rounded-xl border border-border hover:border-accent/50 transition-all flex justify-between items-center bg-background/50">
                  <div>
                    <p className="font-bold text-sm text-foreground">{r.name}</p>
                    <p className="text-xs text-muted mt-1">{r.description}</p>
                  </div>
                  {myRecord?.roleId === r._id ? (
                    <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-lg uppercase tracking-wider">Active</span>
                  ) : (
                    <button 
                      onClick={() => openRoleRequestModal(r._id, r.name)} 
                      className="px-4 py-2 bg-foreground text-background text-xs font-bold rounded-lg uppercase hover:opacity-90 shadow-sm transition-opacity"
                    >
                      Request
                    </button>
                  )}
                </div>
              ))}
              {roles?.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted text-sm italic">
                  No custom roles defined by administrators yet.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'system' && isAdmin && (
        <div className="animate-in fade-in duration-500 space-y-8">
          {/* BRANDING SECTION */}
          <section className="glass-panel p-6 lg:p-8 rounded-[32px] border-border bg-background space-y-6">
            <h2 className="text-lg font-bold text-foreground">Organization Identity</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase">Company Name</label>
                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase">Logo URL</label>
                <input className="input-field" value={logo} onChange={(e) => setLogo(e.target.value)} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-muted uppercase">Description</label>
                <textarea className="input-field h-24" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleUpdate} className="apple-button shadow-lg shadow-accent/20">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </section>

          {/* DANGER ZONE */}
          <section className="glass-panel p-6 lg:p-8 rounded-[32px] border-red-500/20 bg-red-500/[0.02] space-y-8">
            <div className="flex items-center gap-4 text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-bold">Danger Zone</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-foreground text-sm">Transfer Ownership</h3>
                <p className="text-xs text-muted">Transfer root admin privileges to another user. This action is irreversible.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select className="input-field text-xs" value={transferId} onChange={(e) => setTransferId(e.target.value)}>
                    <option value="">Select New Owner...</option>
                    {members?.map(m => <option key={m.userId} value={m.userId}>{m.user?.name}</option>)}
                  </select>
                  <button 
                    disabled={!transferId} 
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-bold text-xs rounded-xl uppercase disabled:opacity-50 transition-all shadow-sm"
                  >
                    Transfer
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-red-500 text-sm">Dissolve Organization</h3>
                <p className="text-xs text-muted">Permanently delete all data, workspaces, and history. Cannot be undone.</p>
                <button onClick={handleDelete} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl uppercase shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete Organization
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}