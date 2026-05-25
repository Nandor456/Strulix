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
    useSidebar,
} from "@/components/ui/sidebar"
import buildPulseLogo from "@/assets/buildpulselogo.png";
import {
    Building2,
    FileText,
    Home as HomeIcon,
    MessageSquare,
    Users,
    ChevronDown,
    ChevronsUpDown,
    Moon,
    Sun,
    LogOut,
    QrCode,
    Languages,
    Mail,
    BadgeCheck,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useThemeMode } from "@/theme/useThemeMode";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { APP_LANGUAGES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function getUserInitials(username?: string) {
    return username?.slice(0, 2).toUpperCase() || "BP";
}

function getRoleLabel(role?: string) {
    if (role === "ADMIN") return "Admin";
    if (role === "LEADER") return "Leader";
    if (role === "WORKER") return "Worker";
    return role ?? "";
}

export function AppSidebar() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { isMobile } = useSidebar();
    const { mode, toggleMode } = useThemeMode();
    const { language, setLanguage, t } = useI18n();
    const isDarkMode = mode === "dark";

    const canManageWorkPoints = user?.role === "ADMIN" || user?.role === "LEADER";
    const canManageUsers = user?.role === "ADMIN" || user?.role === "LEADER";
    const canViewWorkers = user?.role === "ADMIN" || user?.role === "LEADER";
    const isWorker = user?.role === "WORKER";
    const isUsersRoute =
        canViewWorkers &&
        (location.pathname.startsWith("/invitations") || location.pathname.startsWith("/workers"));

    return (
        <Sidebar collapsible="icon">
            {/* ── Header ───────────────────────────────────────────── */}
            <SidebarHeader className="border-b border-sidebar-border px-3 py-3.5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-2.5">
                            {/* Brand icon mark */}
                            <img
                                src={buildPulseLogo}
                                alt="BuildPulse"
                                className="h-12 w-12 rounded"
                            />
                            {/* Name + tagline – hidden when collapsed */}
                            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                                <span className="text-[13.5px] font-semibold leading-tight tracking-tight">
                                    BuildPulse
                                </span>
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
                            to="/messages"
                            label={t("Messages")}
                            icon={<MessageSquare className="h-4 w-4" />}
                            active={location.pathname.startsWith("/messages")}
                        />

                        {canManageWorkPoints && (
                            <NavItem
                                to="/workpoints"
                                label={t("Workpoints")}
                                icon={<Building2 className="h-4 w-4" />}
                                active={location.pathname.startsWith("/workpoints")}
                            />
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
            </SidebarContent>

            {/* ── Footer / User ─────────────────────────────────────── */}
            <SidebarFooter className="border-t border-sidebar-border px-2 py-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className={cn(
                                        "h-auto gap-2.5 rounded-lg px-2 py-2",
                                        "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                                    )}
                                >
                                    {/* Square-rounded avatar matching brand logo style */}
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
                                            {getRoleLabel(user?.role)}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={6}
                            >
                                {/* User info header */}
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2.5 px-2 py-2">
                                        <Avatar className="h-8 w-8 rounded-lg shrink-0">
                                            <AvatarFallback className="rounded-lg bg-blue-100 text-blue-700 text-[11px] font-medium dark:bg-blue-950 dark:text-blue-300">
                                                {getUserInitials(user?.username)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left leading-tight">
                                            <span className="truncate text-[13px] font-medium">
                                                {user?.username}
                                            </span>
                                            <span className="truncate text-[11px] text-muted-foreground">
                                                {user?.email}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>

                                <DropdownMenuSeparator />

                                {/* Language picker */}
                                <DropdownMenuGroup>
                                    <div className="px-2 py-1.5">
                                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                            <Languages className="h-3.5 w-3.5" />
                                            <span>{t("Change language")}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {APP_LANGUAGES.map((value) => {
                                                const isActive = language === value;
                                                return (
                                                    <Button
                                                        key={value}
                                                        type="button"
                                                        size="sm"
                                                        variant={isActive ? "secondary" : "ghost"}
                                                        className={cn(
                                                            "h-7 min-w-10 flex-1 rounded-md px-0 text-[11px] uppercase font-medium",
                                                            !isActive && "text-muted-foreground",
                                                        )}
                                                        aria-pressed={isActive}
                                                        onClick={() => setLanguage(value)}
                                                    >
                                                        {value}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <DropdownMenuSeparator />

                                    {/* Theme toggle */}
                                    <DropdownMenuItem onSelect={toggleMode}>
                                        {isDarkMode ? (
                                            <Sun className="h-4 w-4" />
                                        ) : (
                                            <Moon className="h-4 w-4" />
                                        )}
                                        {isDarkMode ? t("Light theme") : t("Dark theme")}
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onSelect={() => {
                                        if (!window.confirm(t("Are you sure you want to log out?"))) return;
                                        void logout();
                                    }}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t("Log out")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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