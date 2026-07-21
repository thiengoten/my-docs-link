"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type L from "leaflet";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import type { MapShape, ProjectMap } from "@/types/database";
import { saveProjectMap } from "@/lib/actions/project-maps";

type Tool = "select" | "polygon" | "line" | "pin" | "text";
type Preset = { value: string; label: string };

// Màu theo loại đất, dùng khi vẽ vùng — chọn màu cũng đặt luôn nhãn mặc định.
const LAND_TYPES: Preset[] = [
  { value: "#e11d48", label: "ONT/ODT" },
  { value: "#7c3aed", label: "Quy hoạch" },
  { value: "#059669", label: "CLN/BHK" },
  { value: "#ea580c", label: "TMD" },
  { value: "#eab308", label: "Vàng" },
];

// Màu theo loại đường, dùng khi vẽ đường ranh/giao thông.
const ROAD_TYPES: Preset[] = [
  { value: "#dc2626", label: "Giao thông chính" },
  { value: "#eab308", label: "Ranh quy hoạch" },
  { value: "#0284c7", label: "Đường nội bộ" },
  { value: "#16a34a", label: "Cây xanh/công viên" },
];

// Màu chung cho ghim vị trí và chữ đồ họa (không gắn nghĩa loại đất/đường).
const GENERIC_COLORS: Preset[] = [
  { value: "#e11d48", label: "Đỏ" },
  { value: "#7c3aed", label: "Tím" },
  { value: "#059669", label: "Xanh lá" },
  { value: "#0284c7", label: "Xanh dương" },
  { value: "#ea580c", label: "Cam" },
  { value: "#eab308", label: "Vàng" },
];

const TOOL_PRESETS: Partial<Record<Tool, Preset[]>> = {
  polygon: LAND_TYPES,
  line: ROAD_TYPES,
  pin: GENERIC_COLORS,
  text: GENERIC_COLORS,
};

