"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Map, AlertTriangle, Users, BarChart3, ScrollText,
  Shield, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { href: "/mapa",        label: "Mapa en vivo", icon: Map },
  { href: "/incidencias", label: "Incidencias",  icon: AlertTriangle },
  { href: "/usuarios",    label: "Usuarios",     icon: Users },
  { href: "/analitica",   label: "Analítica",    icon: BarChart3 },
  { href: "/auditoria",   label: "Auditoría",    icon: ScrollText },
];

interface SidebarProps {
  onMobileClose?: () => void;
}

export function Sidebar({ onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out shrink-0",
        /* Mobile: always full width. Desktop: collapsed or expanded */
        "w-60 md:w-auto",
        sidebarCollapsed ? "md:w-16" : "md:w-60"
      )}
    >
      {/* Logo + mobile close */}
      <div className={cn(
        "flex items-center h-14 px-4 border-b border-sidebar-border",
        sidebarCollapsed && "md:justify-center md:px-0"
      )}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          {(!sidebarCollapsed) && (
            <span className="font-bold text-sm tracking-wide text-sidebar-foreground hidden md:inline">NASS Admin</span>
          )}
          <span className="font-bold text-sm tracking-wide text-sidebar-foreground md:hidden">NASS Admin</span>
        </div>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden ml-auto text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const item = (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                sidebarCollapsed && "md:justify-center md:mx-1 md:px-0"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className={cn(sidebarCollapsed && "md:hidden")}>{label}</span>
            </Link>
          );

          if (sidebarCollapsed) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger className="w-full hidden md:block">
                  {item}
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          }
          return item;
        })}
      </nav>

      {/* User footer + collapse toggle */}
      <div className="border-t border-sidebar-border">
        {(!sidebarCollapsed) && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              CM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">Carlos Mosquera</p>
              <p className="text-xs text-muted-foreground truncate">Administrador</p>
            </div>
          </div>
        )}
        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex w-full items-center justify-center h-10 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
