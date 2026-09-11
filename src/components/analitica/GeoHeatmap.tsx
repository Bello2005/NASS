"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { QUIBDO_CENTER } from "@/lib/constants";
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_SUBDOMAINS, TILE_URL } from "@/lib/mapTiles";
import type { HeatmapResponse } from "@/lib/api";

/** Escala de intensidad: azul (baja) → naranja → rojo (alta concentración). */
function intensityColor(ratio: number): string {
  if (ratio > 0.75) return "#dc2626";
  if (ratio > 0.5) return "#ea580c";
  if (ratio > 0.25) return "#eab308";
  return "#38bdf8";
}

function HeatLayer({ data }: { data: HeatmapResponse }) {
  const map = useMap();

  useEffect(() => {
    const circles = data.points.map((point) => {
      const ratio = data.max === 0 ? 0 : point.weight / data.max;
      return L.circle([point.lat, point.lng], {
        radius: 90 + ratio * 190,
        color: intensityColor(ratio),
        fillColor: intensityColor(ratio),
        fillOpacity: 0.18 + ratio * 0.42,
        weight: 0,
      })
        .addTo(map)
        .bindTooltip(`${point.weight} incidente${point.weight === 1 ? "" : "s"}`, { direction: "top" });
    });
    return () => circles.forEach((circle) => circle.remove());
  }, [data, map]);

  return null;
}

/**
 * Mapa de calor geográfico. Los puntos llegan agregados por celdas de ~165 m
 * desde el servidor: nunca se dibuja la posición exacta de un ciudadano.
 */
export function GeoHeatmap({ data }: { data: HeatmapResponse }) {
  return (
    <MapContainer
      center={QUIBDO_CENTER}
      zoom={13}
      style={{ height: "100%", width: "100%", background: "#0c0c0c" }}
      zoomControl={false}
      scrollWheelZoom={false}
    >
      <TileLayer
        url={TILE_URL}
        attribution={TILE_ATTRIBUTION}
        subdomains={TILE_SUBDOMAINS}
        maxZoom={TILE_MAX_ZOOM}
      />
      <HeatLayer data={data} />
    </MapContainer>
  );
}
