import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, RefreshCw, Car } from "lucide-react";
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6"
    >
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass rounded-2xl p-4 sm:p-6 group hover:border-primary/30 transition-all duration-500"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-semibold">
                Guardian Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                Monitor your linked drivers
              </p>
            </div>
          </div>
          <button
            onClick={loadDrivers}
            disabled={loading}
            className="rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm hover:bg-[hsl(var(--muted))] flex items-center gap-2 transition w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground mt-4">Loading...</p>
        ) : error ? (
          <p className="text-sm text-destructive mt-4">{error}</p>
        ) : null}

        {!loading && !error && drivers.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">No linked drivers found.</p>
        ) : null}

        {!loading && drivers.length > 0 ? (
          <ul className="mt-4 sm:mt-6 space-y-3">
            {drivers.map((driver, i) => (
              <motion.li
                key={driver.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 sm:py-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{driver.name || "Driver"}</p>
                  <p className="text-sm text-muted-foreground truncate">{driver.email}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        ) : null}
      </motion.section>
    </motion.div>
  );
}

