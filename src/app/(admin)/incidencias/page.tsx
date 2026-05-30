"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { IncidentFilters, type IncidentFilterState } from "@/components/incidencias/IncidentFilters";
import { IncidentTable } from "@/components/incidencias/IncidentTable";
import { useIncidents } from "@/hooks/useIncidents";
import { ZONE_LIST, STATUS_CONFIG } from "@/lib/constants";
import type { IncidentStatus, IncidentSeverity } from "@/types/incident.types";

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as IncidentStatus[];
const ALL_SEVERITIES: IncidentSeverity[] = [1, 2, 3, 4, 5];

export default function IncidenciasPage() {
  const { data: incidents, isLoading } = useIncidents();
  const [filters, setFilters] = useState<IncidentFilterState>({
    search: "",
    statuses: ALL_STATUSES,
    severities: ALL_SEVERITIES,
    zones: [...ZONE_LIST],
  });

  const filtered = (incidents ?? []).filter((inc) => {
    if (filters.search && !inc.title.toLowerCase().includes(filters.search.toLowerCase()) && !inc.id.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (!filters.statuses.includes(inc.status)) return false;
    if (!filters.severities.includes(inc.severity)) return false;
    if (!filters.zones.includes(inc.zone)) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="Gestión de Incidencias"
        subtitle={`${(incidents ?? []).length} incidencias registradas`}
      />
      <IncidentFilters filters={filters} onChange={setFilters} />
      <IncidentTable incidents={filtered} isLoading={isLoading} />
    </div>
  );
}
