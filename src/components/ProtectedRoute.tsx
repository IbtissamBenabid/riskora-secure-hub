import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useStore } from "@/store/StoreContext";
import type { Role } from "@/types";

interface Props {
  allow: Role[];
  children: ReactNode;
}

export function ProtectedRoute({ allow, children }: Props) {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!allow.includes(currentUser.role)) {
    if (currentUser.role === "supplier") return <Navigate to="/supplier/portal" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
