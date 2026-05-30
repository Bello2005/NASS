"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { STATUS_CONFIG, SEVERITY_CONFIG, ZONE_LIST } from "@/lib/constants";
import type { IncidentStatus, IncidentSeverity, QuibdoZone } from "@/types/incident.types";

const ALL_STATUSES: IncidentStatus[] = ["nueva", "aceptada", "en_camino", "atendiendo", "cerrada", "cancelada"];
const ALL_SEVERITIES: IncidentSeverity[] = [1, 2, 3, 4, 5];

export interface IncidentFilterState {
  search: string;
  statuses: IncidentStatus[];
  severities: IncidentSeverity[];
  zones: QuibdoZone[];
}

interface IncidentFiltersProps {
  filters: IncidentFilterState;
  onChange: (f: IncidentFilterState) => void;
}

export function IncidentFilters({ filters, onChange }: IncidentFiltersProps) {
  const toggle = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const activeCount = (filters.statuses.length < ALL_STATUSES.length ? 1 : 0)
    + (filters.severities.length < ALL_SEVERITIES.length ? 1 : 0)
    + (filters.zones.length < ZONE_LIST.length ? 1 : 0);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-52">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar incidencia..."
          className="pl-9 bg-card border-border h-9"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors h-9">
          <Filter className="w-3.5 h-3.5" />
          Filtros
          {activeCount > 0 && (
            <span className="ml-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Estado</DropdownMenuLabel>
          {ALL_STATUSES.map((s) => (
            <DropdownMenuCheckboxItem
              key={s}
              checked={filters.statuses.includes(s)}
              onCheckedChange={() => onChange({ ...filters, statuses: toggle(filters.statuses, s) })}
            >
              {STATUS_CONFIG[s].label}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Gravedad</DropdownMenuLabel>
          {ALL_SEVERITIES.map((sv) => (
            <DropdownMenuCheckboxItem
              key={sv}
              checked={filters.severities.includes(sv)}
              onCheckedChange={() => onChange({ ...filters, severities: toggle(filters.severities, sv) })}
            >
              {sv} — {SEVERITY_CONFIG[sv].label}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Zona</DropdownMenuLabel>
          {ZONE_LIST.map((z) => (
            <DropdownMenuCheckboxItem
              key={z}
              checked={filters.zones.includes(z)}
              onCheckedChange={() => onChange({ ...filters, zones: toggle(filters.zones, z) })}
            >
              {z}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
