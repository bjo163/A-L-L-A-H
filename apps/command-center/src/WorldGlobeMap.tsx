import { useEffect, useRef } from "react";
import { Map as MaplibreMap, Marker, Popup } from "maplibre-gl";
import type { WorldRegion } from "@empire/batteries-world-monitor";

// NOTE: maplibre-gl/dist/maplibre-gl.css must be imported in main.tsx

interface WorldGlobeMapProps {
  regions: WorldRegion[];
  selectedRegionId?: string;
  onSelectRegion?: (id: string) => void;
}

const STATUS_HEX: Record<string, string> = {
  nominal:  "#4ade80",
  advisory: "#facc15",
  alert:    "#f97316",
  critical: "#ef4444",
};

function createMarkerEl(region: WorldRegion, isSelected: boolean): HTMLElement {
  const color   = STATUS_HEX[region.status] ?? STATUS_HEX.nominal;
  const size    = isSelected ? 18 : 12;
  const isPulse = isSelected || region.code === "AP-SE";

  const el = document.createElement("div");
  el.style.cssText = `position:relative;width:${size}px;height:${size}px;cursor:pointer`;
  el.title = `${region.name} — ${region.status}`;

  if (isPulse) {
    const ring = document.createElement("span");
    ring.style.cssText = `
      position:absolute;inset:-${size / 2}px;border-radius:50%;
      border:2px solid ${color};
      animation:wm-pulse 2s ease-out infinite;pointer-events:none;`;
    el.appendChild(ring);
  }

  const dot = document.createElement("span");
  dot.style.cssText = `
    display:block;width:${size}px;height:${size}px;border-radius:50%;
    background:${color};
    box-shadow:0 0 ${isSelected ? 14 : 7}px ${color}99;
    border:${isSelected ? "2.5px" : "1.5px"} solid rgba(255,255,255,0.7);`;
  el.appendChild(dot);

  const label = document.createElement("span");
  label.textContent = region.code;
  label.style.cssText = `
    position:absolute;bottom:${size + 4}px;left:50%;transform:translateX(-50%);
    font-family:monospace;font-size:${isSelected ? 11 : 9}px;
    font-weight:${isSelected ? "bold" : "normal"};
    color:rgba(255,255,255,${isSelected ? 1 : 0.75});
    white-space:nowrap;pointer-events:none;
    text-shadow:0 1px 4px rgba(0,0,0,0.95);`;
  el.appendChild(label);

  return el;
}

export function WorldGlobeMap({ regions, selectedRegionId, onSelectRegion }: WorldGlobeMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<MaplibreMap | null>(null);
  const markersRef    = useRef<Map<string, Marker>>(new Map());
  const destroyedRef  = useRef(false);

  // ── Init map once ────────────────────────────────────────────────────────
  useEffect(() => {
    // Guard against React StrictMode double-invoke or missing container
    if (!containerRef.current || mapRef.current) return;
    destroyedRef.current = false;

    const map = new MaplibreMap({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [15, 15],
      zoom: 1.6,
      minZoom: 1,
      maxZoom: 16,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    map.on("load", () => {
      if (destroyedRef.current) return;

      // Force a resize so the canvas fills the container correctly
      map.resize();

      regions.forEach((region) => {
        if (destroyedRef.current) return;
        const isSelected = region.id === selectedRegionId;
        const el = createMarkerEl(region, isSelected);

        const popup = new Popup({
          offset: 16,
          closeButton: false,
          className: "wm-popup",
        }).setHTML(`
          <strong>${region.name}</strong><br/>
          <span style="color:${STATUS_HEX[region.status] ?? "#aaa"};font-weight:bold">
            ${region.status.toUpperCase()}
          </span>
          &nbsp;·&nbsp;${region.latencyMs}ms latency<br/>
          <small>
            Uptime ${region.uptimePercentage}% &nbsp;·&nbsp;
            ${region.nodeCount} nodes &nbsp;·&nbsp;
            ${region.heliogridLoadMw} MW
          </small>
        `);

        const marker = new Marker({ element: el, anchor: "center" })
          .setLngLat([region.lng, region.lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectRegion?.(region.id);
        });

        markersRef.current.set(region.id, marker);
      });
    });

    return () => {
      destroyedRef.current = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update markers when selection changes ────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    regions.forEach((region) => {
      const marker = markersRef.current.get(region.id);
      if (!marker) return;
      const isSelected = region.id === selectedRegionId;
      // Swap element contents in-place to keep Marker internals intact
      const oldEl = marker.getElement();
      const newEl = createMarkerEl(region, isSelected);
      newEl.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRegion?.(region.id);
      });
      oldEl.replaceWith(newEl);
    });

    // FlyTo selected region
    if (selectedRegionId) {
      const region = regions.find((r) => r.id === selectedRegionId);
      if (region) {
        mapRef.current.flyTo({
          center: [region.lng, region.lat],
          zoom: Math.max(mapRef.current.getZoom(), 4),
          duration: 900,
        });
      }
    } else {
      mapRef.current.flyTo({ center: [15, 15], zoom: 1.6, duration: 900 });
    }
  }, [regions, selectedRegionId]);

  return (
    <div className="world-map-container">
      <div ref={containerRef} className="world-map-canvas" />

      {/* Legend */}
      <div className="globe-legend">
        {Object.entries(STATUS_HEX).map(([status, color]) => (
          <span key={status} className="globe-legend-item">
            <span style={{
              display: "inline-block", width: 8, height: 8,
              borderRadius: "50%", background: color,
              marginRight: 4, boxShadow: `0 0 6px ${color}88`,
            }} />
            {status}
          </span>
        ))}
        <span className="globe-legend-item" style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>
          © OpenFreeMap · OSM contributors
        </span>
      </div>
    </div>
  );
}
