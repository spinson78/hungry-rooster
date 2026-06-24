"use client";
import { useEffect, useState } from "react";

type KeywordRanking = {
  keyword: string;
  our_position: string;
  top_competitor: string;
};

type Recommendation = {
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
};

type SEOReport = {
  generated_at: string;
  week: string;
  keyword_rankings: KeywordRanking[];
  competitor_alerts: string[];
  recommendations: Recommendation[];
  quick_wins: string[];
  summary: string;
};

const PRIORITY_COLORS = {
  high:   "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-yellow-400/20 text-yellow-400 border-yellow-400/30",
  low:    "bg-zinc-700 text-zinc-400 border-zinc-600",
};

export default function SEOTab() {
  const [report, setReport] = useState<SEOReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/seo-report.json")
      .then(r => r.ok ? r.json() : Promise.reject("not found"))
      .then(setReport)
      .catch(() => setError("No report yet — the weekly agent runs every Monday at 8am."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-zinc-500 text-sm py-10 text-center">Loading SEO report...</div>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-black mb-1">SEO Report</h2>
          <p className="text-zinc-500 text-sm">Updated every Monday at 8am · Powered by AI web research</p>
        </div>
        <div className="text-right">
          {report && (
            <>
              <p className="text-xs text-zinc-500">{report.week}</p>
              <p className="text-xs text-zinc-600 mt-0.5">Generated {new Date(report.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="font-black text-lg text-white mb-2">First report coming Monday</p>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">{error}</p>
          <div className="mt-8 grid md:grid-cols-3 gap-4 text-left">
            {[
              { icon: "🔍", title: "Keyword Rankings", desc: "Checks where you rank for kosher food, catering, and delivery searches in Dallas" },
              { icon: "🥊", title: "Competitor Alerts", desc: "Monitors other kosher restaurants and caterers in Dallas for new reviews, posts, and activity" },
              { icon: "⚡", title: "Weekly Actions", desc: "5–8 specific things to do this week to move up in search results" },
            ].map(c => (
              <div key={c.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-2xl mb-3">{c.icon}</p>
                <p className="font-black text-white text-sm mb-1">{c.title}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-6">

          {/* Summary */}
          <div className="bg-zinc-900 border border-teal-500/30 rounded-2xl p-6">
            <p className="text-xs font-black uppercase tracking-widest text-teal-400 mb-3">This Week's Summary</p>
            <p className="text-zinc-200 leading-relaxed">{report.summary}</p>
          </div>

          {/* Quick wins */}
          {report.quick_wins?.length > 0 && (
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-6">
              <p className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-4">⚡ Quick Wins This Week</p>
              <ul className="space-y-2">
                {report.quick_wins.map((win, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-200">
                    <span className="text-yellow-400 font-black shrink-0">{i + 1}.</span>
                    {win}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Recommendations</p>
            <div className="space-y-3">
              {report.recommendations.map((rec, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${PRIORITY_COLORS[rec.priority]}`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm mb-1">{rec.action}</p>
                      <p className="text-zinc-500 text-xs leading-relaxed">{rec.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keyword rankings */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Keyword Rankings</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-5 py-3 text-zinc-500 text-xs font-black uppercase tracking-wide">Keyword</th>
                    <th className="text-left px-5 py-3 text-zinc-500 text-xs font-black uppercase tracking-wide">Our Position</th>
                    <th className="text-left px-5 py-3 text-zinc-500 text-xs font-black uppercase tracking-wide">Top Competitor</th>
                  </tr>
                </thead>
                <tbody>
                  {report.keyword_rankings.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800 last:border-0">
                      <td className="px-5 py-3 font-medium text-white">{row.keyword}</td>
                      <td className="px-5 py-3">
                        <span className={`font-black text-xs px-2 py-1 rounded-full ${row.our_position.includes("not found") ? "bg-red-500/20 text-red-400" : "bg-teal-500/20 text-teal-400"}`}>
                          {row.our_position}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-400 text-xs">{row.top_competitor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Competitor alerts */}
          {report.competitor_alerts?.length > 0 && (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Competitor Alerts</p>
              <div className="space-y-2">
                {report.competitor_alerts.map((alert, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 text-sm text-zinc-300">
                    🔔 {alert}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
