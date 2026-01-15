"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { useState } from "react";
import { 
  ShieldCheck, UserCheck, UserMinus, Plus, 
  Settings2, Briefcase, LayoutGrid, Mail, Trash2,
  AlertTriangle, X, Loader2, Zap, Info, ChevronDown,
  ShieldAlert, UserCog, Building, Lock, Check,
  Activity, Globe, Fingerprint, Cpu, Database, Users, 
  ArrowRight, Edit2, Save, Layers, Inbox, UserPlus,
  // NEW ICONS
  Terminal, TrendingUp, BadgeDollarSign, Palette, Scale,
  LifeBuoy, Rocket, Bug, Box, FolderKanban
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Id } from "../../../../../convex/_generated/dataModel";

// Icon Registry (Must match Layout)
const WorkspaceIconMap: Record<string, any> = {
  Terminal, TrendingUp, BadgeDollarSign, Palette, Scale, Users, 
  Settings2, LifeBuoy, Rocket, Database, Briefcase, Bug, ShieldCheck, Box, FolderKanban
};

export default function AdminDashboard() {
  const params = useParams();
  const { user: clerkUser } = useUser();
  const companyId = params.companyId as any;

  // ----------------------------------------------------------------------
  // UI STATE MANAGEMENT
  // ----------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'workspaces' | 'roles' | 'requests'>('hierarchy');
  
  // Modal States
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: Id<"workspaces">, name: string } | null>(null);
  
  // Workspace Management State
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  
  // Custom Role Management State
  const [newRole, setNewRole] = useState({ name: "", color: "blue", description: "" });
  
  // Member Edit Modal State
  const [editMemberModal, setEditMemberModal] = useState<{
    isOpen: boolean;
    member: any;
  } | null>(null);
  const [tempDesignation, setTempDesignation] = useState("");
  const [tempRoleId, setTempRoleId] = useState("");
  const [tempSystemRole, setTempSystemRole] = useState("employee");
  
  // Request Decision Modal State
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    type: 'role' | 'workspace';
    id: string; // requestId
    action: 'approve' | 'reject';
    userName: string;
    targetName: string; // Role name or Workspace name
  } | null>(null);
  
  // Dropdown UI State (for custom select inside modal)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // ----------------------------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------------------------
  const members = useQuery(api.companies.getMembers, { companyId });
  const workspaces = useQuery(api.workspaces.getByCompany, { companyId });
  const roles = useQuery(api.roles.getRoles, { companyId });
  
  const roleRequests = useQuery(api.roles.getRequests, { companyId });
  const workspaceRequests = useQuery(api.workspaces.getRequests, { companyId });
  
  const workspaceMembers = useQuery(
    api.workspaces.getMembers, 
    selectedWorkspaceId ? { workspaceId: selectedWorkspaceId as any } : "skip"
  );

  // ----------------------------------------------------------------------
  // MUTATIONS
  // ----------------------------------------------------------------------
  const updateStatus = useMutation(api.companies.updateMemberStatus);
  const updateMemberProfile = useMutation(api.companies.updateMemberProfile);
  const removeMember = useMutation(api.companies.removeMember);
  
  const createWorkspace = useMutation(api.workspaces.create);
  const deleteWorkspace = useMutation(api.workspaces.deleteWorkspace);
  const addWorkspaceMember = useMutation(api.workspaces.addMember);
  const updateWorkspaceRole = useMutation(api.workspaces.updateRole);
  const updateWorkspaceHead = useMutation(api.workspaces.updateHead);
  const removeWorkspaceMember = useMutation(api.workspaces.removeMember);
  const resolveWsRequest = useMutation(api.workspaces.resolveAccessRequest);

  const createRole = useMutation(api.roles.createRole);
  const deleteRole = useMutation(api.roles.deleteRole);
  const resolveRoleRequest = useMutation(api.roles.resolveRequest);

  // ----------------------------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------------------------

  const confirmRemoval = async () => {
    if (memberToRemove) {
      if (memberToRemove.user?.clerkId === clerkUser?.id) {
        alert("Security Violation: Super-Admin cannot self-terminate.");
        setMemberToRemove(null);
        return;
      }
      try {
        await removeMember({ memberId: memberToRemove._id });
        setMemberToRemove(null);
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      await createWorkspace({ companyId, name: newWorkspaceName });
      setIsCreateWorkspaceOpen(false);
      setNewWorkspaceName("");
    } catch (e: any) {
      alert("Provisioning Failed: " + e.message);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    try {
        await deleteWorkspace({ workspaceId: workspaceToDelete.id });
        setWorkspaceToDelete(null);
        if (selectedWorkspaceId === workspaceToDelete.id) setSelectedWorkspaceId(null);
    } catch (e: any) {
        alert("Deletion Failed: " + e.message);
    }
  }

  const openEditModal = (member: any) => {
    setTempDesignation(member.designation || "");
    setTempRoleId(member.roleId || "");
    setTempSystemRole(member.role || "employee");
    setEditMemberModal({ isOpen: true, member });
    setActiveDropdown(null);
  };

  const saveMemberProfile = async () => {
    if (!editMemberModal) return;
    try {
      await updateMemberProfile({
        memberId: editMemberModal.member._id,
        designation: tempDesignation,
        roleId: tempRoleId === "" ? undefined : (tempRoleId as any),
        role: tempSystemRole as "admin" | "employee"
      });
      setEditMemberModal(null);
    } catch (e: any) {
      alert("Update failed: " + e.message);
    }
  };

  const handleAddToWorkspace = async (userId: any, role: "admin" | "member") => {
    if (!selectedWorkspaceId) return;
    try {
      await addWorkspaceMember({ workspaceId: selectedWorkspaceId as any, userId, role });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdateWsHead = async (userId: string) => {
    if (!selectedWorkspaceId) return;
    try {
        await updateWorkspaceHead({ workspaceId: selectedWorkspaceId as any, userId: userId as any });
        alert("Workspace Head updated successfully.");
    } catch(e: any) {
        alert(e.message);
    }
  }

  const handleCreateRole = async () => {
    if(!newRole.name) return;
    try {
      await createRole({ companyId, ...newRole });
      setNewRole({ name: "", color: "blue", description: "" });
    } catch (e: any) {
      alert(e.message);
    }
  }

  // --- NEW: Decision Handling ---
  const initiateDecision = (
    type: 'role' | 'workspace', 
    id: string, 
    action: 'approve' | 'reject', 
    userName: string, 
    targetName: string
  ) => {
    setDecisionModal({ isOpen: true, type, id, action, userName, targetName });
  };

  const confirmDecision = async () => {
    if (!decisionModal) return;
    
    try {
      const isApproved = decisionModal.action === 'approve';
      
      if (decisionModal.type === 'role') {
        await resolveRoleRequest({ requestId: decisionModal.id as Id<"roleRequests">, approved: isApproved });
      } else {
        await resolveWsRequest({ requestId: decisionModal.id as Id<"workspaceRequests">, approved: isApproved });
      }
      setDecisionModal(null);
    } catch (e: any) {
      alert("Processing failed: " + e.message);
    }
  };

  if (!members || !workspaces || !roles || !roleRequests || !workspaceRequests) return (
    <div className="flex items-center justify-center h-[70vh]">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  );

  const pendingMembers = members.filter(m => m.status === "pending");
  const activeMembers = members.filter(m => m.status === "active");
  const pendingRequestCount = roleRequests.length + workspaceRequests.filter(r => r.status === 'pending').length + pendingMembers.length;

  // ----------------------------------------------------------------------
  // CUSTOM DROPDOWN COMPONENT (Internal)
  // ----------------------------------------------------------------------
  const CustomDropdown = ({ label, value, options, onChange, id, disabled = false }: any) => {
    const isOpen = activeDropdown === id;
    const selectedLabel = options.find((o: any) => o.value === value)?.label || "Select...";

    return (
      <div className="relative">
        <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1 mb-1 block">{label}</label>
        <button 
          onClick={() => !disabled && setActiveDropdown(isOpen ? null : id)}
          className={`w-full text-left px-3 py-2.5 rounded-xl border bg-background flex items-center justify-between transition-all ${
            isOpen ? 'border-accent ring-2 ring-accent/10' : 'border-border hover:border-accent/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className="text-sm font-medium text-foreground truncate">{selectedLabel}</span>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-2 p-1 bg-background border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
            {options.map((opt: any) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setActiveDropdown(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group ${
                  value === opt.value ? 'bg-accent/10 text-accent' : 'hover:bg-foreground/5 text-foreground'
                }`}
              >
                {opt.label}
                {value === opt.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const selectedWorkspace = workspaces.find(w => w._id === selectedWorkspaceId);

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans" onClick={() => { /* Close dropdowns if clicking background? Optional polish */ }}>
      
      {/* ---------------------------------------------------------------------- */}
      {/* WORKSPACE DELETE MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {workspaceToDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="glass-panel max-w-sm w-full p-8 rounded-[32px] shadow-2xl border-red-500/20 bg-background animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-red-500/20">
              <Trash2 className="text-red-600 w-8 h-8" />
            </div>
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold mb-2 text-foreground tracking-tight">Destroy Environment?</h3>
              <p className="text-muted text-sm leading-relaxed px-2 font-normal">
                Permamently delete <span className="font-bold text-foreground">{workspaceToDelete.name}</span> and all its data? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setWorkspaceToDelete(null)} 
                className="flex-1 py-3 rounded-xl bg-foreground/5 font-semibold text-xs uppercase tracking-wider border border-border cursor-pointer hover:bg-foreground/10"
              >
                Abort
              </button>
              <button 
                onClick={handleDeleteWorkspace} 
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 cursor-pointer hover:bg-red-700"
              >
                Destroy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* DECISION CONFIRMATION MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {decisionModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="glass-panel max-w-sm w-full p-8 rounded-[32px] shadow-2xl border-border bg-background animate-in zoom-in duration-200">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto border ${decisionModal.action === 'approve' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
              {decisionModal.action === 'approve' ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
            </div>
            
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold mb-2 text-foreground tracking-tight">Confirm Decision</h3>
              <p className="text-muted text-sm leading-relaxed px-2 font-normal">
                Are you sure you want to <strong>{decisionModal.action.toUpperCase()}</strong> the request for <span className="font-bold text-foreground">{decisionModal.userName || "Unknown User"}</span> to access <span className="text-accent">{decisionModal.targetName || "Unknown Target"}</span>?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDecisionModal(null)} 
                className="flex-1 py-3 rounded-xl bg-foreground/5 font-semibold text-xs uppercase tracking-wider border border-border cursor-pointer hover:bg-foreground/10"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDecision} 
                className={`flex-1 py-3 rounded-xl text-white font-semibold text-xs uppercase tracking-wider shadow-lg cursor-pointer ${
                  decisionModal.action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL (Styled Dropdowns) */}
      {editMemberModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="glass-panel max-w-sm w-full p-8 rounded-[32px] shadow-2xl border-border bg-background animate-in zoom-in duration-200">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground">Edit Member Profile</h3>
              <p className="text-sm text-muted mt-1">Assign roles and designations.</p>
            </div>
            
            <div className="space-y-5">
              {/* Custom Role Dropdown */}
              <CustomDropdown 
                id="role-dropdown"
                label="Custom Role"
                value={tempRoleId}
                onChange={setTempRoleId}
                options={[
                  { value: "", label: "No Custom Role" },
                  ...roles?.map(r => ({ value: r._id, label: r.name })) || []
                ]}
              />

              {/* System Role Dropdown */}
              <CustomDropdown 
                id="system-role-dropdown"
                label="System Permission"
                value={tempSystemRole}
                onChange={setTempSystemRole}
                disabled={editMemberModal.member.user?.clerkId === clerkUser?.id}
                options={[
                  { value: "employee", label: "Employee (Standard Access)" },
                  { value: "admin", label: "Admin (Full Control)" }
                ]}
              />

              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Designation Title</label>
                <input 
                  className="input-field mt-1" 
                  value={tempDesignation} 
                  onChange={(e) => setTempDesignation(e.target.value)} 
                  placeholder="e.g. Senior Architect" 
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setEditMemberModal(null)} 
                  className="flex-1 py-3 rounded-xl bg-foreground/5 font-semibold text-xs uppercase tracking-wider border border-border cursor-pointer hover:bg-foreground/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveMemberProfile} 
                  className="flex-1 py-3 rounded-xl bg-accent text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-accent/20 cursor-pointer hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-3 h-3" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Removal Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="glass-panel max-w-sm w-full p-8 rounded-[32px] shadow-2xl border-red-500/20 bg-background animate-in zoom-in duration-200">
             <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-red-500/20">
              <AlertTriangle className="text-red-600 w-8 h-8" />
            </div>
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold mb-2 text-foreground tracking-tight">Terminate Identity?</h3>
              <p className="text-muted text-sm leading-relaxed px-2 font-normal">
                Revoke all access for <span className="font-bold text-foreground">{memberToRemove.user?.name}</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMemberToRemove(null)} className="flex-1 py-3 rounded-xl bg-foreground/5 font-semibold text-xs uppercase tracking-wider border border-border cursor-pointer hover:bg-foreground/10">Abort</button>
              <button onClick={confirmRemoval} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 cursor-pointer hover:bg-red-700">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {isCreateWorkspaceOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="glass-panel max-w-md w-full p-8 rounded-[32px] shadow-2xl border-border bg-background animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Provision Environment</h3>
              <button onClick={() => setIsCreateWorkspaceOpen(false)}><X className="w-5 h-5 text-muted hover:text-foreground cursor-pointer" /></button>
            </div>
            <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Environment Name</label>
                 <input className="input-field mt-1" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="e.g. Legal Department" autoFocus />
               </div>
               <button onClick={handleCreateWorkspace} className="apple-button w-full mt-4 justify-center shadow-lg shadow-accent/20 cursor-pointer">Provision Node</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* HEADER & NAVIGATION */}
      {/* ---------------------------------------------------------------------- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-wider mb-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Kernel Level: Restricted
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground leading-none">Governance</h1>
          <p className="text-muted font-medium text-sm mt-2">Axovanth Organizational Integrity Protocols</p>
        </div>
        
        {/* Tab Switcher - Responsive Scroll */}
        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          <div className="flex items-center gap-1 bg-foreground/5 p-1.5 rounded-2xl min-w-max">
            <button 
              onClick={() => setActiveTab('hierarchy')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${activeTab === 'hierarchy' ? 'bg-background shadow-md text-foreground' : 'text-muted hover:text-foreground hover:bg-foreground/5'}`}
            >
              <Users className="w-4 h-4" /> Hierarchy
            </button>
            <button 
              onClick={() => setActiveTab('workspaces')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${activeTab === 'workspaces' ? 'bg-background shadow-md text-foreground' : 'text-muted hover:text-foreground hover:bg-foreground/5'}`}
            >
              <Building className="w-4 h-4" /> Workspaces
            </button>
            <button 
              onClick={() => setActiveTab('roles')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${activeTab === 'roles' ? 'bg-background shadow-md text-foreground' : 'text-muted hover:text-foreground hover:bg-foreground/5'}`}
            >
              <UserCog className="w-4 h-4" /> Roles
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${activeTab === 'requests' ? 'bg-background shadow-md text-foreground' : 'text-muted hover:text-foreground hover:bg-foreground/5'}`}
            >
              <Inbox className="w-4 h-4" /> 
              Inbox
              {pendingRequestCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px]">{pendingRequestCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 1: HIERARCHY */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-bold flex items-center gap-3 text-muted uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-accent" /> Identity Matrix ({activeMembers.length})
              </h2>
            </div>
            
            {/* MOBILE CARD VIEW */}
            <div className="md:hidden space-y-4">
              {activeMembers.map((m) => {
                const isSelf = m.user?.clerkId === clerkUser?.id;
                return (
                  <div key={m._id} className="glass-panel p-5 rounded-2xl border-border bg-background">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-foreground/5 rounded-xl flex items-center justify-center font-bold text-sm border border-border text-muted">
                        {m.user?.name.substring(0, 1)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground tracking-tight">{m.user?.name}</p>
                        <p className="text-[10px] text-muted">{m.user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${m.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {m.role}
                         </span>
                         {m.roleName && (
                            <span className="px-2 py-0.5 rounded-md bg-foreground/5 text-foreground text-[10px] font-bold uppercase">
                              {m.roleName}
                            </span>
                         )}
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => openEditModal(m)} className="p-2 bg-foreground/5 rounded-lg hover:bg-accent/10 hover:text-accent transition-all cursor-pointer">
                            <Edit2 className="w-4 h-4" />
                         </button>
                         {!isSelf && (
                            <button onClick={() => setMemberToRemove(m)} className="p-2 bg-red-500/5 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer">
                              <UserMinus className="w-4 h-4" />
                            </button>
                         )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block glass-panel rounded-[32px] border-border shadow-sm bg-background overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-foreground/[0.02] border-b border-border">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-bold text-muted uppercase tracking-wider">Identity</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-muted uppercase tracking-wider">Role Info</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-muted uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeMembers.map((m) => {
                    const isSelf = m.user?.clerkId === clerkUser?.id;
                    return (
                      <tr key={m._id} className={`hover:bg-foreground/5 transition-all group ${isSelf ? 'bg-accent/[0.02]' : ''}`}>
                        
                        <td className="px-8 py-5 flex items-center gap-4">
                          <div className="relative">
                            <div className="w-10 h-10 bg-foreground/5 rounded-xl flex items-center justify-center font-bold text-sm border border-border text-muted">
                              {m.user?.name.substring(0, 1)}
                            </div>
                            {isSelf && <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-background flex items-center justify-center"><Info className="w-1.5 h-1.5 text-white" /></div>}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground tracking-tight">{m.user?.name}</p>
                            <p className="text-[10px] text-muted">{m.user?.email}</p>
                          </div>
                        </td>

                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${m.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {m.role}
                            </span>
                            {m.roleName && (
                              <span className="px-2 py-0.5 rounded-md bg-foreground/5 text-foreground text-[10px] font-bold uppercase">
                                {m.roleName}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                          <button onClick={() => openEditModal(m)} className="p-2.5 bg-foreground/5 rounded-lg hover:bg-accent/10 hover:text-accent transition-all cursor-pointer">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isSelf ? (
                            <button onClick={() => setMemberToRemove(m)} className="p-2.5 bg-red-500/5 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"><UserMinus className="w-4 h-4" /></button>
                          ) : (
                            <div className="p-2.5 bg-foreground/5 text-muted rounded-lg cursor-not-allowed opacity-30 inline-block"><Lock className="w-4 h-4" /></div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 2: WORKSPACES */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'workspaces' && (
        <section className="space-y-6 animate-in fade-in duration-500">
          <h2 className="text-xs font-bold flex items-center gap-3 text-muted uppercase tracking-wider px-2">
             <Building className="w-4 h-4 text-accent" /> Departmental Access Control
          </h2>
          
          <div className="grid lg:grid-cols-12 gap-8">
             <div className="lg:col-span-4 space-y-4">
                <button 
                  onClick={() => setIsCreateWorkspaceOpen(true)}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
                >
                   <Plus className="w-6 h-6 text-muted group-hover:text-accent" />
                   <span className="text-xs font-bold text-muted group-hover:text-accent uppercase tracking-wider">Provision Env</span>
                </button>
                
                <div className="space-y-2 max-h-[300px] lg:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {workspaces.map(ws => {
                    const WsIcon = WorkspaceIconMap[ws.emoji] || Layers; // Dynamic Icon Rendering
                    return (
                      <div key={ws._id} className="relative group">
                        <button 
                          onClick={() => setSelectedWorkspaceId(ws._id)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                            selectedWorkspaceId === ws._id 
                            ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                            : 'bg-background border-border hover:border-accent/50 text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <WsIcon className="w-5 h-5" />
                            <span className="font-bold text-sm">{ws.name}</span>
                          </div>
                          {selectedWorkspaceId === ws._id && <ChevronDown className="w-4 h-4 -rotate-90" />}
                        </button>
                        
                        {/* DELETE BUTTON - Only shows if not default */}
                        {!ws.isDefault && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setWorkspaceToDelete({ id: ws._id, name: ws.name }); }}
                            className="absolute top-1/2 -right-10 -translate-y-1/2 p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 group-hover:right-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
             </div>

             <div className="lg:col-span-8 glass-panel rounded-[32px] p-6 lg:p-8 border-border bg-background min-h-[400px]">
                {!selectedWorkspaceId ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 gap-4">
                     <LayoutGrid className="w-12 h-12 text-muted" />
                     <p className="text-sm font-medium text-muted">Select a department node to configure access.</p>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in duration-300">
                     <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Member Roster</h3>
                          <p className="text-xs text-muted font-medium mt-1">Configure access levels for this environment.</p>
                        </div>
                        
                        {/* WORKSPACE HEAD ASSIGNMENT */}
                        <div className="w-full md:w-64">
                            <CustomDropdown 
                                id="head-assignment"
                                label="Workspace Head"
                                value={selectedWorkspace?.workspaceHeadId}
                                onChange={(val: string) => handleUpdateWsHead(val)}
                                options={workspaceMembers?.map((m: any) => ({ value: m.userId, label: m.user?.name })) || []}
                            />
                        </div>
                     </div>

                     <div className="space-y-4">
                       {workspaceMembers === undefined ? (
                         <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
                       ) : workspaceMembers.length === 0 ? (
                         <p className="text-center text-sm text-muted italic py-10">No members assigned to this node.</p>
                       ) : (
                         workspaceMembers.map((wm: any) => (
                           <div key={wm._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-foreground/5 rounded-2xl border border-border gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center font-bold text-xs border border-border">
                                  {wm.user?.name.substring(0, 1)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">{wm.user?.name}</p>
                                    {selectedWorkspace?.workspaceHeadId === wm.userId && (
                                        <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Head</span>
                                    )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 justify-end">
                                 <button 
                                   onClick={() => updateWorkspaceRole({ memberId: wm._id, role: wm.role === 'admin' ? 'member' : 'admin' })}
                                   className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                                     wm.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-muted/10 text-muted hover:bg-muted/20'
                                   }`}
                                 >
                                   {wm.role}
                                 </button>
                                 <button 
                                   onClick={() => removeWorkspaceMember({ memberId: wm._id })}
                                   className="p-2 hover:bg-background rounded-lg text-muted hover:text-red-500 transition-colors cursor-pointer"
                                 >
                                   <X className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                         ))
                       )}

                       <div className="pt-6 border-t border-border mt-8">
                          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-4">Quick Add from Organization</p>
                          <div className="flex flex-wrap gap-2">
                             {activeMembers
                               .filter(am => !workspaceMembers?.some((wm: any) => wm.userId === am.userId))
                               .map(am => (
                                 <button 
                                   key={am._id}
                                   onClick={() => handleAddToWorkspace(am.userId, 'member')}
                                   className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl hover:border-accent hover:text-accent transition-all text-xs font-semibold group cursor-pointer"
                                 >
                                   <Plus className="w-3 h-3 text-muted group-hover:text-accent" />
                                   {am.user?.name}
                                 </button>
                               ))
                             }
                          </div>
                       </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 3: ROLES */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'roles' && (
        <section className="grid lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          <div className="glass-panel p-8 rounded-[32px] border-border bg-background space-y-6 h-fit">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <UserCog className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground">Define New Role</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Role Name</label>
                <input 
                  className="input-field mt-1" 
                  placeholder="e.g. Senior Developer" 
                  value={newRole.name} 
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Description</label>
                <textarea 
                  className="input-field mt-1 h-20 resize-none" 
                  placeholder="Responsibilities..." 
                  value={newRole.description} 
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Color Code</label>
                <div className="flex gap-2 mt-2">
                  {['blue', 'green', 'purple', 'orange', 'red'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setNewRole({...newRole, color: c})}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${newRole.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: `var(--color-${c}-500, ${c})` }} 
                    />
                  ))}
                </div>
              </div>

              <button 
                onClick={handleCreateRole} 
                disabled={!newRole.name}
                className="apple-button w-full justify-center mt-4"
              >
                Create Role Definitions
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider px-2">Active Role Definitions</h2>
            
            {roles.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-border rounded-[32px]">
                <p className="text-muted text-sm font-medium">No custom roles defined yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {roles.map(r => (
                  <div key={r._id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between border-border hover:border-accent/50 transition-all group min-h-[140px]">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-foreground text-lg">{r.name}</h4>
                        <button onClick={() => deleteRole({ roleId: r._id })} className="p-2 -mr-2 -mt-2 hover:bg-red-500/10 text-muted hover:text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-muted leading-relaxed line-clamp-2">{r.description || "No description provided."}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${r.color}-500`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{r.color} Tag</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 4: REQUEST INBOX */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'requests' && (
        <div className="grid gap-8 animate-in fade-in duration-500">
          
          {/* Section 1: Company Join Requests */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider flex gap-2 items-center px-2">
              <UserPlus className="w-4 h-4" /> Company Join Requests
            </h2>
            {pendingMembers.length === 0 ? (
              <div className="p-8 glass-panel rounded-2xl border-border text-center">
                <p className="text-sm text-muted italic">No pending company join requests.</p>
              </div>
            ) : (
              pendingMembers.map(m => (
                <div key={m._id} className="glass-panel p-4 rounded-xl flex justify-between items-center border-border hover:border-accent/30 transition-all">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-foreground/5 rounded-full flex items-center justify-center font-bold text-sm text-muted">
                      {m.user?.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {m.user?.name} <span className="font-normal text-muted">requests to join</span>
                      </p>
                      <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">{m.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => removeMember({ memberId: m._id })} className="px-4 py-2 bg-red-500/10 text-red-600 rounded-lg text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all">Decline</button>
                    <button onClick={() => updateStatus({ memberId: m._id, status: "active" })} className="px-4 py-2 bg-green-500/10 text-green-600 rounded-lg text-xs font-bold uppercase hover:bg-green-500 hover:text-white transition-all">Admit</button>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Section 2: Role Requests */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider flex gap-2 items-center px-2">
              <UserCog className="w-4 h-4" /> Role Assignment Requests
            </h2>
            {roleRequests.length === 0 ? (
              <div className="p-8 glass-panel rounded-2xl border-border text-center">
                <p className="text-sm text-muted italic">No pending role requests.</p>
              </div>
            ) : (
              roleRequests.map(r => (
                <div key={r._id} className="glass-panel p-4 rounded-xl flex justify-between items-center border-border hover:border-accent/30 transition-all">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-foreground/5 rounded-full flex items-center justify-center font-bold text-sm text-muted">
                      {r.user?.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {r.user?.name} <span className="font-normal text-muted">requests</span> <span className="text-accent">{r.role?.name}</span>
                      </p>
                      <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Submitted {new Date(r._creationTime).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => initiateDecision('role', r._id, 'reject', r.user?.name || "Unknown User", r.role?.name || "Unknown Role")} 
                      className="px-4 py-2 bg-red-500/10 text-red-600 rounded-lg text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => initiateDecision('role', r._id, 'approve', r.user?.name || "Unknown User", r.role?.name || "Unknown Role")} 
                      className="px-4 py-2 bg-green-500/10 text-green-600 rounded-lg text-xs font-bold uppercase hover:bg-green-500 hover:text-white transition-all"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Section 3: Workspace Access Requests */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider flex gap-2 items-center px-2">
              <Lock className="w-4 h-4" /> Workspace Access Requests
            </h2>
            {workspaceRequests.length === 0 ? (
              <div className="p-8 glass-panel rounded-2xl border-border text-center">
                <p className="text-sm text-muted italic">No pending workspace requests.</p>
              </div>
            ) : (
              workspaceRequests.map((r: any) => (
                <div key={r._id} className="glass-panel p-4 rounded-xl flex justify-between items-center border-border hover:border-accent/30 transition-all">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-foreground/5 rounded-full flex items-center justify-center font-bold text-sm text-muted">
                      {r.user?.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {r.user?.name} <span className="font-normal text-muted">requests access to</span> <span className="text-accent">{r.workspaceName || "Unknown Workspace"}</span>
                      </p>
                      <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Submitted {new Date(r._creationTime).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => initiateDecision('workspace', r._id, 'reject', r.user?.name || "Unknown User", r.workspaceName || "Unknown Workspace")} 
                      className="px-4 py-2 bg-red-500/10 text-red-600 rounded-lg text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => initiateDecision('workspace', r._id, 'approve', r.user?.name || "Unknown User", r.workspaceName || "Unknown Workspace")} 
                      className="px-4 py-2 bg-green-500/10 text-green-600 rounded-lg text-xs font-bold uppercase hover:bg-green-500 hover:text-white transition-all"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

        </div>
      )}
    </div>
  );
}