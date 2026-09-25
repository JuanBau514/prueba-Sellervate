// Weekly average score (1–4) for one brand, with n under every week and the
// brand's interventions as numbered markers. Server-rendered SVG, no chart
// library. One series, so no legend: the section title names it. Native
// <title> elements give a hover tooltip; the table below is the full-data view.

export type TrendWeek = { weekStart: string; reviews: number; average: number | null; critical: number };
export type TrendChange = { number: number; date: string; note: string };

const width = 640;
const height = 232;
const margin = { top: 28, right: 44, bottom: 50, left: 32 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

const dayMs = 86_400_000;
const weekLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const parseDay = (day: string) => Date.parse(`${day}T00:00:00Z`);

export function WeeklyTrendChart({ title, weeks, changes }: { title: string; weeks: TrendWeek[]; changes: TrendChange[] }) {
  // The x domain runs in weeks from the first week start. It extends past the
  // last week start when a change falls later in that week, so its marker stays
  // inside the plot instead of being clipped.
  const firstWeek = parseDay(weeks[0].weekStart);
  const weekIndex = (day: string) => (parseDay(day) - firstWeek) / (7 * dayMs);
  const domainEnd = Math.max(weeks.length - 1, ...changes.map((change) => weekIndex(change.date)), 1);
  const step = plotWidth / domainEnd;
  const x = (index: number) => margin.left + index * step;
  const y = (score: number) => margin.top + ((4 - score) / 3) * plotHeight;
  const xForDate = (day: string) => x(weekIndex(day));

  // Break the line where a week has no reviews: a gap is not a zero.
  const segments: string[] = [];
  let current: string[] = [];
  weeks.forEach((week, index) => {
    if (week.average === null) {
      if (current.length > 1) segments.push(current.join(" "));
      current = [];
    } else {
      current.push(`${current.length === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(week.average).toFixed(1)}`);
    }
  });
  if (current.length > 1) segments.push(current.join(" "));

  const lastIndex = weeks.findLastIndex((week) => week.average !== null);
  const visibleChanges = changes.filter((change) => {
    const position = xForDate(change.date);
    return position >= margin.left - 1 && position <= margin.left + plotWidth + 1;
  });

  return (
    <figure>
      {/* Keeps 11px labels legible on phones: scroll sideways instead of shrinking text. */}
      <div className="-mx-1 overflow-x-auto px-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full min-w-[34rem]"
        role="img"
        aria-labelledby="trend-title trend-desc"
      >
        <title id="trend-title">{title}</title>
        <desc id="trend-desc">
          {weeks
            .map((week) =>
              week.average === null
                ? `Week of ${weekLabel.format(parseDay(week.weekStart))}: no reviews`
                : `Week of ${weekLabel.format(parseDay(week.weekStart))}: ${week.average.toFixed(2)} from ${week.reviews} reviews`,
            )
            .join(". ")}
        </desc>

        {[1, 2, 3, 4].map((score) => (
          <g key={score}>
            <line
              x1={margin.left}
              x2={margin.left + plotWidth}
              y1={y(score)}
              y2={y(score)}
              stroke="var(--color-rule)"
              strokeWidth={1}
            />
            <text x={margin.left - 10} y={y(score)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-muted)">
              {score}
            </text>
          </g>
        ))}

        {visibleChanges.map((change) => {
          const position = xForDate(change.date);
          return (
            <g key={change.number}>
              <line
                x1={position}
                x2={position}
                y1={margin.top - 6}
                y2={margin.top + plotHeight}
                stroke="var(--color-base-content)"
                strokeOpacity={0.35}
                strokeWidth={1}
              />
              <circle cx={position} cy={margin.top - 14} r={8} fill="var(--color-base-content)" />
              <text x={position} y={margin.top - 14} dy="0.35em" textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--color-sheet)">
                {change.number}
              </text>
              <title>{`Change ${change.number}, ${weekLabel.format(parseDay(change.date))}: ${change.note}`}</title>
            </g>
          );
        })}

        {segments.map((path, index) => (
          <path key={index} d={path} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {weeks.map((week, index) => (
          <g key={week.weekStart}>
            {week.average !== null && (
              <g>
                <circle cx={x(index)} cy={y(week.average)} r={16} fill="transparent" />
                <circle
                  cx={x(index)}
                  cy={y(week.average)}
                  r={5}
                  fill="var(--color-primary)"
                  stroke="var(--color-sheet)"
                  strokeWidth={2}
                />
                <title>
                  {`Week of ${weekLabel.format(parseDay(week.weekStart))}: average ${week.average.toFixed(2)}, n = ${week.reviews}` +
                    (week.critical > 0 ? `, ${week.critical} with a critical issue` : "")}
                </title>
              </g>
            )}
            <text x={x(index)} y={margin.top + plotHeight + 18} textAnchor="middle" fontSize={11} fill="var(--color-base-content)">
              {weekLabel.format(parseDay(week.weekStart))}
            </text>
            <text x={x(index)} y={margin.top + plotHeight + 34} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
              n = {week.reviews}
            </text>
          </g>
        ))}

        {lastIndex >= 0 && (
          <text
            x={x(lastIndex) + 10}
            y={y(weeks[lastIndex].average!)}
            dy="0.32em"
            fontSize={12}
            fontWeight={600}
            fill="var(--color-base-content)"
          >
            {weeks[lastIndex].average!.toFixed(1)}
          </text>
        )}
      </svg>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs text-primary select-none">Show the numbers as a table</summary>
        <table className="table table-sm mt-2">
          <thead>
            <tr className="text-muted">
              <th>Week of</th>
              <th className="text-right">Average</th>
              <th className="text-right">n</th>
              <th className="text-right">With a critical issue</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.weekStart} className="border-rule tabular-nums">
                <td>{weekLabel.format(parseDay(week.weekStart))}</td>
                <td className="text-right">{week.average === null ? "—" : week.average.toFixed(2)}</td>
                <td className="text-right">{week.reviews}</td>
                <td className="text-right">{week.critical}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
