import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoutes = () => {
    const { accessToken } = useAuth();
    return accessToken ? <Outlet /> : <Navigate to="/auth/login" replace/>
}