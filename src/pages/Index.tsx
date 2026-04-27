import { Navigate } from "react-router-dom";
import { useStore } from "@/store/StoreContext";

const Index = () => {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === "supplier") return <Navigate to="/supplier/portal" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default Index;
