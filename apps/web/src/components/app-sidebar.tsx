import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import buildPulseLogo from "@/assets/buildpulselogo.png";
import {
    Activity,
    Building2,
    CalendarDays,
    FileText,
    Home as HomeIcon,
    MessageSquare,
    Users,
    ChevronDown,
    LogOut,
    QrCode,
    Mail,
    BadgeCheck,
    Settings,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isBillingActive } from "@/lib/billing";

function getUserInitials(username?: string) {
    return username?.slice(0, 2).toUpperCase() || "BP";
}

export function AppSidebar() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { t, roleLabel } = useI18n();

    const canManageWorkPoints = user?.role === "ADMIN" || user?.role === "LEADER";
    const canManageUsers = user?.role === "ADMIN" || user?.role === "LEADER";
    const canViewWorkers = user?.role === "ADMIN" || user?.role === "LEADER";
    const canManageBilling = user?.role === "ADMIN";
    const hasInactiveBilling =
        canManageBilling && !isBillingActive(user?.company.billingStatus);
    const isWorker = user?.role === "WORKER";
    const isUsersRoute =
        canViewWorkers &&
        (location.pathname.startsWith("/invitations") || location.pathname.startsWith("/workers"));

    return (
        <Sidebar collapsible="icon">
            {/* ── Header ───────────────────────────────────────────── */}
            <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-3">
                            <img
                                src={buildPulseLogo}
                                alt={t("BuildPulse")}
                                className="relative h-8 w-8 rounded-xl ring-1 ring-white/10"
                            />

                            {/* Name + tagline */}
                            <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">
                                        {t("BuildPulse")}
                                    </span>

                                </div>
                            </div>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* ── Nav ──────────────────────────────────────────────── */}
            <SidebarContent className="px-2 py-2">
                <SidebarGroup className="p-0">
                    <SidebarMenu className="gap-0.5">
                        {isWorker && (
                            <>
                                <NavItem
                                    to="/"
                                    label={t("Home")}
                                    icon={<HomeIcon className="h-4 w-4" />}
                                    active={location.pathname === "/"}
                                />
                                <NavItem
                                    to="/documents"
                                    label={t("Documents")}
                                    icon={<FileText className="h-4 w-4" />}
                                    active={location.pathname.startsWith("/documents")}
                                />
                                <NavItem
                                    to="/scan"
                                    label={t("Scan QR")}
                                    icon={<QrCode className="h-4 w-4" />}
                                    active={location.pathname.startsWith("/scan")}
                                />
                            </>
                        )}

                        <NavItem
                            to="/leave-calendar"
                            label={t("Leave Calendar")}
                            icon={<CalendarDays className="h-4 w-4" />}
                            active={location.pathname.startsWith("/leave-calendar")}
                        />

                        <NavItem
                            to="/messages"
                            label={t("Messages")}
                            icon={<MessageSquare className="h-4 w-4" />}
                            active={location.pathname.startsWith("/messages")}
                        />

                        {canManageWorkPoints && (
                            <>
                                <NavItem
                                    to="/live-follow"
                                    label={t("Live Follow")}
                                    icon={<Activity className="h-4 w-4" />}
                                    active={location.pathname.startsWith("/live-follow")}
                                />
                                <NavItem
                                    to="/workpoints"
                                    label={t("Workpoints")}
                                    icon={<Building2 className="h-4 w-4" />}
                                    active={location.pathname.startsWith("/workpoints")}
                                />
                            </>
                        )}

                    </SidebarMenu>
                </SidebarGroup>

                {/* ── Team section ───────────────────────────────────── */}
                {canViewWorkers && (
                    <>
                        {/* Section label – hidden when collapsed */}
                        <p className="mt-3 mb-1 px-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground group-data-[collapsible=icon]:hidden">
                            {t("Team")}
                        </p>
                        {/* Thin rule shown only when collapsed */}
                        <div className="my-2 hidden border-t border-sidebar-border group-data-[collapsible=icon]:block" />

                        <SidebarGroup className="p-0">
                            <SidebarMenu className="gap-0.5">
                                <Collapsible
                                    asChild
                                    defaultOpen={isUsersRoute}
                                    className="group/collapsible"
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                isActive={isUsersRoute}
                                                className={cn(
                                                    "relative h-8 gap-2.5 rounded-md px-2 text-[13px] font-normal text-muted-foreground",
                                                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                    "transition-colors duration-100",
                                                    isUsersRoute && [
                                                        "bg-blue-50 text-blue-600 font-medium",
                                                        "dark:bg-blue-950/40 dark:text-blue-400",
                                                        "before:absolute before:left-0 before:top-1.5 before:bottom-1.5",
                                                        "before:w-[3px] before:rounded-r-full before:bg-blue-600",
                                                        "dark:before:bg-blue-400",
                                                    ],
                                                )}
                                            >
                                                <Users
                                                    className={cn(
                                                        "h-4 w-4 shrink-0",
                                                        isUsersRoute
                                                            ? "text-blue-600 dark:text-blue-400"
                                                            : "text-muted-foreground",
                                                    )}
                                                />
                                                <span className="flex-1">{t("Users")}</span>
                                                <ChevronDown className="ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent>
                                            <SidebarMenuSub className="ml-5 border-l border-sidebar-border pl-2.5 gap-0.5">
                                                {canManageUsers && (
                                                    <SidebarMenuSubItem>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={location.pathname.startsWith("/invitations")}
                                                            className={cn(
                                                                "flex items-center gap-2 h-7 rounded-md px-2 text-[12.5px]",
                                                                "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                                location.pathname.startsWith("/invitations") &&
                                                                "text-blue-600 font-medium dark:text-blue-400",
                                                            )}
                                                        >
                                                            <Link to="/invitations">
                                                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                                                {t("Invitations")}
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                )}
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={location.pathname.startsWith("/workers")}
                                                        className={cn(
                                                            "flex items-center gap-2 h-7 rounded-md px-2 text-[12.5px]",
                                                            "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                            location.pathname.startsWith("/workers") &&
                                                            "text-blue-600 font-medium dark:text-blue-400",
                                                        )}
                                                    >
                                                        <Link to="/workers">
                                                            <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                                                            {t("Worker management")}
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            </SidebarMenu>
                        </SidebarGroup>
                    </>
                )}

                {hasInactiveBilling && (
                    <div className="mt-4 rounded-md border border-destructive/25 bg-destructive/10 p-3 text-xs leading-5 text-destructive group-data-[collapsible=icon]:hidden">
                        <p className="font-medium">{t("Billing attention needed")}</p>
                        <p className="mt-1 opacity-85">
                            {t("Operational changes are paused until billing is fixed.")}
                        </p>
                        <Button asChild size="sm" variant="outline" className="mt-3 h-8 w-full">
                            <Link to="/settings">{t("Manage billing")}</Link>
                        </Button>
                    </div>
                )}
            </SidebarContent>

            {/* ── Footer / User ─────────────────────────────────────── */}
            <SidebarFooter className="border-t border-sidebar-border px-2 py-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            size="lg"
                            isActive={location.pathname.startsWith("/settings")}
                            className={cn(
                                "h-auto gap-2.5 rounded-lg px-2 py-2",
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                location.pathname.startsWith("/settings") &&
                                "bg-sidebar-accent text-sidebar-accent-foreground",
                            )}
                        >
                            <Link to="/settings">
                                <Avatar className="h-7 w-7 rounded-lg shrink-0">
                                    <AvatarFallback className="rounded-lg bg-blue-100 text-blue-700 text-[11px] font-medium dark:bg-blue-950 dark:text-blue-300">
                                        {getUserInitials(user?.username)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate text-[12.5px] font-medium">
                                        {user?.username}
                                    </span>
                                    <span className="truncate text-[11px] text-muted-foreground">
                                        {user?.role ? roleLabel(user.role) : ""}
                                    </span>
                                </div>
                                <Settings className="ml-auto h-3.5 w-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="h-8 gap-2.5 rounded-md px-2 text-[13px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                                if (!window.confirm(t("Are you sure you want to log out?"))) return;
                                void logout();
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="group-data-[collapsible=icon]:hidden">{t("Log out")}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

/* ── Reusable nav item ────────────────────────────────────────────────── */
interface NavItemProps {
    to: string;
    label: string;
    icon: React.ReactNode;
    active: boolean;
}

function NavItem({ to, label, icon, active }: NavItemProps) {
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={active}
                className={cn(
                    "relative h-8 gap-2.5 rounded-md px-2 text-[13px] font-normal text-muted-foreground",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "transition-colors duration-100",
                    active && [
                        "bg-blue-50 text-blue-600 font-medium",
                        "dark:bg-blue-950/40 dark:text-blue-400",
                        "before:absolute before:left-0 before:top-1.5 before:bottom-1.5",
                        "before:w-[3px] before:rounded-r-full before:bg-blue-600",
                        "dark:before:bg-blue-400",
                    ],
                )}
            >
                <Link to={to}>
                    <span
                        className={cn(
                            "shrink-0",
                            active
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-muted-foreground",
                        )}
                    >
                        {icon}
                    </span>
                    <span>{label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
