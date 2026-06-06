import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import type { ReactNode } from "react";
import SideBar from "./layout/SideBar";
import MessagingPage from "./pages/MessagingPage";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SignupSuccessPage from "./pages/SignupSuccessPage";
import InvitationsPage from "./pages/InvitationsPage";
import SubcontractorAcceptPage from "./pages/SubcontractorAcceptPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import WorkerManagementPage from "./pages/WorkerManagementPage";
import WorkpointPage from "./pages/WorkpointPage";
import WorkpointDetailPage from "./pages/WorkpointDetailPage";
import CheckinPage from "./pages/CheckinPage";
import LeaveCalendarPage from "./pages/LeaveCalendarPage";
import LiveFollowPage from "./pages/LiveFollowPage";
import WorkerHomePage from "./pages/WorkerHomePage";
import WorkerDocumentsPage from "./pages/WorkerDocumentsPage";
import ScanPage from "./pages/ScanPage";
import { useAuth } from "./hooks/useAuth";
import type { UserRole } from "./types/UserTypes";

function Home() {
    const { user } = useAuth();

    if (user?.role === "WORKER") {
        return <WorkerHomePage />;
    }

    return <RequireRoles roles={["ADMIN", "LEADER"]}>
        <WorkpointPage />
    </RequireRoles>;
}

function RequireRoles({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
    const { user } = useAuth();

    if (!user || !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

function LoginRedirect() {
    const location = useLocation();
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
}

function PublicRootRoute() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    if (searchParams.get("token")) {
        return <Navigate to={`/register${location.search}`} replace />;
    }

    return <LandingPage />;
}

function AuthenticatedRoutes() {
    const location = useLocation();
    const isDisplayRoute = location.pathname === "/live-follow/display";

    const routes = (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/messages" element={<MessagingPage />} />
            <Route
                path="/live-follow"
                element={
                    <RequireRoles roles={["ADMIN", "LEADER"]}>
                        <LiveFollowPage />
                    </RequireRoles>
                }
            />
            <Route
                path="/live-follow/display"
                element={
                    <RequireRoles roles={["ADMIN", "LEADER"]}>
                        <LiveFollowPage displayMode="fullscreen" />
                    </RequireRoles>
                }
            />
            <Route
                path="/leave-calendar"
                element={
                    <RequireRoles roles={["ADMIN", "LEADER", "WORKER"]}>
                        <LeaveCalendarPage />
                    </RequireRoles>
                }
            />
            <Route
                path="/documents"
                element={
                    <RequireRoles roles={["WORKER"]}>
                        <WorkerDocumentsPage />
                    </RequireRoles>
                }
            />
            <Route
                path="/scan"
                element={
                    <RequireRoles roles={["WORKER"]}>
                        <ScanPage />
                    </RequireRoles>
                }
            />
            <Route
                path="/workpoints"
                element={
                    <RequireRoles roles={["ADMIN", "LEADER"]}>
                        <WorkpointPage />
                    </RequireRoles>
                }
            />
            <Route
                path="/workpoints/:id"
                element={
                    <RequireRoles roles={["ADMIN", "LEADER"]}>
                        <WorkpointDetailPage />
                    </RequireRoles>
                }
            />
            <Route path="/checkin/:qrToken" element={<CheckinPage />} />
            <Route
                path="/subcontractors/accept"
                element={
                    <RequireRoles roles={["ADMIN"]}>
                        <SubcontractorAcceptPage />
                    </RequireRoles>
                }
            />
            <Route
                path="/invitations"
                element={
                    <RequireRoles roles={["ADMIN", "LEADER"]}>
                        <InvitationsPage />
                    </RequireRoles>
                }
            />
            <Route
                path="/workers"
                element={
                    <RequireRoles roles={["ADMIN", "LEADER"]}>
                        <WorkerManagementPage />
                    </RequireRoles>
                }
            />
            <Route
                path="/billing"
                element={
                    <RequireRoles roles={["ADMIN"]}>
                        <Navigate to="/settings" replace />
                    </RequireRoles>
                }
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register/*" element={<Navigate to="/" replace />} />
            <Route path="/register/success" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );

    if (isDisplayRoute) {
        return routes;
    }

    return <SideBar>{routes}</SideBar>;
}

function App() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    return (
        <Router>
            {isAuthenticated ? (
                <AuthenticatedRoutes />
            ) : (
                <Routes>
                    <Route path="/" element={<PublicRootRoute />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/register/*" element={<Register />} />
                    <Route path="/register/success" element={<SignupSuccessPage />} />
                    <Route path="/checkin/:qrToken" element={<CheckinPage />} />
                    <Route path="/subcontractors/accept" element={<LoginRedirect />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            )}
        </Router>
    );
}

export default App;
