"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useUnits } from "@/hooks/useUnits";
import { INSTITUTION_CONFIG, QUIBDO_CENTER } from "@/lib/constants";
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_SUBDOMAINS, TILE_URL } from "@/lib/mapTiles";

interface PickerMapProps {
  point: { lat: number; lng: number };
  onPick: (point: { lat: number; lng: number }) => void;
}

function Picker({ point, onPick }: PickerMapProps) {
  const map = useMap();
  const { data: units } = useUnits();

  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  useEffect(() => {
    const marker = L.marker([point.lat, point.lng], {
      icon: L.divIcon({
        className: "",
        iconAnchor: [12, 12],
        html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center">
          <span style="position:absolute;inset:-6px;border-radius:9999px;background:#ef4444;opacity:.25;animation:nass-ping 1.6s cubic-bezier(0,0,.2,1) infinite"></span>
          <span style="position:relative;width:16px;height:16px;border-radius:9999px;background:#ef4444;border:2px solid #0b0b0b"></span>
        </div>`,
      }),
    }).addTo(map);
    return () => {
      marker.remove();
    };
  }, [point, map]);

  useEffect(() => {
    if (!units) return;
    const markers = units.map((unit) => {
      const config = INSTITUTION_CONFIG[unit.institution];
      return L.marker([unit.currentLocation.lat, unit.currentLocation.lng], {
        icon: L.divIcon({
          className: "",
          iconAnchor: [10, 10],
          html: `<div style="width:20px;height:20px;border-radius:6px;background:${config.color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff">${config.icon}</div>`,
        }),
        zIndexOffset: -100,
      })
        .addTo(map)
        .bindTooltip(unit.callsign, { direction: "top", offset: [0, -10] });
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [units, map]);

  return null;
}

export function PickerMap(props: PickerMapProps) {
  return (
    <MapContainer
      center={QUIBDO_CENTER}
      zoom={14}
      style={{ height: "100%", width: "100%", background: "#0c0c0c" }}
    >
      <TileLayer
        url={TILE_URL}
        attribution={TILE_ATTRIBUTION}
        subdomains={TILE_SUBDOMAINS}
        maxZoom={TILE_MAX_ZOOM}
      />
      <Picker {...props} />
    </MapContainer>
  );
}
