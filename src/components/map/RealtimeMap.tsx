"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useIncidents } from "@/hooks/useIncidents";
import { useUnits } from "@/hooks/useUnits";
import { useUIStore } from "@/store/ui.store";
import { AVAILABILITY_CONFIG, INSTITUTION_CONFIG, QUIBDO_CENTER, STATUS_CONFIG } from "@/lib/constants";
import type { Incident } from "@/types/incident.types";
import type { Unit } from "@/types/unit.types";

function incidentIcon(incident: Incident, selected: boolean) {
  const color = STATUS_CONFIG[incident.status]?.color ?? "#8a8a8a";
  const urgent = incident.status === "nueva" || incident.priority === "critica";
  const size = selected ? 20 : 15;
  const pulse = urgent
    ? `<span style="position:absolute;inset:-4px;border-radius:9999px;background:${color};opacity:.35;animation:nass-ping 1.4s cubic-bezier(0,0,.2,1) infinite"></span>`
    : "";
  return L.divIcon({
    className: "",
    iconAnchor: [size / 2, size / 2],
    html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
      ${pulse}
      <div style="position:relative;width:100%;height:100%;border-radius:9999px;background:${color};border:2px solid #0b0b0b;box-shadow:0 0 0 ${selected ? 3 : 1}px ${color}55"></div>
    </div>`,
  });
}

/** Cada institución tiene su propio distintivo en el mapa (§9). */
function unitIcon(unit: Unit) {
  const config = INSTITUTION_CONFIG[unit.institution];
  const dim = unit.availability === "fuera_servicio" ? 0.4 : 1;
  const ring = AVAILABILITY_CONFIG[unit.availability].color;
  return L.divIcon({
    className: "",
    iconAnchor: [12, 12],
    html: `<div style="width:24px;height:24px;border-radius:7px;background:${config.color};opacity:${dim};border:2px solid ${ring};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.55)">${config.icon}</div>`,
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
      .filter((incident) => mapActiveFilters.includes(incident.status))
      .forEach((incident) => {
        const marker = L.marker([incident.location.lat, incident.location.lng], {
          icon: incidentIcon(incident, selectedIncidentId === incident.id),
          zIndexOffset: incident.status === "nueva" ? 500 : 100,
        })
          .addTo(map)
          .on("click", () => setSelectedIncidentId(incident.id))
          .bindTooltip(
            `<div style="font-size:11px"><b>${incident.code}</b><br>${incident.title}</div>`,
            { direction: "top", offset: [0, -10] },
          );
        markers.push(marker);
      });

    return () => markers.forEach((marker) => marker.remove());
  }, [incidents, mapActiveFilters, selectedIncidentId, map, setSelectedIncidentId]);

  return null;
}

function UnitMarkers() {
  const map = useMap();
  const { data: units } = useUnits();

  useEffect(() => {
    if (!units) return;
    const markers: L.Marker[] = [];
    units.forEach((unit) => {
      const marker = L.marker([unit.currentLocation.lat, unit.currentLocation.lng], {
        icon: unitIcon(unit),
        zIndexOffset: -100,
      })
        .addTo(map)
        .bindTooltip(
          `<div style="font-size:11px"><b>${unit.callsign}</b> · ${INSTITUTION_CONFIG[unit.institution].label}<br>${AVAILABILITY_CONFIG[unit.availability].label}${unit.speed ? ` · ${unit.speed} km/h` : ""}</div>`,
          { direction: "top", offset: [0, -12] },
        );
      markers.push(marker);
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [units, map]);

  return null;
}

/** Traza la línea entre la unidad despachada y su incidente. */
function DispatchLines() {
  const map = useMap();
  const { data: units } = useUnits();
  const { data: incidents } = useIncidents();

  useEffect(() => {
    if (!units || !incidents) return;
    const lines: L.Polyline[] = [];
    units
      .filter((unit) => unit.assignedIncidentId)
      .forEach((unit) => {
        const incident = incidents.find((item) => item.id === unit.assignedIncidentId);
        if (!incident) return;
        lines.push(
          L.polyline(
            [
              [unit.currentLocation.lat, unit.currentLocation.lng],
              [incident.location.lat, incident.location.lng],
            ],
            { color: INSTITUTION_CONFIG[unit.institution].color, weight: 2, opacity: 0.55, dashArray: "6 6" },
          ).addTo(map),
        );
      });
    return () => lines.forEach((line) => line.remove());
  }, [units, incidents, map]);

  return null;
}

export function RealtimeMap() {
  return (
    <MapContainer
      center={QUIBDO_CENTER}
      zoom={14}
      style={{ height: "100%", width: "100%", background: "#0c0c0c" }}
      zoomControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors &copy; <a href="https://carto.com">CARTO</a>'
        maxZoom={19}
      />
      <DispatchLines />
      <IncidentMarkers />
      <UnitMarkers />
    </MapContainer>
  );
}
