"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DealStage } from "@/types/database";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Waypoints } from "lucide-react";

export type GraphNode = {
  id: string;
  type: "customer" | "project" | "document";
  label: string;
  href?: string;
  external?: boolean; // href trỏ ra ngoài (Drive) → mở tab mới
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: "deal" | "doc";
  stage?: DealStage;
};

type SimNode = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null; // vị trí ghim khi kéo
  fy: number | null;
};

// Kích thước canvas ảo (toạ độ mô phỏng); viewBox sẽ pan/zoom bên trong.
const WIDTH = 1200;
const HEIGHT = 800;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

// Tham số lực.
const REPULSION = 6500;
const SPRING = 0.04;
const LINK_LEN = { deal: 130, doc: 70 } as const;
const CENTER_PULL = 0.02;
const DAMPING = 0.9;
const ALPHA_DECAY = 0.985;
const ALPHA_MIN = 0.02;

const NODE_FILL: Record<GraphNode["type"], string> = {
  customer: "var(--color-ink)",
  project: "var(--color-jade)",
  document: "var(--color-slate)",
};

const STAGE_STROKE: Record<DealStage, string> = {
  lead: "var(--color-slate)",
  viewing: "var(--color-amber)",
  deposit: "var(--color-amber)",
  contract: "var(--color-jade)",
  closed: "var(--color-jade)",
  lost: "var(--color-stamp)",
};

function edgeStroke(edge: GraphEdge) {
  if (edge.kind === "deal" && edge.stage) return STAGE_STROKE[edge.stage];
  return "var(--color-line)";
}

