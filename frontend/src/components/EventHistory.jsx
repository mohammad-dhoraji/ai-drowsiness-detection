import { motion } from "framer-motion";
import { Clock, RefreshCw, History } from "lucide-react";

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function severityBadgeClass(severity) {
  if (severity === "HIGH") return "bg-red-500/20 text-red-500 border border-red-500/30";
  if (severity === "MEDIUM") return "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
  return "bg-green-500/20 text-green-500 border border-green-500/30";
}

export default function EventHistory({ events, loading, error, onRefresh }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass rounded-2xl p-4 sm:p-5 group hover:border-primary/30 transition-all duration-500"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <History className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-lg">Event History</h2>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 bg-[hsl(var(--muted))] rounded-lg text-sm disabled:opacity-60 flex items-center gap-1.5 hover:bg-[hsl(var(--border))] transition w-full sm:w-auto"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <p className="text-sm text-destructive mb-3">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))]">
            <tr>
              <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">Timestamp</th>
              <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">Duration</th>
              <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">EAR</th>
              <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">Severity</th>
            </tr>
          </thead>

          <tbody>
            {events.length === 0 ? (
              <tr className="border-t border-[hsl(var(--border))]">
                <td className="py-6 text-center text-muted-foreground" colSpan={4}>
                  {loading ? "Loading events..." : "No events recorded"}
                </td>
              </tr>
            ) : (
              events.map((event, i) => (
                <motion.tr
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))/50]"
                >
                  <td className="py-2.5 px-3 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{formatDate(event.created_at)}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs sm:text-sm">{Number(event.duration_seconds ?? 0).toFixed(1)}s</td>
                  <td className="py-2.5 px-3 font-mono text-xs sm:text-sm">{Number(event.ear_value ?? 0).toFixed(3)}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${severityBadgeClass(
                        event.severity
                      )}`}
                    >
                      {event.severity || "LOW"}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
