"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api"; // Corrected path (4 levels up)
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardIndex() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as any;

  // Fetch workspaces to determine where to redirect
  const workspaces = useQuery(api.workspaces.getByCompany, { companyId });

  useEffect(() => {
    if (workspaces) {
      // Prioritize the default "General" workspace, otherwise take the first one found
      const targetWs = workspaces.find((w) => w.isDefault) || workspaces[0];
      
      if (targetWs) {
        router.replace(`/dashboard/${companyId}/ws/${targetWs._id}`);
      }
    }
  }, [workspaces, companyId, router]);

  return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <p className="text-sm text-muted-foreground font-medium animate-pulse">
        Initializing Workspace Environment...
      </p>
    </div>
  );
}