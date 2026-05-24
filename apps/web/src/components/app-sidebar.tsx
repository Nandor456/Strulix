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
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { Building2, FileText, Home as HomeIcon, MessageSquare, Users, ChevronDown, ChevronsUpDown, Moon, Sun, LogOut, QrCode, Languages } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import buildPulseLogo from "@/assets/buildpulselogo.png";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
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

export function AppSidebar() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { isMobile } = useSidebar();
    const { mode, toggleMode } = useThemeMode();
    const { language, setLanguage, t } = useI18n();
    const isDarkMode = mode === "dark";
    const canManageWorkPoints = user?.role === "ADMIN" || user?.role === "LEADER";
    const canManageUsers = user?.role === "ADMIN";
    const canViewWorkers = user?.role === "ADMIN" || user?.role === "LEADER";
    const isWorker = user?.role === "WORKER";
    const isUsersRoute =
        canViewWorkers &&
        (location.pathname.startsWith("/invitations") || location.pathname.startsWith("/workers"));

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-2 py-1">
                            <img
                                src={buildPulseLogo}
                                alt="BuildPulse"
                                className="h-12 w-12 rounded"
                            />
                            <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
                                BuildPulse
                            </span>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {isWorker && (
                            <>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={location.pathname === "/"}
                                    >
                                        <Link to="/">
                                            <HomeIcon />
                                            <span>{t("Home")}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={location.pathname.startsWith("/documents")}
                                    >
                                        <Link to="/documents">
                                            <FileText />
                                            <span>{t("Documents")}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={location.pathname.startsWith("/scan")}
                                    >
                                        <Link to="/scan">
                                            <QrCode />
                                            <span>{t("Scan QR")}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </>
                        )}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={location.pathname.startsWith("/messages")}
                            >
                                    <Link to="/messages">
                                        <MessageSquare />
                                        <span>{t("Messages")}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        {canManageWorkPoints && (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={location.pathname.startsWith("/workpoints")}
                                >
                                    <Link to="/workpoints">
                                        <Building2 />
                                        <span>{t("Workpoints")}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                </SidebarGroup>
                {canViewWorkers && (
                    <>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarMenu>
                                <Collapsible asChild defaultOpen={isUsersRoute} className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton isActive={isUsersRoute}>
                                                <Users />
                                                <span>{t("Users")}</span>
                                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {canManageUsers && (
                                                    <SidebarMenuSubItem>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={location.pathname.startsWith("/invitations")}
                                                        >
                                                            <Link to="/invitations">{t("Invitations")}</Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                )}
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={location.pathname.startsWith("/workers")}
                                                    >
                                                        <Link to="/workers">{t("Worker management")}</Link>
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
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg">
                                            {getUserInitials(user?.username)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">{user?.username}</span>
                                        <span className="truncate text-xs">{user?.email}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarFallback className="rounded-lg">
                                                {getUserInitials(user?.username)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-medium">{user?.username}</span>
                                            <span className="truncate text-xs">{user?.email}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <div className="px-2 py-1.5">
                                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
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
                                                            "h-7 min-w-10 flex-1 rounded-md px-0 uppercase",
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
                                    <DropdownMenuItem onSelect={toggleMode}>
                                        {isDarkMode ? <Sun /> : <Moon />}
                                        {isDarkMode ? t("Light theme") : t("Dark theme")}
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => void logout()}>
                                    <LogOut />
                                    {t("Log out")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
