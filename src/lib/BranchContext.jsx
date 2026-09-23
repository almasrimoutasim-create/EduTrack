import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useAuth } from "@/lib/AuthContext";

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [activeBranchId, setActiveBranchIdState] = useState(() => {
    return localStorage.getItem("active_branch_id") || "all";
  });

  const schoolId = user?.school_id || localStorage.getItem("portal_school_id");

  // Fetch branches for this school
  const {
    data: branches = [],
    isLoading: isLoadingBranches,
    refetch: refetchBranches,
  } = useQuery({
    queryKey: ["school-branches", schoolId],
    queryFn: async () => {
      if (!schoolId && !user) return [];
      try {
        const list = await entities.SchoolBranch.list("-created_at", 100);
        return Array.isArray(list) ? list : [];
      } catch (err) {
        console.warn("Failed to fetch branches:", err);
        return [];
      }
    },
    enabled: Boolean(isAuthenticated && (schoolId || user?.role === "admin")),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Active branch object
  const activeBranch = useMemo(() => {
    if (activeBranchId === "all" || !activeBranchId) return null;
    return branches.find((b) => b.id === activeBranchId) || null;
  }, [branches, activeBranchId]);

  // Set active branch helper with query invalidation
  const setActiveBranchId = (id) => {
    const nextId = id || "all";
    setActiveBranchIdState(nextId);
    if (nextId === "all") {
      localStorage.removeItem("active_branch_id");
    } else {
      localStorage.setItem("active_branch_id", nextId);
    }
    // Invalidate queries so operational tables refresh for the active branch
    queryClient.invalidateQueries();
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        activeBranchId,
        activeBranch,
        setActiveBranchId,
        isLoadingBranches,
        refetchBranches,
        isConsolidated: activeBranchId === "all" || !activeBranchId,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    return {
      branches: [],
      activeBranchId: "all",
      activeBranch: null,
      setActiveBranchId: () => {},
      isLoadingBranches: false,
      refetchBranches: () => {},
      isConsolidated: true,
    };
  }
  return context;
}

export default BranchContext;
