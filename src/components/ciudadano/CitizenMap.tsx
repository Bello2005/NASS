"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { INSTITUTION_CONFIG, QUIBDO_CENTER } from "@/lib/constants";
import type { GeoPoint } from "@/types/incident.types";
import type { Unit } from "@/types/unit.types";

interface CitizenMapProps {
  position?: GeoPoint;
  accuracy?: number;
  unit?: Unit | null;
  emergencyActive?: boolean;
}

function citizenIcon(emergency: boolean) {
  const color = emergency ? "#ef4444" : "#38bdf8";
  return L.divIcon({
    className: "",
    iconAnchor: [11, 11],
    html: `<div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center">
      <span style="position:absolute;inset:-6px;border-radius:9999px;background:${color};opacity:.25;animation:nass-ping 1.6s cubic-bezier(0,0,.2,1) infinite"></span>
      <span style="position:relative;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid #0b0b0b;box-shadow:0 0 0 2px ${color}55"></span>
    </div>`,
  });
}

function unitIcon(unit: Unit) {
  const config = INSTITUTION_CONFIG[unit.institution];
  return L.divIcon({
    className: "",
    iconAnchor: [13, 13],
    html: `<div style="width:26px;height:26px;border-radius:8px;background:${config.color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.5)">${config.icon}</div>`,
  });
}

function Markers({ position, accuracy, unit, emergencyActive }: CitizenMapProps) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    const layers: L.Layer[] = [];

    layers.push(L.marker([position.lat, position.lng], { icon: citizenIcon(!!emergencyActive) }).addTo(map));
    if (accuracy && accuracy > 0) {
      layers.push(
        L.circle([position.lat, position.lng], {
          radius: accuracy,
          color: emergencyActive ? "#ef4444" : "#38bdf8",
          weight: 1,
          opacity: 0.35,
          fillOpacity: 0.08,
        }).addTo(map),
      );
    }

    if (unit) {
      const unitMarker = L.marker([unit.currentLocation.lat, unit.currentLocation.lng], { icon: unitIcon(unit) })
        .addTo(map)
        .bindTooltip(`${unit.callsign} · ${unit.name}`, { direction: "top", offset: [0, -14] });
      layers.push(unitMarker);
      layers.push(
        L.polyline(
          [
            [unit.currentLocation.lat, unit.currentLocation.lng],
            [position.lat, position.lng],
          ],
          { color: "#38bdf8", weight: 2, dashArray: "5 6", opacity: 0.6 },
        ).addTo(map),
      );
      map.fitBounds(
        L.latLngBounds([
          [position.lat, position.lng],
          [unit.currentLocation.lat, unit.currentLocation.lng],
        ]).pad(0.45),
        { animate: true },
      );
    } else {
      map.setView([position.lat, position.lng], 16, { animate: true });
    }

    return () => layers.forEach((layer) => layer.remove());
  }, [map, position, accuracy, unit, emergencyActive]);

  return null;
}

export function CitizenMap(props: CitizenMapProps) {
  const center = useMemo<[number, number]>(
    () => (props.position ? [props.position.lat, props.position.lng] : QUIBDO_CENTER),
    [props.position],
  );

  return (
    <MapContainer
      center={center}
      zoom={props.position ? 16 : 13}
      style={{ height: "100%", width: "100%", background: "#0c0c0c" }}
      zoomControl={false}
      attributionControl={false}
      dragging
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        maxZoom={19}
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />
      <Markers {...props} />
    </MapContainer>
  );
}
