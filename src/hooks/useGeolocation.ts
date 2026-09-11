"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface GeoState {
  lat?: number;
  lng?: number;
  accuracy?: number;
  updatedAt?: string;
  error?: string;
  status: "idle" | "solicitando" | "activa" | "denegada" | "no_disponible";
}

/**
 * Geolocalización del dispositivo con seguimiento continuo opcional.
 * Solo se activa tras consentimiento explícito del navegador (§24 privacidad).
 */
export function useGeolocation(options?: { watch?: boolean }) {
  const [state, setState] = useState<GeoState>({ status: "idle" });
  const watchId = useRef<number | null>(null);

  const apply = useCallback((position: GeolocationPosition) => {
    setState({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: Math.round(position.coords.accuracy),
      updatedAt: new Date().toISOString(),
      status: "activa",
    });
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      status: error.code === error.PERMISSION_DENIED ? "denegada" : "no_disponible",
      error: error.code === error.PERMISSION_DENIED
        ? "Permiso de ubicación denegado"
        : "No fue posible obtener la ubicación",
    }));
  }, []);

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "no_disponible", error: "Este dispositivo no reporta ubicación" });
      return;
    }
    setState((prev) => ({ ...prev, status: prev.status === "activa" ? "activa" : "solicitando" }));
    navigator.geolocation.getCurrentPosition(apply, onError, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 5_000,
    });
    if (options?.watch && watchId.current === null) {
      watchId.current = navigator.geolocation.watchPosition(apply, onError, {
        enableHighAccuracy: true,
        timeout: 20_000,
        maximumAge: 3_000,
      });
    }
  }, [apply, onError, options?.watch]);

  useEffect(() => {
    return () => {
      if (watchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  /** Obtiene una posición puntual sin depender del estado del hook. */
  const getOnce = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("Geolocalización no disponible"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 10_000,
      });
    });
  }, []);

  return { ...state, start, getOnce };
}
