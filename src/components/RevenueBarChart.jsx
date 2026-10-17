import { useId } from "react";
import { formatCompact, formatKES } from "../api/ChartFormat";

// Round the axis maximum up to a "nice" number so the 4 gridlines get tidy labels.
function niceCeil(max) {
  if (!(max > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const norm = max / pow;
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((n) => n >= norm) ?? 10;
  return step * pow;
}

const GRID_LINES = 4;
const BASE = "#5B7BA6";
const HIGHLIGHT = "#BF9A63";

/**
 * Responsive, dark-mode aware bar chart built from plain HTML/CSS (no chart
 * library), matching the rest of the admin dashboard.
 *
 * data: [{ key, label, value, detail?, highlight? }]
 *   - detail: optional second tooltip line, e.g. "12 orders"
 *   - highlight: draws the bar in the accent colour
 * onSelect(key): if given, bars become buttons (used to pick a year)
 */
export default function RevenueBarChart({ data, ariaLabel, onSelect, height = 240 }) {
  const titleId = useId();
  const max = niceCeil(Math.max(...data.map((d) => d.value), 0));
  const ticks = Array.from({ length: GRID_LINES + 1 }, (_, i) => (max / GRID_LINES) * i);

  return (
    <div role="group" aria-labelledby={titleId}>
      <span id={titleId} className="sr-only">{ariaLabel}</span>

      <div className="flex">
        {/* Y axis labels */}
        <div className="relative w-12 shrink-0" style={{ height }} aria-hidden="true">
          {ticks.map((t, i) => (
            <span
              key={i}
              className="absolute right-2 -translate-y-1/2 font-mono text-[10px] text-[#7C7669] dark:text-[#9FA8B8]"
              style={{ bottom: `${(i / GRID_LINES) * 100}%` }}
            >
              {formatCompact(t)}
            </span>
          ))}
        </div>

        {/* Plot area */}
        <div className="relative min-w-0 flex-1" style={{ height }}>
          {ticks.map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-dashed border-[#E7E2D8] dark:border-[#25344D]"
              style={{ bottom: `${(i / GRID_LINES) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-2">
            {data.map((d) => {
              const pct = (d.value / max) * 100;
              const Tag = onSelect ? "button" : "div";
              return (
                <div key={d.key} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                  <Tag
                    {...(onSelect
                      ? { type: "button", onClick: () => onSelect(d.key), "aria-label": `${d.label}: ${formatKES(d.value)}` }
                      : { tabIndex: 0, "aria-label": `${d.label}: ${formatKES(d.value)}` })}
                    className="flex h-full w-full items-end justify-center rounded-t focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63]"
                  >
                    <span
                      className="block w-full max-w-10 rounded-t-md transition-all duration-500 group-hover:opacity-80"
                      style={{
                        height: d.value > 0 ? `max(${pct}%, 3px)` : "0",
                        backgroundColor: d.highlight ? HIGHLIGHT : BASE,
                      }}
                    />
                  </Tag>

                  {/* Tooltip */}
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#101B2C] px-2.5 py-1.5 text-xs text-white shadow-lg group-focus-within:block group-hover:block dark:bg-white dark:text-[#101B2C]"
                    style={{ bottom: `calc(${Math.min(pct, 85)}% + 8px)` }}
                  >
                    <div className="font-semibold">{d.label}</div>
                    <div className="font-mono">{formatKES(d.value)}</div>
                    {d.detail && <div className="opacity-70">{d.detail}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X axis labels */}
      <div className="flex" aria-hidden="true">
        <div className="w-12 shrink-0" />
        <div className="flex min-w-0 flex-1 gap-1.5 pt-2 sm:gap-2">
          {data.map((d) => (
            <span
              key={d.key}
              className={`min-w-0 flex-1 truncate text-center text-[10px] sm:text-xs ${
                d.highlight ? "font-semibold text-[#A9834E] dark:text-[#BF9A63]" : "text-[#7C7669] dark:text-[#9FA8B8]"
              }`}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}