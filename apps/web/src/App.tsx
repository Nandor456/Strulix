import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import type { ReactNode } from "react";
import SideBar from "./layout/SideBar";
import MessagingPage from "./pages/MessagingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import InvitationsPage from "./pages/InvitationsPage";
import WorkerManagementPage from "./pages/WorkerManagementPage";
import WorkpointPage from "./pages/WorkpointPage";
import WorkpointDetailPage from "./pages/WorkpointDetailPage";
import CheckinPage from "./pages/CheckinPage";
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

function App() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    return (
        <Router>
            {isAuthenticated ? (
                <SideBar>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/messages" element={<MessagingPage />} />
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
                        <Route path="/login" element={<Navigate to="/" replace />} />
                        <Route path="/register" element={<Navigate to="/" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </SideBar>
            ) : (
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/checkin/:qrToken" element={<CheckinPage />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            )}
        </Router>
    );
}

export default App;
