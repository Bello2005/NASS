"use client";

import { useUnits } from "@/hooks/useUnits";
import { AVAILABILITY_CONFIG, INSTITUTION_CONFIG } from "@/lib/constants";
import type { Institution } from "@/types/unit.types";

const INSTITUTIONS: Institution[] = ["policia", "ambulancia", "bomberos", "seguridad"];

/** Resumen del estado de la flota, siempre visible bajo el mapa. */
export function UnitStatusBar() {
  const { data: units } = useUnits();
  const list = units ?? [];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border bg-card/60 px-3 py-2 text-xs">
      {INSTITUTIONS.map((institution) => {
        const own = list.filter((unit) => unit.institution === institution);
        const free = own.filter((unit) => unit.availability === "disponible").length;
        const config = INSTITUTION_CONFIG[institution];
        return (
          <span key={institution} className="flex items-center gap-1.5">
            <span
              className="flex size-4 items-center justify-center rounded text-[9px]"
              style={{ background: `${config.color}26`, color: config.color }}
            >
              {config.icon}
            </span>
            <span className="text-muted-foreground">{config.label}</span>
            <span className="font-semibold tabular-nums">{free}/{own.length}</span>
          </span>
        );
      })}

      <span className="ml-auto flex items-center gap-3">
        {(["en_camino", "en_sitio", "ocupada"] as const).map((state) => {
          const count = list.filter((unit) => unit.availability === state).length;
          if (count === 0) return null;
          return (
            <span key={state} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: AVAILABILITY_CONFIG[state].color }} />
              <span className="text-muted-foreground">{AVAILABILITY_CONFIG[state].label}</span>
              <span className="font-semibold tabular-nums">{count}</span>
            </span>
          );
        })}
      </span>
    </div>
  );
}
