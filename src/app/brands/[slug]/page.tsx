import Link from "next/link";
import { notFound } from "next/navigation";

import { scoreLabels, severityStyles } from "@/components/review-labels";
import { WeeklyTrendChart, type TrendWeek } from "@/components/weekly-trend-chart";
import {
  getBrandBySlug,
  listBrandChanges,
  listBrandCoverage,
  listCriticalReviews,
  listIssuePatterns,
  listWeeklyScores,
} from "@/lib/data/brand-overview";
import { getViewer } from "@/lib/data/viewer";
import { ChangeForm } from "./change-form";

const dayMs = 86_400_000;
const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const sentFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

const isoDay = (time: number) => new Date(time).toISOString().slice(0, 10);
const parseDay = (day: string) => Date.parse(`${day}T00:00:00Z`);

/** Monday of the current ISO week, in UTC like Postgres date_trunc('week'). */
function currentWeekStart() {
  const today = new Date();
  const utcMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return utcMidnight - ((today.getUTCDay() + 6) % 7) * dayMs;
}

/** Today's date for the form's default and upper bound (request time). */
function todayIso() {
  return isoDay(Date.now());
}

function lastReview(days: number | null) {
  if (days === null) return "never reviewed";
  if (days === 0) return "reviewed today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="rounded-box border border-rule bg-sheet p-5 sm:p-6">
      <h2 id={`${id}-title`} className="text-lg font-semibold">
        {title}
      </h2>
      {description && <p className="mt-1 max-w-prose text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Evidence for one brand, for the leads of that brand only. Every figure comes
// from security_invoker views scoped to this brand_id and shows its sample size.
export default async function BrandOverviewPage({ params, searchParams }: PageProps<"/brands/[slug]">) {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "lead") notFound();

  const { slug } = await params;
  const { logged } = await searchParams;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const [weekly, critical, patterns, coverage, changes] = await Promise.all([
    listWeeklyScores(brand.id),
    listCriticalReviews(brand.id),
    listIssuePatterns(brand.id),
    listBrandCoverage(brand.id),
    listBrandChanges(brand.id),
  ]);

  const thisWeek = currentWeekStart();
  const firstData = weekly.length ? parseDay(weekly[0].week_start) : thisWeek;
  const start = Math.min(firstData, thisWeek - 3 * 7 * dayMs);
  const byWeek = new Map(weekly.map((week) => [week.week_start, week]));
  const weeks: TrendWeek[] = [];
  for (let time = start; time <= thisWeek; time += 7 * dayMs) {
    const row = byWeek.get(isoDay(time));
    weeks.push({
      weekStart: isoDay(time),
      reviews: row?.reviews ?? 0,
      average: row ? row.average_score : null,
      critical: row?.reviews_with_critical ?? 0,
    });
  }

  const chronological = [...changes].reverse().map((change, index) => ({ ...change, number: index + 1 }));

  const recent = weeks.slice(-4);
  const recentReviews = recent.reduce((sum, week) => sum + week.reviews, 0);
  const recentAverage = recentReviews
    ? recent.reduce((sum, week) => sum + (week.average ?? 0) * week.reviews, 0) / recentReviews
    : null;
  const recentCritical = recent.reduce((sum, week) => sum + week.critical, 0);
  const recurring = patterns.filter((pattern) => pattern.weeks >= 2);
  const longestGap = coverage[0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/brands" className="hover:text-base-content">
          ← Brands
        </Link>
      </nav>
      <h1 className="mt-3 text-xl font-semibold tracking-tight">{brand.name}</h1>
      <p className="mt-1 max-w-prose text-muted">{brand.voice_summary}</p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-box border border-rule bg-sheet px-5 py-4">
          <dt className="text-xs font-semibold text-muted">Average, last 4 weeks</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums">{recentAverage === null ? "—" : recentAverage.toFixed(1)}</span>
            <span className="text-sm text-muted">n = {recentReviews}</span>
          </dd>
        </div>
        <div className="rounded-box border border-rule bg-sheet px-5 py-4">
          <dt className="text-xs font-semibold text-muted">Reviews with a critical issue, last 4 weeks</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums">{recentCritical}</span>
            <span className="text-sm text-muted">of {recentReviews}</span>
          </dd>
        </div>
        <div className="rounded-box border border-rule bg-sheet px-5 py-4">
          <dt className="text-xs font-semibold text-muted">Longest without a review</dt>
          <dd className="mt-1">
            {longestGap ? (
              <>
                <span className="text-base font-semibold">{longestGap.specialist_name}</span>{" "}
                <span className="text-sm text-muted">{lastReview(longestGap.days_since_review)}</span>
              </>
            ) : (
              <span className="text-muted">No specialists assigned</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-6 space-y-6">
        <Section
          id="trend"
          title="Weekly average score"
          description="Replies grouped by the week they were sent, scored 1–4. n is the number of reviewed replies that week; read small weeks with care. Numbered markers are the changes recorded below."
        >
          <WeeklyTrendChart
            title={`${brand.name}: weekly average review score`}
            weeks={weeks}
            changes={chronological.map((change) => ({ number: change.number, date: change.happened_on, note: change.note }))}
          />
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section id="critical" title="Critical issues, last 4 weeks">
            {critical.length === 0 ? (
              <p className="text-muted">No reviewed reply had a critical issue in the last 4 weeks.</p>
            ) : (
              <ul className="divide-y divide-rule">
                {critical.map((item) => (
                  <li key={`${item.review_id}-${item.issue_label}`} className="flex items-start justify-between gap-4 py-2.5">
                    <div className="min-w-0 text-sm">
                      <p className="flex items-center gap-1.5 font-medium">
                        <span className={`size-2 rounded-full ${severityStyles.critical.dot}`} aria-hidden />
                        <span className="sr-only">Critical: </span>
                        {item.issue_label}
                      </p>
                      <p className="text-muted">
                        {item.specialist_name} · sent {sentFormat.format(new Date(item.sent_at))} · scored {item.score} ({scoreLabels[item.score]})
                      </p>
                    </div>
                    <Link href={`/review/${item.reply_id}`} className="shrink-0 text-sm text-primary hover:underline">
                      Open the reply
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section id="coverage" title="Review coverage" description="Days since each specialist's last review in this brand.">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="pb-2 font-semibold">Specialist</th>
                  <th className="pb-2 font-semibold">Last review</th>
                  <th className="pb-2 text-right font-semibold">Reviewed, 4 weeks</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((row) => (
                  <tr key={row.specialist_id} className="border-t border-rule">
                    <td className="py-2 font-medium">{row.specialist_name}</td>
                    <td className={`py-2 ${row.days_since_review === null || row.days_since_review >= 7 ? "font-semibold" : "text-muted"}`}>
                      {lastReview(row.days_since_review)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted">
                      {row.reviewed_28d} of {row.replies_28d}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>

        <Section
          id="patterns"
          title="Recurring issues"
          description="Issues by specialist over the last 6 weeks. The same issue in two or more different weeks is a pattern worth a conversation, not a bad day."
        >
          {patterns.length === 0 ? (
            <p className="text-muted">
              No issues were tagged in the last 6 weeks. Patterns appear once reviews tag what went wrong —{" "}
              <Link href="/review" className="text-primary hover:underline">open the review queue</Link>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted">
                  <tr>
                    <th className="pb-2 font-semibold">Issue</th>
                    <th className="pb-2 font-semibold">Specialist</th>
                    <th className="pb-2 pl-3 text-right font-semibold">Times</th>
                    <th className="pb-2 pl-3 text-right font-semibold">Weeks</th>
                    <th className="hidden pb-2 pl-3 text-right font-semibold whitespace-nowrap sm:table-cell">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.map((pattern) => {
                    const repeated = pattern.weeks >= 2;
                    return (
                      <tr key={`${pattern.tag_id}-${pattern.specialist_id}`} className={`border-t border-rule ${repeated ? "bg-base-200/70" : ""}`}>
                        <td className="py-2 pr-3">
                          <span className="flex items-center gap-1.5">
                            <span className={`size-2 shrink-0 rounded-full ${severityStyles[pattern.severity].dot}`} aria-hidden />
                            <span className={repeated ? "font-semibold" : ""}>{pattern.issue_label}</span>
                          </span>
                          <span className={`ml-3.5 text-xs font-semibold ${severityStyles[pattern.severity].text}`}>
                            {severityStyles[pattern.severity].name}
                          </span>
                          {repeated && <span className="text-xs text-muted"> · repeated in {pattern.weeks} different weeks</span>}
                        </td>
                        <td className="py-2 pr-3">{pattern.specialist_name}</td>
                        <td className="py-2 pl-3 text-right tabular-nums">{pattern.occurrences}</td>
                        <td className={`py-2 pl-3 text-right tabular-nums ${repeated ? "font-semibold" : ""}`}>{pattern.weeks}</td>
                        <td className="hidden py-2 pl-3 text-right whitespace-nowrap text-muted sm:table-cell">
                          {sentFormat.format(new Date(pattern.last_seen))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {recurring.length === 0 && <p className="mt-3 text-sm text-muted">No issue repeats across weeks yet.</p>}
            </div>
          )}
        </Section>

        <Section id="changes" title="What we changed" description="Briefings, procedure updates or template changes, so the trend can be read against them.">
          {logged && (
            <p role="status" className="mb-4 rounded-field border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
              Change recorded. It now appears on the chart.
            </p>
          )}
          {chronological.length === 0 ? (
            <p className="mb-4 text-muted">
              No changes recorded yet. Record the next briefing or procedure update below and it will appear on the trend.
            </p>
          ) : (
            <ol className="mb-5 space-y-2 text-sm">
              {[...chronological].reverse().map((change) => (
                <li key={change.id} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-base-content text-[10px] font-semibold text-sheet">
                    {change.number}
                  </span>
                  <span>
                    <span className="font-medium">{dayFormat.format(parseDay(change.happened_on))}</span> · {change.note}
                    <span className="text-muted"> — {change.author.full_name}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <ChangeForm brandId={brand.id} slug={brand.slug} today={todayIso()} />
        </Section>
      </div>
    </main>
  );
}
