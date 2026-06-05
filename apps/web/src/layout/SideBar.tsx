import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

export default function SideBar({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const isMessagingRoute = location.pathname.startsWith("/messages")

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset
                className={cn("overflow-hidden", isMessagingRoute && "h-svh min-h-0")}
            >
                <div
                    className={cn(
                        "flex flex-col",
                        isMessagingRoute ? "h-svh min-h-0 overflow-hidden" : "min-h-svh"
                    )}
                >
                    <header className="flex h-14 shrink-0 items-center border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        <SidebarTrigger className="-ml-1 rounded-xl" />
                    </header>
                    <div
                        className={cn(
                            "flex-1 min-h-0",
                            isMessagingRoute ? "overflow-hidden" : "overflow-y-auto"
                        )}
                    >
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
