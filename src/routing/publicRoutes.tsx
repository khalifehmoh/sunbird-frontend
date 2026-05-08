import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const PublicRoutes = () => {
    const { accessToken } = useAuth();
    return accessToken ? <Navigate to="/dashboard" replace/> : <Outlet />
}