export function RelationshipGraph({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);

  const openNode = useCallback(
    (node: GraphNode) => {
      if (!node.href) return;
      if (node.external) {
        window.open(node.href, "_blank", "noopener,noreferrer");
      } else {
        router.push(node.href);
      }
    },
    [router]
  );

  const [showDocs, setShowDocs] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: WIDTH, h: HEIGHT });

  // Lọc theo toggle tài liệu.
  const visibleNodes = useMemo(
    () => (showDocs ? nodes : nodes.filter((n) => n.type !== "document")),
    [nodes, showDocs]
  );
  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );
  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
      ),
    [edges, visibleNodeIds]
  );

  const nodeById = useMemo(
    () => new Map(visibleNodes.map((n) => [n.id, n])),
    [visibleNodes]
  );

  // Bậc (degree) để quyết định bán kính và lân cận để highlight.
  const { degree, neighbors } = useMemo(() => {
    const deg = new Map<string, number>();
    const nb = new Map<string, Set<string>>();
    for (const n of visibleNodes) {
      deg.set(n.id, 0);
      nb.set(n.id, new Set());
    }
    for (const e of visibleEdges) {
      deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
      deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
      nb.get(e.source)?.add(e.target);
      nb.get(e.target)?.add(e.source);
    }
    return { degree: deg, neighbors: nb };
  }, [visibleNodes, visibleEdges]);

  function nodeRadius(node: GraphNode) {
    const base = node.type === "project" ? 9 : node.type === "customer" ? 7 : 4;
    return base + Math.min(6, (degree.get(node.id) ?? 0) * 0.8);
  }

  // Trạng thái mô phỏng giữ trong ref để không tạo lại mảng mỗi frame.
  const simRef = useRef<Map<string, SimNode>>(new Map());
  const alphaRef = useRef(1);
  const frameRef = useRef<number | null>(null);
  // Khi người dùng đã tự pan/zoom/kéo thì ngừng auto-fit để tôn trọng khung họ chọn.
  const userMovedRef = useRef(false);
  // Ảnh chụp vị trí để render (ref chỉ giữ vật lý; render đọc từ state này).
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );

  const snapshot = useCallback(() => {
    setPositions(
      new Map([...simRef.current.values()].map((nd) => [nd.id, { x: nd.x, y: nd.y }]))
    );
  }, []);

  // Khởi tạo / đồng bộ node mô phỏng khi tập node hiển thị đổi.
  useEffect(() => {
    const prev = simRef.current;
    const next = new Map<string, SimNode>();
    const n = visibleNodes.length;
    visibleNodes.forEach((node, i) => {
      const existing = prev.get(node.id);
      if (existing) {
        next.set(node.id, existing);
      } else {
        // Rải quanh vòng tròn quanh tâm.
        const angle = (i / Math.max(1, n)) * Math.PI * 2;
        const radius = 120 + Math.random() * 240;
        next.set(node.id, {
          id: node.id,
          x: CENTER_X + Math.cos(angle) * radius,
          y: CENTER_Y + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
        });
      }
    });
    simRef.current = next;
    alphaRef.current = 1;
    snapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleNodeIds]);

  const step = useCallback(() => {
    const sim = simRef.current;
    const arr = [...sim.values()];
    const alpha = alphaRef.current;

    // Lực: reset accumulator qua vx/vy tạm thời.
    const fx = new Map<string, number>();
    const fy = new Map<string, number>();
    for (const nd of arr) {
      fx.set(nd.id, 0);
      fy.set(nd.id, 0);
    }

    // Đẩy nhau (O(n^2)).
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i];
      for (let j = i + 1; j < arr.length; j++) {
        const b = arr[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 0.01) {
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
          d2 = 0.01;
        }
        const d = Math.sqrt(d2);
        const force = REPULSION / d2;
        const ux = (dx / d) * force;
        const uy = (dy / d) * force;
        fx.set(a.id, (fx.get(a.id) ?? 0) + ux);
        fy.set(a.id, (fy.get(a.id) ?? 0) + uy);
        fx.set(b.id, (fx.get(b.id) ?? 0) - ux);
        fy.set(b.id, (fy.get(b.id) ?? 0) - uy);
      }
    }

    // Lò xo dọc cạnh.
    for (const e of visibleEdges) {
      const s = sim.get(e.source);
      const t = sim.get(e.target);
      if (!s || !t) continue;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const L = LINK_LEN[e.kind];
      const diff = (d - L) * SPRING;
      const ux = (dx / d) * diff;
      const uy = (dy / d) * diff;
      fx.set(e.source, (fx.get(e.source) ?? 0) + ux);
      fy.set(e.source, (fy.get(e.source) ?? 0) + uy);
      fx.set(e.target, (fx.get(e.target) ?? 0) - ux);
      fy.set(e.target, (fy.get(e.target) ?? 0) - uy);
    }

    // Kéo về tâm + tích phân.
    for (const nd of arr) {
      if (nd.fx !== null && nd.fy !== null) {
        nd.x = nd.fx;
        nd.y = nd.fy;
        nd.vx = 0;
        nd.vy = 0;
        continue;
      }
      const ax = (fx.get(nd.id) ?? 0) + (CENTER_X - nd.x) * CENTER_PULL;
      const ay = (fy.get(nd.id) ?? 0) + (CENTER_Y - nd.y) * CENTER_PULL;
      nd.vx = (nd.vx + ax * alpha) * DAMPING;
      nd.vy = (nd.vy + ay * alpha) * DAMPING;
      nd.x += nd.vx;
      nd.y += nd.vy;
    }

    alphaRef.current = alpha * ALPHA_DECAY;
    snapshot();
  }, [visibleEdges, snapshot]);

  // Căn khung nhìn vừa với hộp bao của các node (+ lề).
  const fitView = useCallback(() => {
    const arr = [...simRef.current.values()];
    if (!arr.length) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const nd of arr) {
      minX = Math.min(minX, nd.x);
      minY = Math.min(minY, nd.y);
      maxX = Math.max(maxX, nd.x);
      maxY = Math.max(maxY, nd.y);
    }
    const pad = 90;
    const w = Math.max(320, maxX - minX + pad * 2);
    const h = Math.max(320, maxY - minY + pad * 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setViewBox({ x: cx - w / 2, y: cy - h / 2, w, h });
  }, []);

  // Vòng lặp animation: chạy tới khi nguội, tự fit khung nếu người dùng chưa can thiệp.
  const runLoop = useCallback(() => {
    if (frameRef.current !== null) return;
    function loop() {
      step();
      if (alphaRef.current > ALPHA_MIN) {
        frameRef.current = requestAnimationFrame(loop);
      } else {
        frameRef.current = null;
        if (!userMovedRef.current) fitView();
      }
    }
    frameRef.current = requestAnimationFrame(loop);
  }, [step, fitView]);

  useEffect(() => {
    runLoop();
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [runLoop]);

  const reheat = useCallback(
    (value = 0.4) => {
      alphaRef.current = Math.max(alphaRef.current, value);
      runLoop();
    },
    [runLoop]
  );

  // Chuyển toạ độ màn hình -> toạ độ SVG.
  const toGraph = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }, []);

  // Kéo node & pan nền.
  // Ngưỡng (px màn hình) trước khi một cú chạm được coi là "kéo" thay vì "bấm" —
  // cần thiết cho cảm ứng vì ngón tay luôn rung nhẹ vài px khi tap.
  const DRAG_THRESHOLD = 6;
  const dragRef = useRef<{ id: string; moved: boolean; startX: number; startY: number } | null>(
    null
  );
  // Giữ trạng thái "đã kéo" tới sau onClick để phân biệt click với kéo.
  const movedRef = useRef(false);
  const panRef = useRef<{ startX: number; startY: number; vbx: number; vby: number } | null>(
    null
  );
  // Theo dõi các pointer đang chạm trên nền để nhận diện pinch-zoom 2 ngón.
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ lastDist: number } | null>(null);

  const applyZoom = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const p = toGraph(clientX, clientY);
      setViewBox((vb) => {
        const w = Math.min(WIDTH * 3, Math.max(WIDTH * 0.15, vb.w * factor));
        const h = Math.min(HEIGHT * 3, Math.max(HEIGHT * 0.15, vb.h * factor));
        // Giữ điểm dưới con trỏ/giữa 2 ngón cố định.
        const x = p.x - ((p.x - vb.x) * w) / vb.w;
        const y = p.y - ((p.y - vb.y) * h) / vb.h;
        return { x, y, w, h };
      });
    },
    [toGraph]
  );

  function onNodePointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // Bỏ qua: một số trình duyệt/thao tác giả lập không có pointer đang hoạt động.
    }
    dragRef.current = { id, moved: false, startX: e.clientX, startY: e.clientY };
    movedRef.current = false;
    const p = toGraph(e.clientX, e.clientY);
    const nd = simRef.current.get(id);
    if (nd) {
      nd.fx = p.x;
      nd.fy = p.y;
    }
    reheat();
  }

  function onPointerMove(e: React.PointerEvent) {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pinchRef.current && pointersRef.current.size >= 2) {
      userMovedRef.current = true;
      const pts = [...pointersRef.current.values()].slice(0, 2);
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const factor = pinchRef.current.lastDist / dist;
      applyZoom((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2, factor);
      pinchRef.current.lastDist = dist;
      return;
    }
    if (dragRef.current) {
      const p = toGraph(e.clientX, e.clientY);
      const nd = simRef.current.get(dragRef.current.id);
      if (nd) {
        nd.fx = p.x;
        nd.fy = p.y;
      }
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        dragRef.current.moved = true;
        movedRef.current = true;
        userMovedRef.current = true;
      }
      reheat(0.2);
      return;
    }
    if (panRef.current) {
      userMovedRef.current = true;
      const pan = panRef.current;
      const scale = viewBox.w / (svgRef.current?.clientWidth || WIDTH);
      const dx = (e.clientX - pan.startX) * scale;
      const dy = (e.clientY - pan.startY) * scale;
      setViewBox((vb) => ({
        ...vb,
        x: pan.vbx - dx,
        y: pan.vby - dy,
      }));
    }
  }

  function onNodePointerUp(e: React.PointerEvent, node: GraphNode) {
    e.stopPropagation();
    dragRef.current = null;
    const nd = simRef.current.get(node.id);
    if (nd) {
      nd.fx = null;
      nd.fy = null;
    }
  }

  // Chọn/bỏ chọn bằng onClick (bắt cả chuột lẫn cảm ứng); bỏ qua nếu vừa kéo.
  function onNodeClick(e: React.MouseEvent, node: GraphNode) {
    e.stopPropagation();
    if (movedRef.current) return;
    setSelected((cur) => (cur === node.id ? null : node.id));
  }

  function onBackgroundPointerDown(e: React.PointerEvent) {
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Bỏ qua: một số trình duyệt/thao tác giả lập không có pointer đang hoạt động.
    }
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      panRef.current = null;
      const pts = [...pointersRef.current.values()];
      pinchRef.current = {
        lastDist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1,
      };
      return;
    }
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      vbx: viewBox.x,
      vby: viewBox.y,
    };
  }

  function onPointerUp(e: React.PointerEvent) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    panRef.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    userMovedRef.current = true;
    const factor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
    applyZoom(e.clientX, e.clientY, factor);
  }

  function resetView() {
    userMovedRef.current = false;
    setSelected(null);
    fitView();
    reheat(0.6);
  }

  const highlightSet = useMemo(() => {
    if (!selected) return null;
    const set = new Set<string>([selected]);
    for (const nb of neighbors.get(selected) ?? []) set.add(nb);
    return set;
  }, [selected, neighbors]);

  function isDim(id: string) {
    return highlightSet ? !highlightSet.has(id) : false;
  }

  if (!visibleNodes.length) {
    return (
      <div className="flex-1 rounded-md border border-line bg-paper-raised">
        <div className="flex h-full items-center justify-center p-6">
          <EmptyState
            icon={Waypoints}
            title="Chưa có dữ liệu để vẽ sơ đồ"
            description="Thêm khách hàng và liên kết họ với dự án để thấy mối quan hệ ở đây."
          />
        </div>
      </div>
    );
  }

  const docCount = nodes.filter((n) => n.type === "document").length;

  return (
    <div className="relative flex-1 overflow-hidden rounded-md border border-line bg-paper-raised">
      {/* Thanh điều khiển */}
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={showDocs ? "primary" : "secondary"}
          onClick={() => setShowDocs((v) => !v)}
        >
          {showDocs ? "Ẩn tài liệu" : "Hiện tài liệu"}
          {docCount ? ` (${docCount})` : ""}
        </Button>
        <Button size="sm" variant="secondary" onClick={resetView}>
          Về mặc định
        </Button>
      </div>

      {/* Chú thích */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1 rounded-md border border-line bg-paper/90 px-3 py-2 text-label text-ink-soft">
        <LegendDot color="var(--color-ink)" label="Khách hàng" />
        <LegendDot color="var(--color-jade)" label="Dự án" />
        <LegendDot color="var(--color-slate)" label="Tài liệu" />
      </div>

      <svg
        ref={svgRef}
        className="h-full w-full touch-none select-none"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onPointerDown={onBackgroundPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onClick={(e) => {
          if (e.target === svgRef.current) setSelected(null);
        }}
      >
        {/* Cạnh */}
        {visibleEdges.map((e, i) => {
          const s = positions.get(e.source);
          const t = positions.get(e.target);
          if (!s || !t) return null;
          const dim = highlightSet
            ? !(highlightSet.has(e.source) && highlightSet.has(e.target))
            : false;
          return (
            <line
              key={`${e.source}-${e.target}-${i}`}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke={edgeStroke(e)}
              strokeWidth={e.kind === "deal" ? 1.6 : 1}
              strokeOpacity={dim ? 0.12 : e.kind === "deal" ? 0.7 : 0.4}
            />
          );
        })}

        {/* Node */}
        {visibleNodes.map((node) => {
          const nd = positions.get(node.id);
          if (!nd) return null;
          const r = nodeRadius(node);
          const dim = isDim(node.id);
          const isSel = selected === node.id;
          return (
            <g
              key={node.id}
              transform={`translate(${nd.x} ${nd.y})`}
              opacity={dim ? 0.2 : 1}
              style={{ cursor: "pointer" }}
              onPointerDown={(e) => onNodePointerDown(e, node.id)}
              onPointerUp={(e) => onNodePointerUp(e, node)}
              onClick={(e) => onNodeClick(e, node)}
              onDoubleClick={() => openNode(node)}
            >
              <circle
                r={r}
                fill={NODE_FILL[node.type]}
                stroke={isSel ? "var(--color-stamp)" : "var(--color-paper-raised)"}
                strokeWidth={isSel ? 2.5 : 1.5}
              />
              <text
                x={0}
                y={r + 11}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-ink)"
                style={{ pointerEvents: "none" }}
              >
                {node.label.length > 24 ? `${node.label.slice(0, 23)}…` : node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Chi tiết node đang chọn */}
      {(() => {
        const node = selected ? nodeById.get(selected) : undefined;
        if (!node) return null;
        const typeLabel =
          node.type === "customer"
            ? "Khách hàng"
            : node.type === "project"
              ? "Dự án"
              : "Tài liệu";
        return (
          <div className="absolute bottom-3 left-3 z-10 max-w-xs rounded-md border border-line bg-paper/95 p-3 shadow-1">
            <p className="font-display text-body font-semibold text-ink">{node.label}</p>
            <p className="text-label uppercase tracking-wide text-slate">
              {typeLabel}
              {" · "}
              {degree.get(node.id) ?? 0} liên kết
            </p>
            {node.href && (
              <button
                className="mt-2 text-caption text-ink underline"
                onClick={() => openNode(node)}
              >
                {node.external ? "Mở tài liệu ↗" : "Mở chi tiết →"}
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
