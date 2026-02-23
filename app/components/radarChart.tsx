"use client";

import { useMemo } from "react";
import type { Radar } from "../lib/analysisSchema";

const AXES: Array<{ key: keyof Radar; label: string }> = [
  { key: "continuity", label: "課題継続性" },
  { key: "exploration", label: "探索・深掘り" },
  { key: "breadth", label: "技術横断性" },
  { key: "implementation", label: "実装具体性" },
  { key: "practicality", label: "運用・現実視点" },
  { key: "learning", label: "学習・理解志向" },
];

export function RadarChart({ radar, size = 280 }: { radar: Radar; size?: number }) {
  const cx = 60 + size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.78;

  const points = useMemo(() => {
    const n = AXES.length;
    return AXES.map((a, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const v = radar[a.key];
      return {
        x: cx + Math.cos(angle) * r * v,
        y: cy + Math.sin(angle) * r * v,
      };
    });
  }, [radar, cx, cy, r]);

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size+150} height={size+30} className="p-4 border rounded-xl bg-white">
      {/* grid */}
      {gridLevels.map((lvl) => {
        const n = AXES.length;
        const poly = AXES.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const x = cx + Math.cos(angle) * r * lvl;
          const y = cy + Math.sin(angle) * r * lvl;
          return `${x},${y}`;
        }).join(" ");
        return <polygon key={lvl} points={poly} fill="none" stroke="currentColor" className="text-gray-200" />;
      })}

      {/* axis lines + labels */}
      {AXES.map((a, i) => {
        const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
        const x2 = cx + Math.cos(angle) * r;
        const y2 = cy + Math.sin(angle) * r;

        const lx = cx + Math.cos(angle) * (r + 18);
        const ly = cy + Math.sin(angle) * (r + 18);

        const anchor =
          Math.abs(Math.cos(angle)) < 0.2 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";

        return (
          <g key={a.key}>
            <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="currentColor" className="text-gray-200" />
            <text
              x={lx}
              y={ly}
              fontSize={11}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-gray-700"
            >
              {a.label}
            </text>
          </g>
        );
      })}

      {/* data polygon */}
      <polygon points={polygon} fill="currentColor" className="text-black/10" />
      <polygon points={polygon} fill="none" stroke="currentColor" className="text-black" />
      {points.map((p, idx) => (
        <circle key={idx} cx={p.x} cy={p.y} r={3} fill="currentColor" className="text-black" />
      ))}
    </svg>
  );
}
