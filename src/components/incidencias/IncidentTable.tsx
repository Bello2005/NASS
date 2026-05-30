"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SeverityDot } from "@/components/shared/SeverityDot";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import { AlertTriangle } from "lucide-react";
import type { Incident } from "@/types/incident.types";

const PAGE_SIZE = 10;

interface IncidentTableProps {
  incidents: Incident[];
  isLoading: boolean;
}

export function IncidentTable({ incidents, isLoading }: IncidentTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(incidents.length / PAGE_SIZE);
  const paged = incidents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}
      </div>
    );
  }

  if (incidents.length === 0) {
    return <EmptyState icon={AlertTriangle} title="Sin incidencias" description="No se encontraron incidencias con los filtros actuales" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-xs text-muted-foreground font-medium w-28">Código</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Título</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium w-24">Tipo</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium w-10 text-center">G.</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium w-28">Estado</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium w-28">Zona</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium w-36">Reportada</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((inc) => (
              <TableRow key={inc.id} className="border-border hover:bg-accent/30 cursor-pointer">
                <TableCell className="font-mono text-xs text-muted-foreground">{inc.id}</TableCell>
                <TableCell>
                  <span className="text-sm text-foreground font-medium line-clamp-1">{inc.title}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{CATEGORY_LABELS[inc.category]}</TableCell>
                <TableCell className="text-center">
                  <SeverityDot severity={inc.severity} />
                </TableCell>
                <TableCell><StatusBadge status={inc.status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">{inc.zone}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDateTime(inc.reportedAt)}</TableCell>
                <TableCell>
                  <Link href={`/incidencias/${inc.id}`}>
                    <Button variant="ghost" size="icon" className="w-7 h-7">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, incidents.length)} de {incidents.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-7 h-7" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2">{page} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="w-7 h-7" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
