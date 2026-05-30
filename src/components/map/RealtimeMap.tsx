"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useIncidents } from "@/hooks/useIncidents";
import { useAgents } from "@/hooks/useAgents";
import { useUIStore } from "@/store/ui.store";
import { STATUS_CONFIG, ROLE_CONFIG, QUIBDO_CENTER } from "@/lib/constants";
import type { Incident } from "@/types/incident.types";
import type { Agent } from "@/types/agent.types";

/* Fix Leaflet default icon paths (CRA/Next.js issue) */
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeIncidentIcon(incident: Incident, selected: boolean) {
  const color = STATUS_CONFIG[incident.status]?.color ?? "#8a8a8a";
  const pulse = incident.status === "atendiendo"
    ? `<span class="absolute inset-0 rounded-full animate-ping opacity-75" style="background:${color}"></span>`
    : "";
  const size = selected ? 18 : 14;
  return L.divIcon({
    className: "",
    iconAnchor: [size / 2, size / 2],
    html: `<div class="relative flex items-center justify-center" style="width:${size}px;height:${size}px">
      ${pulse}
      <div class="relative w-full h-full rounded-full border-2 border-background" style="background:${color};box-shadow:0 0 0 ${selected ? "3px" : "1px"} ${color}40"></div>
    </div>`,
  });
}

function makeAgentIcon(agent: Agent) {
  const color = agent.role === "lider" ? ROLE_CONFIG.lider.cssVar : ROLE_CONFIG.partner.cssVar;
  const bg = agent.role === "lider" ? "#4a90d9" : "#666";
  const initial = agent.name[0];
  return L.divIcon({
    className: "",
    iconAnchor: [10, 10],
    html: `<div style="width:20px;height:20px;background:${bg};border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${initial}</div>`,
  });
}

function IncidentMarkers() {
  const map = useMap();
  const { data: incidents } = useIncidents();
  const { mapActiveFilters, selectedIncidentId, setSelectedIncidentId } = useUIStore();

  useEffect(() => {
    if (!incidents) return;
    const markers: L.Marker[] = [];

    incidents
      .filter((inc) => mapActiveFilters.includes(inc.status))
      .forEach((inc) => {
        const icon = makeIncidentIcon(inc, selectedIncidentId === inc.id);
        const m = L.marker([inc.location.lat, inc.location.lng], { icon })
          .addTo(map)
          .on("click", () => setSelectedIncidentId(inc.id));
        markers.push(m);
      });

    return () => markers.forEach((m) => m.remove());
  }, [incidents, mapActiveFilters, selectedIncidentId, map, setSelectedIncidentId]);

  return null;
}

function AgentMarkers() {
  const map = useMap();
  const { data: agents } = useAgents();

  useEffect(() => {
    if (!agents) return;
    const markers: L.Marker[] = [];
    agents
      .filter((a) => a.availability !== "fuera_servicio")
      .forEach((agent) => {
        const m = L.marker([agent.currentLocation.lat, agent.currentLocation.lng], {
          icon: makeAgentIcon(agent),
          zIndexOffset: -100,
        })
          .addTo(map)
          .bindTooltip(`<div style="font-size:11px"><b>${agent.name}</b><br>${agent.badge} · ${agent.role}</div>`, {
            direction: "top",
            offset: [0, -12],
          });
        markers.push(m);
      });
    return () => markers.forEach((m) => m.remove());
  }, [agents, map]);

  return null;
}

export function RealtimeMap() {
  return (
    <MapContainer
      center={QUIBDO_CENTER}
      zoom={14}
      style={{ height: "100%", width: "100%", background: "#0c0c0c" }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors &copy; <a href="https://carto.com">CARTO</a>'
        maxZoom={19}
      />
      <IncidentMarkers />
      <AgentMarkers />
    </MapContainer>
  );
}
