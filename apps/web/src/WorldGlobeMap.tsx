import { useCallback, useEffect, useRef, useState } from "react";
import { MapFrame, MapLegend, type MapFrameState, type MapStatus } from "@empire/ui";
import { Map as MaplibreMap, Marker, Popup } from "maplibre-gl";
import type { WorldRegion, WorldMonitoringSnapshot } from "@empire/batteries-world-monitor";

interface WorldGlobeMapProps {
  regions: WorldRegion[];
  selectedRegionId?: string;
  onSelectRegion?: (id: string) => void;
  mapLayers?: WorldMonitoringSnapshot["mapLayers"];
}

const mapStatuses: readonly MapStatus[] = ["nominal", "advisory", "alert", "critical", "unavailable"];

function createMarkerEl(region: WorldRegion, isSelected: boolean): HTMLElement {
  const el = document.createElement("div");
  el.className = "eol-map-marker";
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.dataset.status = region.status;
  el.dataset.selected = String(isSelected);
  el.setAttribute("aria-label", `${region.name} (${region.status})`);
  el.title = `${region.name} — ${region.status}`;

  if (isSelected) {
    const ring = document.createElement("span");
    ring.className = "eol-map-marker__pulse";
    ring.setAttribute("aria-hidden", "true");
    el.appendChild(ring);
  }

  const dot = document.createElement("span");
  dot.className = "eol-map-marker__dot";
  dot.setAttribute("aria-hidden", "true");
  el.appendChild(dot);

  const label = document.createElement("span");
  label.className = "eol-map-marker__label";
  label.setAttribute("aria-hidden", "true");
  label.textContent = region.code;
  el.appendChild(label);
  return el;
}

function createPopupContent(region: WorldRegion): HTMLElement {
  const content = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = region.name;

  const status = document.createElement("p");
  status.className = "eol-map-popup__status";
  status.dataset.status = region.status;
  status.textContent = region.status.toUpperCase();

  const value = (number: number | null, suffix = "") => number === null ? "Unavailable" : `${number}${suffix}`;
  const latency = document.createElement("p");
  latency.className = "eol-map-popup__latency";
  latency.textContent = `${value(region.latencyMs, " ms")} latency`;

  const facts = document.createElement("small");
  facts.textContent = `Uptime ${value(region.uptimePercentage, "%")} · ${value(region.nodeCount)} nodes · ${value(region.heliogridLoadMw, " MW")}`;
  content.append(name, status, latency, facts);
  return content;
}

export function WorldGlobeMap({ regions, selectedRegionId, onSelectRegion, mapLayers = [] }: WorldGlobeMapProps) {
  const [mapState, setMapState] = useState<MapFrameState>("loading");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const destroyedRef = useRef(false);
  const mapLoadedRef = useRef(false);
  const regionsRef = useRef(regions);
  const selectedRegionIdRef = useRef(selectedRegionId);
  const onSelectRegionRef = useRef(onSelectRegion);
  regionsRef.current = regions;
  selectedRegionIdRef.current = selectedRegionId;
  onSelectRegionRef.current = onSelectRegion;
  const handleMotionPausedChange = useCallback((paused: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    if (paused) map.stop();
    else map.triggerRepaint();
  }, []);

  function syncMarkers(map: MaplibreMap) {
    const currentRegions = regionsRef.current;
    const currentIds = new Set(currentRegions.map((region) => region.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    currentRegions.forEach((region) => {
      const selected = region.id === selectedRegionIdRef.current;
      let marker = markersRef.current.get(region.id);
      if (!marker) {
        const element = createMarkerEl(region, selected);
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectRegionRef.current?.(region.id);
        });
        element.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelectRegionRef.current?.(region.id);
          }
        });
        const popup = new Popup({ offset: 16, closeButton: false, className: "wm-popup" })
          .setDOMContent(createPopupContent(region));
        marker = new Marker({ element, anchor: "center" })
          .setLngLat([region.lng, region.lat])
          .setPopup(popup)
          .addTo(map);
        markersRef.current.set(region.id, marker);
        return;
      }

      marker.setLngLat([region.lng, region.lat]);
      const root = marker.getElement();
      const next = createMarkerEl(region, selected);
      root.dataset.status = next.dataset.status;
      root.dataset.selected = next.dataset.selected;
      root.title = next.title;
      root.setAttribute("aria-label", next.getAttribute("aria-label") ?? "");
      root.replaceChildren(...Array.from(next.childNodes));
      marker.getPopup()?.setDOMContent(createPopupContent(region));
    });
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    destroyedRef.current = false;

    let map: MaplibreMap;
    try {
      map = new MaplibreMap({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/dark",
        center: [15, 15],
        zoom: 1.6,
        minZoom: 1,
        maxZoom: 16,
        attributionControl: { compact: true },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      setMapState(message.includes("webgl") || message.includes("canvas") ? "webgl-unavailable" : "error");
      return;
    }
    mapRef.current = map;
    const loadingTimeout = window.setTimeout(() => {
      if (!destroyedRef.current && !mapLoadedRef.current) setMapState("error");
    }, 12_000);

    map.on("load", () => {
      if (destroyedRef.current) return;
      window.clearTimeout(loadingTimeout);
      map.resize();
      const imagery = mapLayers.find((layer) => layer.id === "nasa-gibs-modis");
      if (imagery && !map.getSource(imagery.id)) {
        map.addSource(imagery.id, { type: "raster", tiles: [imagery.url], tileSize: 256, attribution: imagery.attribution });
        map.addLayer({ id: imagery.id, type: "raster", source: imagery.id, paint: { "raster-opacity": 0.28 } });
      }
      mapLoadedRef.current = true;
      setMapState("ready");
      syncMarkers(map);
    });
    map.on("error", () => {
      if (!destroyedRef.current && !mapLoadedRef.current) {
        window.clearTimeout(loadingTimeout);
        setMapState("error");
      }
    });

    return () => {
      destroyedRef.current = true;
      window.clearTimeout(loadingTimeout);
      mapLoadedRef.current = false;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayers]);

  useEffect(() => {
    if (mapRef.current && mapLoadedRef.current) syncMarkers(mapRef.current);
  }, [regions, selectedRegionId]);

  useEffect(() => {
    if (!mapRef.current || !mapLoadedRef.current || !selectedRegionId) return;
    const region = regionsRef.current.find((item) => item.id === selectedRegionId);
    if (region) {
      mapRef.current.flyTo({
        center: [region.lng, region.lat],
        zoom: Math.max(mapRef.current.getZoom(), 4),
        duration: 900,
      });
    }
  }, [selectedRegionId]);

  return (
    <MapFrame
      className="world-map-container"
      title="Interactive region map"
      state={mapState}
      onMotionPausedChange={handleMotionPausedChange}
      stateTitle={mapState === "loading" ? "Connecting to map source" : undefined}
      description={mapState === "error"
        ? "The map source could not be loaded. Use the regional reference list below."
        : mapState === "webgl-unavailable"
          ? "This browser or device cannot render the interactive map. Use the regional reference list below."
          : mapState === "ready"
            ? "Markers show global locations. NASA GIBS imagery is layered when available; observations and source age appear below."
            : "Regional reference locations remain available in the list below."}
      canvas={<div ref={containerRef} className="world-map-canvas" />}
    >
      <MapLegend
        items={mapStatuses.map((status) => ({ status, label: status }))}
      />
    </MapFrame>
  );
}
