function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function severityBadgeClass(severity) {
  if (severity === "HIGH") return "bg-red-100 text-red-700";
  if (severity === "MEDIUM") return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
}

export default function EventHistory({ events, loading, error, onRefresh }) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 col-span-3 border dark:border-gray-800">
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold text-lg">Event History</h2>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-md text-sm disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b dark:border-gray-800 text-left">
            <tr>
              <th className="py-2">Timestamp</th>
              <th>Duration</th>
              <th>EAR</th>
              <th>Severity</th>
            </tr>
          </thead>

          <tbody>
            {events.length === 0 ? (
              <tr className="border-b dark:border-gray-800">
                <td className="py-2" colSpan={4}>
                  {loading ? "Loading events..." : "No events recorded"}
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-b dark:border-gray-800">
                  <td className="py-2">{formatDate(event.created_at)}</td>
                  <td>{Number(event.duration_seconds ?? 0).toFixed(1)}s</td>
                  <td>{Number(event.ear_value ?? 0).toFixed(3)}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${severityBadgeClass(
                        event.severity
                      )}`}
                    >
                      {event.severity || "LOW"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
