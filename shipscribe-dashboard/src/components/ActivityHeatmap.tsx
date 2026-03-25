import React, { useMemo, useState, useRef } from 'react';

interface HeatmapData { date: string; count: number; }

const ActivityHeatmap: React.FC<{ data: HeatmapData[] }> = ({ data }) => {
  const [tooltip, setTooltip] = useState<{ day: HeatmapData; x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { weeks, monthLabels, totalActivities } = useMemo(() => {
    const today = new Date();
    const dataMap: Record<string, number> = {};
    let total = 0;
    data.forEach(d => { dataMap[d.date] = d.count; total += d.count; });

    const days: HeatmapData[] = [];
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, count: dataMap[dateStr] || 0 });
    }

    const weeks: HeatmapData[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const labels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const month = new Date(week[0].date).getMonth();
      if (month !== lastMonth) { labels.push({ text: months[month], colIndex: i }); lastMonth = month; }
    });

    return { weeks, monthLabels: labels, totalActivities: total };
  }, [data]);

  // Light-theme colors
  const getColor = (count: number) => {
    if (count === 0) return 'hsl(220,14%,93%)';   // paper-warm
    if (count <= 2)  return 'hsl(224,83%,85%)';   // light blue
    if (count <= 5)  return 'hsl(224,83%,70%)';   // medium blue
    if (count <= 10) return 'hsl(224,76%,50%)';   // primary
    return            'hsl(224,76%,35%)';           // dark blue
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const CELL = 12; // px per cell
  const GAP  = 2;
  const COL  = CELL + GAP;
  const LEFT_PAD = 32; // room for day labels

  return (
    <div className="relative select-none">
      {/* Month labels */}
      <div className="flex ml-8 mb-1 h-4 relative">
        {monthLabels.map((lbl, i) => (
          <span
            key={i}
            className="absolute text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider"
            style={{ left: `${LEFT_PAD - 8 + lbl.colIndex * COL}px` }}
          >
            {lbl.text}
          </span>
        ))}
      </div>

      <div className="flex gap-0" ref={gridRef}>
        {/* Day-of-week labels */}
        <div className="flex flex-col justify-between pr-2 text-[9px] font-mono text-gray-400 uppercase tracking-wide" style={{ height: `${7 * COL - GAP}px`, width: LEFT_PAD }}>
          <span>Mon</span>
          <span style={{ visibility: 'hidden' }}>Tue</span>
          <span>Wed</span>
          <span style={{ visibility: 'hidden' }}>Thu</span>
          <span>Fri</span>
          <span style={{ visibility: 'hidden' }}>Sat</span>
          <span style={{ visibility: 'hidden' }}>Sun</span>
        </div>

        {/* Cell grid */}
        <div className="flex gap-[2px]">
          {weeks.map((week, ci) => (
            <div key={ci} className="flex flex-col gap-[2px]">
              {week.map((day, ri) => (
                <div
                  key={ri}
                  className="rounded-[2px] cursor-pointer transition-transform hover:scale-110"
                  style={{ width: CELL, height: CELL, backgroundColor: getColor(day.count) }}
                  onMouseEnter={(e) => {
                    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
                    const parent = gridRef.current?.getBoundingClientRect();
                    if (parent) setTooltip({ day, x: rect.left - parent.left, y: rect.top - parent.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-between items-center mt-3">
        <span className="text-[10px] text-gray-400 font-mono">
          {totalActivities.toLocaleString()} activities in the past year
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-gray-400 font-mono">Less</span>
          {[0, 2, 5, 10, 15].map(v => (
            <div key={v} className="rounded-[2px]" style={{ width: CELL, height: CELL, backgroundColor: getColor(v) }} />
          ))}
          <span className="text-[9px] text-gray-400 font-mono">More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap"
          style={{ left: tooltip.x + 16, top: tooltip.y - 36 }}
        >
          <div className="font-semibold">{tooltip.day.count} {tooltip.day.count === 1 ? 'activity' : 'activities'}</div>
          <div className="text-gray-400 text-[10px]">{fmt(tooltip.day.date)}</div>
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmap;
