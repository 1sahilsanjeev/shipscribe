import React, { useMemo, useState, useRef } from 'react';

interface HeatmapData { date: string; count: number; }

const ActivityHeatmap: React.FC<{ data: HeatmapData[] }> = ({ data }) => {
  const CELL = 11; 
  const GAP  = 2;
  const COL  = CELL + GAP;

  const [tooltip, setTooltip] = useState<{ day: HeatmapData; x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { weeks, monthLabels, totalActivities } = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 364);
    
    // align to Sunday
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }

    const dataMap: Record<string, number> = {};
    let total = 0;
    (data || []).forEach(d => { dataMap[d.date] = d.count; total += d.count; });

    const days: HeatmapData[] = [];
    const current = new Date(startDate);
    
    // iterate until we pass endDate AND reach end of the current week
    while (current <= endDate || current.getDay() !== 0) {
      if (current > endDate) {
        days.push({ date: '', count: -1 });
      } else {
        // Build local yyyy-mm-dd
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        days.push({ date: dateStr, count: dataMap[dateStr] || 0 });
      }
      current.setDate(current.getDate() + 1);
    }

    const weeks: HeatmapData[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const labels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, i) => {
      const firstDay = week.find(d => d.date !== '');
      if (!firstDay) return;
      const monthParts = firstDay.date.split('-');
      if (monthParts.length < 2) return;
      const month = parseInt(monthParts[1], 10) - 1;
      
      if (month !== lastMonth) { 
        const currentPos = i * COL;
        const lastPos = labels.length > 0 ? labels[labels.length - 1].colIndex * COL : -100;
        
        // Show label if it's more than 35px away from the last label
        if (currentPos - lastPos > 35) {
          labels.push({ text: months[month], colIndex: i }); 
          lastMonth = month; 
        }
      }
    });

    return { weeks, monthLabels: labels, totalActivities: total };
  }, [data]);

  const getColor = (count: number) => {
    if (count === -1) return 'transparent';
    if (count === 0)  return 'hsl(220,14%,95%)'; // paper-warm
    if (count <= 2)   return 'hsl(224,83%,85%)';   
    if (count <= 5)   return 'hsl(224,83%,70%)';   
    if (count <= 10)  return 'hsl(224,76%,50%)';   
    return            'hsl(224,76%,35%)';           
  };

  const fmt = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length < 3) return d;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };



  return (
    <div className="relative select-none flex flex-col mx-auto w-max">
      {/* Month labels */}
      <div className="flex ml-[32px] mb-1.5 h-4 relative">
        {monthLabels.map((lbl, i) => (
          <span
            key={i}
            className="absolute text-[10px] font-bold text-ink-muted/80"
            style={{ left: `${lbl.colIndex * COL}px` }}
          >
            {lbl.text}
          </span>
        ))}
      </div>

      <div className="flex gap-0" ref={gridRef}>
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-[2px] pr-2 text-[9px] font-bold text-ink-soft w-[32px] shrink-0 text-left">
          <div style={{ height: CELL }}></div>
          <div style={{ height: CELL, lineHeight: `${CELL}px` }}>Mon</div>
          <div style={{ height: CELL }}></div>
          <div style={{ height: CELL, lineHeight: `${CELL}px` }}>Wed</div>
          <div style={{ height: CELL }}></div>
          <div style={{ height: CELL, lineHeight: `${CELL}px` }}>Fri</div>
          <div style={{ height: CELL }}></div>
        </div>

        {/* Cell grid */}
        <div className="flex gap-[2px] shrink-0">
          {weeks.map((week, ci) => (
            <div key={ci} className="flex flex-col gap-[2px] shrink-0">
              {week.map((day, ri) => (
                <div
                  key={ri}
                  className={`rounded-[2px] transition-all ${day.count !== -1 ? 'hover:scale-[1.3] cursor-pointer hover:ring-2 hover:ring-primary/40 z-10 hover:z-20' : ''}`}
                  style={{ width: CELL, height: CELL, backgroundColor: getColor(day.count) }}
                  onMouseEnter={(e) => {
                    if (day.count === -1) return;
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
      <div className="flex justify-between items-center mt-5 w-full pl-[32px]">
        <span className="text-[11px] font-bold text-ink-muted flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {totalActivities.toLocaleString()} activities in the past year
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] font-bold text-ink-muted mr-1">Less</span>
          {[0, 2, 5, 10, 15].map(v => (
            <div key={v} className="rounded-[3px]" style={{ width: CELL, height: CELL, backgroundColor: getColor(v) }} />
          ))}
          <span className="text-[10px] font-bold text-ink-muted ml-1">More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 w-0 h-0 flex items-start"
          style={{ left: tooltip.x, top: tooltip.y - 42 }}
        >
          <div 
            className="absolute whitespace-nowrap bg-ink text-white text-xs px-3 py-2 rounded-xl shadow-premium animate-in fade-in zoom-in duration-100"
            style={{
               ...(tooltip.x > (weeks.length * COL) / 2 ? { right: '4px' } : { left: '16px' })
            }}
          >
            <div className="font-bold">{tooltip.day.count} {tooltip.day.count === 1 ? 'activity' : 'activities'}</div>
            <div className="text-white/60 text-[10px] font-medium mt-0.5">{fmt(tooltip.day.date)}</div>
            
            {/* tooltip tail */}
            <div className={`absolute -bottom-1 w-3 h-3 bg-ink rotate-45 rounded-sm ${tooltip.x > (weeks.length * COL) / 2 ? 'right-4' : 'left-4'}`} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmap;