const SNAP_PX = 14;

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function MapEditor({
  projectId,
  projectName,
  initialMap,
}: {
  projectId: string;
  projectName: string;
  initialMap: ProjectMap | null;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const drawPointsRef = useRef<[number, number][]>([]);
  const drawPreviewRef = useRef<L.Polygon | L.Polyline | null>(null);
  const drawStartMarkerRef = useRef<L.Marker | null>(null);
  const shapesRef = useRef<MapShape[]>(initialMap?.shapes ?? []);
  const leafletRef = useRef<typeof L | null>(null);

  const [tool, setTool] = useState<Tool>("select");
  const [preset, setPreset] = useState<Preset>(LAND_TYPES[0]);
  const [lineDashed, setLineDashed] = useState(false);
  const [shapes, setShapes] = useState<MapShape[]>(initialMap?.shapes ?? []);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [drawPointCount, setDrawPointCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  const toolRef = useRef(tool);
  const colorRef = useRef(preset.value);
  const presetLabelRef = useRef(preset.label);
  const lineDashedRef = useRef(lineDashed);

  useEffect(() => {
    toolRef.current = tool;
    colorRef.current = preset.value;
    presetLabelRef.current = preset.label;
    lineDashedRef.current = lineDashed;
  }, [tool, preset, lineDashed]);

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  const activePresets = TOOL_PRESETS[tool];
  const [presetTool, setPresetTool] = useState(tool);
  if (tool !== presetTool) {
    setPresetTool(tool);
    if (activePresets) setPreset(activePresets[0]);
  }

  const clearDrawPreview = useCallback(() => {
    if (drawPreviewRef.current) {
      drawPreviewRef.current.remove();
      drawPreviewRef.current = null;
    }
    if (drawStartMarkerRef.current) {
      drawStartMarkerRef.current.remove();
      drawStartMarkerRef.current = null;
    }
  }, []);

  const finishShape = useCallback(
    (kind: "polygon" | "line") => {
      const points = drawPointsRef.current;
      const minPoints = kind === "polygon" ? 3 : 2;
      if (points.length >= minPoints) {
        setShapes((prev) => [
          ...prev,
          {
            id: makeId(),
            type: kind,
            label: presetLabelRef.current || (kind === "polygon" ? "Vùng đất mới" : "Đường ranh mới"),
            color: colorRef.current,
            points,
            ...(kind === "line" ? { dashed: lineDashedRef.current } : {}),
          },
        ]);
      }
      drawPointsRef.current = [];
      setDrawPointCount(0);
      clearDrawPreview();
    },
    [clearDrawPreview]
  );

  // Init map once.
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [initialMap?.center_lat ?? 21.0285, initialMap?.center_lng ?? 105.8542],
        zoom: initialMap?.zoom ?? 15,
      });

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri",
          crossOrigin: true,
          maxZoom: 19,
        }
      ).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);

      function findNearbyVertex(containerPoint: L.Point): [number, number] | null {
        for (const shape of shapesRef.current) {
          if (shape.type !== "polygon" && shape.type !== "line") continue;
          for (const pt of shape.points) {
            const p = map.latLngToContainerPoint(L.latLng(pt[0], pt[1]));
            if (p.distanceTo(containerPoint) <= SNAP_PX) return pt;
          }
        }
        return null;
      }

      map.on("click", (e: L.LeafletMouseEvent) => {
        const currentTool = toolRef.current;

        if (currentTool === "polygon" || currentTool === "line") {
          const existing = drawPointsRef.current;

          // Bấm lại đúng điểm đầu tiên để đóng vùng đất (chỉ áp dụng cho polygon).
          if (currentTool === "polygon" && existing.length >= 3) {
            const startContainerPoint = map.latLngToContainerPoint(
              L.latLng(existing[0][0], existing[0][1])
            );
            if (startContainerPoint.distanceTo(e.containerPoint) <= SNAP_PX) {
              finishShape("polygon");
              return;
            }
          }

          const snapped = findNearbyVertex(e.containerPoint);
          const point: [number, number] = snapped ?? [e.latlng.lat, e.latlng.lng];

          drawPointsRef.current = [...existing, point];
          setDrawPointCount(drawPointsRef.current.length);

          if (drawPointsRef.current.length === 1) {
            drawStartMarkerRef.current = L.marker(point, {
              icon: L.divIcon({ html: `<div class="map-start-point"></div>`, className: "", iconSize: [16, 16], iconAnchor: [8, 8] }),
              interactive: false,
            }).addTo(map);
          }

          if (drawPreviewRef.current) drawPreviewRef.current.remove();
          const previewOptions = {
            color: colorRef.current,
            weight: currentTool === "line" ? 4 : 3,
            dashArray: currentTool === "line" && !lineDashedRef.current ? undefined : "6 4",
          };
          drawPreviewRef.current =
            currentTool === "polygon"
              ? L.polygon(drawPointsRef.current, previewOptions).addTo(map)
              : L.polyline(drawPointsRef.current, previewOptions).addTo(map);
        } else if (currentTool === "pin") {
          const point: [number, number] = [e.latlng.lat, e.latlng.lng];
          setShapes((prev) => [
            ...prev,
            { id: makeId(), type: "pin", label: "Điểm mới", color: colorRef.current, position: point },
          ]);
        } else if (currentTool === "text") {
          const point: [number, number] = [e.latlng.lat, e.latlng.lng];
          setShapes((prev) => [
            ...prev,
            { id: makeId(), type: "text", label: "Nhãn mới", color: colorRef.current, position: point },
          ]);
        }
      });

      map.on("dblclick", () => {
        if (toolRef.current === "polygon") finishShape("polygon");
        else if (toolRef.current === "line") finishShape("line");
      });

      setTimeout(() => map.invalidateSize(), 0);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw shapes whenever they change.
  useEffect(() => {
    const L = leafletRef.current;
    const group = layerGroupRef.current;
    if (!L || !group) return;
    group.clearLayers();

    for (const shape of shapes) {
      if (shape.type === "polygon") {
        L.polygon(shape.points, { color: shape.color, weight: 3, fillOpacity: 0.25 })
          .bindTooltip(escapeHtml(shape.label), {
            permanent: true,
            direction: "center",
            className: "map-label",
          })
          .addTo(group);
      } else if (shape.type === "line") {
        L.polyline(shape.points, {
          color: shape.color,
          weight: 4,
          dashArray: shape.dashed ? "8 6" : undefined,
        })
          .bindTooltip(escapeHtml(shape.label), {
            permanent: true,
            direction: "center",
            className: "map-label",
          })
          .addTo(group);
      } else if (shape.type === "pin") {
        if (shape.imageUrl) {
          const icon = L.divIcon({
            html: `
              <div class="map-photo-pin">
                <div class="map-photo-card"><img src="${shape.imageUrl}" alt="" /></div>
                <div class="map-photo-line"></div>
                <div class="map-pin" style="background:${shape.color}"></div>
                <div class="map-photo-label" style="color:${shape.color}">${escapeHtml(shape.label)}</div>
              </div>
            `,
            className: "",
            iconSize: [130, 118],
            iconAnchor: [65, 91],
          });
          L.marker(shape.position, { icon }).addTo(group);
        } else {
          const icon = L.divIcon({
            html: `<div style="background:${shape.color}" class="map-pin"></div>`,
            className: "",
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });
          L.marker(shape.position, { icon })
            .bindTooltip(escapeHtml(shape.label), {
              permanent: true,
              direction: "top",
              className: "map-label",
            })
            .addTo(group);
        }
      } else if (shape.type === "text") {
        const icon = L.divIcon({
          html: `<div class="map-text" style="color:${shape.color}">${escapeHtml(shape.label)}</div>`,
          className: "",
          iconSize: [0, 0],
        });
        L.marker(shape.position, { icon }).addTo(group);
      }
    }
  }, [shapes, mapReady]);

  const cancelDraw = () => {
    drawPointsRef.current = [];
    setDrawPointCount(0);
    clearDrawPreview();
    setTool("select");
  };

  const removeShape = (id: string) => {
    setShapes((prev) => prev.filter((s) => s.id !== id));
  };

  const renameShape = (id: string, label: string) => {
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));
  };

  const setShapeImageUrl = (id: string, imageUrl: string) => {
    setShapes((prev) =>
      prev.map((s) => (s.id === id && s.type === "pin" ? { ...s, imageUrl: imageUrl || undefined } : s))
    );
  };

  const toggleShapeDashed = (id: string) => {
    setShapes((prev) =>
      prev.map((s) => (s.id === id && s.type === "line" ? { ...s, dashed: !s.dashed } : s))
    );
  };

  const handleSave = async () => {
    const map = mapRef.current;
    if (!map) return;
    setSaving(true);
    try {
      const center = map.getCenter();
      await saveProjectMap(projectId, {
        centerLat: center.lat,
        centerLng: center.lng,
        zoom: map.getZoom(),
        shapes,
      });
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!mapContainerRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(mapContainerRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${projectName || "ban-do"}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <style>{`
        .map-label { background: rgba(0,0,0,0.7); color: #fff; border: none; font-weight: 600; padding: 2px 6px; }
        .map-label::before { display: none; }
        .map-pin { width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.5); }
        .map-text { font-weight: 700; font-size: 14px; text-shadow: 0 1px 3px rgba(0,0,0,0.8); white-space: nowrap; }
        .map-start-point { width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 3px solid #111; animation: map-pulse 1.2s infinite; }
        @keyframes map-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        .map-photo-pin { display: flex; flex-direction: column; align-items: center; width: 130px; }
        .map-photo-card { width: 120px; height: 68px; border-radius: 8px; overflow: hidden; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.5); }
        .map-photo-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .map-photo-line { width: 2px; height: 14px; background: #fff; }
        .map-photo-label { margin-top: 4px; font-weight: 700; font-size: 12px; text-shadow: 0 1px 3px rgba(0,0,0,0.8); white-space: nowrap; }
      `}</style>

      <div className="flex flex-wrap items-center gap-2">
        <ToolButton active={tool === "select"} onClick={() => setTool("select")}>
          Chọn
        </ToolButton>
        <ToolButton active={tool === "polygon"} onClick={() => setTool("polygon")}>
          Vẽ vùng đất
        </ToolButton>
        <ToolButton active={tool === "line"} onClick={() => setTool("line")}>
          Vẽ đường ranh
        </ToolButton>
        <ToolButton active={tool === "pin"} onClick={() => setTool("pin")}>
          Ghim vị trí
        </ToolButton>
        <ToolButton active={tool === "text"} onClick={() => setTool("text")}>
          Chữ đồ họa
        </ToolButton>

        {activePresets && (
          <div className="mx-1 flex items-center gap-1">
            {activePresets.map((p) => (
              <button
                key={p.value + p.label}
                type="button"
                title={p.label}
                onClick={() => setPreset(p)}
                className={`h-6 w-6 rounded-full border-2 ${preset.value === p.value && preset.label === p.label ? "border-ink" : "border-transparent"}`}
                style={{ backgroundColor: p.value }}
              />
            ))}
          </div>
        )}

        {tool === "line" && (
          <div className="flex items-center gap-1 rounded-md border border-line p-0.5">
            <button
              type="button"
              onClick={() => setLineDashed(false)}
              className={`rounded-sm px-2 py-1 text-label ${!lineDashed ? "bg-ink text-white" : "text-ink-soft"}`}
            >
              Nét liền
            </button>
            <button
              type="button"
              onClick={() => setLineDashed(true)}
              className={`rounded-sm px-2 py-1 text-label ${lineDashed ? "bg-ink text-white" : "text-ink-soft"}`}
            >
              Nét đứt
            </button>
          </div>
        )}

        {(tool === "polygon" || tool === "line") && (
          <>
            <Button type="button" size="sm" variant="secondary" onClick={() => finishShape(tool)}>
              Hoàn tất ({drawPointCount})
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={cancelDraw}>
              Hủy
            </Button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {savedAt && (
            <span className="text-caption text-slate">Đã lưu {savedAt.toLocaleTimeString("vi-VN")}</span>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={handleExport} loading={exporting}>
            Xuất ảnh PNG
          </Button>
          <Button type="button" size="sm" onClick={handleSave} loading={saving}>
            Lưu
          </Button>
        </div>
      </div>

      <p className="text-caption text-slate">
        {tool === "polygon" &&
          "Bấm trên bản đồ để thêm điểm, bấm lại đúng điểm đầu tiên (chấm nhấp nháy) hoặc bấm đúp để đóng vùng."}
        {tool === "line" && "Bấm trên bản đồ để thêm điểm, bấm đúp hoặc nút Hoàn tất để kết thúc đường."}
        {tool === "pin" && "Bấm trên bản đồ để đặt điểm ghim."}
        {tool === "text" && "Bấm trên bản đồ để đặt nhãn chữ."}
        {tool === "select" && "Chọn công cụ ở trên để bắt đầu vẽ."}
      </p>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div
          ref={mapContainerRef}
          className="aspect-video w-full flex-1 overflow-hidden rounded-md border border-line bg-paper-raised lg:aspect-auto lg:h-[560px]"
        />

        <div className="w-full shrink-0 space-y-2 lg:w-72">
          <h3 className="text-caption font-semibold uppercase tracking-wide text-slate">
            Đối tượng ({shapes.length})
          </h3>
          {shapes.length === 0 && (
            <p className="text-caption text-slate">Chưa có đối tượng nào trên bản đồ.</p>
          )}
          <ul className="space-y-1">
            {shapes.map((shape) => (
              <li key={shape.id} className="rounded-md border border-line bg-paper-raised px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: shape.color }}
                  />
                  <input
                    value={shape.label}
                    onChange={(e) => renameShape(shape.id, e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-caption text-ink outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeShape(shape.id)}
                    className="shrink-0 text-caption text-slate hover:text-stamp"
                  >
                    Xóa
                  </button>
                </div>
                {shape.type === "pin" && (
                  <input
                    value={shape.imageUrl ?? ""}
                    onChange={(e) => setShapeImageUrl(shape.id, e.target.value)}
                    placeholder="URL ảnh (tuỳ chọn)"
                    className="mt-1 w-full rounded-sm border border-line bg-paper px-2 py-1 text-label text-ink-soft outline-none"
                  />
                )}
                {shape.type === "line" && (
                  <button
                    type="button"
                    onClick={() => toggleShapeDashed(shape.id)}
                    className="mt-1 text-label text-ink-soft hover:text-ink"
                  >
                    Kiểu nét: {shape.dashed ? "Nét đứt" : "Nét liền"} (bấm để đổi)
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" size="sm" variant={active ? "primary" : "secondary"} onClick={onClick}>
      {children}
    </Button>
  );
}
