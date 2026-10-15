import { formatDate } from "@/lib/format";

export default function ProgressChart({ points }: { points: { score: number; date: string }[] }) {
  const W = 640, H = 220, padL = 34, padR = 16, padT = 16, padB = 30;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = (i: number) => padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const area = points.length > 1 ? `${path} L${x(points.length - 1)},${padT + innerH} L${x(0)},${padT + innerH} Z` : "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Score trend over your last ${points.length} interviews`}>
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} stroke="#E1E4EE" strokeDasharray={g === 0 ? undefined : "3 5"} />
          <text x={padL - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="#8A8FB0">{g}</text>
        </g>
      ))}
      {area && <path d={area} fill="#5B3DF5" opacity="0.08" />}
      {points.length > 1 && <path d={path} fill="none" stroke="#5B3DF5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => {
        const last = i === points.length - 1;
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.score)} r={last ? 6 : 4} fill={last ? "#FFC93C" : "#fff"} stroke="#5B3DF5" strokeWidth="2.5" />
            {(points.length <= 6 || i % 2 === 0 || last) && <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#8A8FB0">{formatDate(p.date)}</text>}
            {last && <text x={x(i)} y={y(p.score) - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1B1F4B">{Math.round(p.score)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
