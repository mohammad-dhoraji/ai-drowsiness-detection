import { useCallback, useEffect, useState } from "react";
import { getMyDrivers } from "../services/guardianService";

export default function GuardianDashboardPage({ accessToken }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDrivers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");

    try {
      const response = await getMyDrivers(accessToken);
      setDrivers(response?.drivers || []);
    } catch (err) {
      setError(err?.message || "Unable to fetch linked drivers");
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Guardian Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Drivers linked to your guardian account.
            </p>
          </div>
          <button
            onClick={loadDrivers}
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Refresh
          </button>
        </div>

        {loading ? <p className="text-sm text-gray-500 mt-4">Loading...</p> : null}
        {error ? <p className="text-sm text-red-600 dark:text-red-400 mt-4">{error}</p> : null}

        {!loading && !error && drivers.length === 0 ? (
          <p className="text-sm text-gray-500 mt-4">No linked drivers found.</p>
        ) : null}

        {!loading && drivers.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {drivers.map((driver) => (
              <li
                key={driver.id}
                className="rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100">{driver.name || "Driver"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{driver.email}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
