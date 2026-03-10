import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Car, RefreshCw, Users } from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { getMyDrivers } from "../services/guardianService";
import {
  getGuardianNotifications,
  markGuardianNotificationRead,
} from "../services/logsService";

function formatDate(value) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString();
}

function severityClass(severity) {
  if (severity === "HIGH") return "bg-red-500/20 text-red-500 border border-red-500/30";
  if (severity === "MEDIUM") return "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
  return "bg-green-500/20 text-green-500 border border-green-500/30";
}

export default function GuardianDashboardPage({ accessToken, currentUserId }) {
  const [drivers, setDrivers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [error, setError] = useState("");

  const loadDrivers = useCallback(async () => {
    if (!accessToken) return;
    setLoadingDrivers(true);

    try {
      const response = await getMyDrivers(accessToken);
      setDrivers(response?.drivers || []);
    } catch (err) {
      setError(err?.message || "Unable to fetch linked drivers");
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  }, [accessToken]);

  const loadNotifications = useCallback(async () => {
    if (!accessToken) return;
    setLoadingNotifications(true);

    try {
      const response = await getGuardianNotifications(accessToken, {
        page: 1,
        page_size: 20,
      });
      setNotifications(response?.notifications || []);
    } catch (err) {
      setError(err?.message || "Unable to fetch notifications");
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, [accessToken]);

  useEffect(() => {
    setError("");
    loadDrivers();
    loadNotifications();
  }, [loadDrivers, loadNotifications]);

  useEffect(() => {
    if (!accessToken || !currentUserId) return undefined;

    const channel = supabase
      .channel(`guardian-notifications-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guardian_notifications",
          filter: `guardian_id=eq.${currentUserId}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accessToken, currentUserId, loadNotifications]);

  const handleMarkRead = useCallback(
    async (notificationId) => {
      if (!accessToken) return;
      try {
        await markGuardianNotificationRead(accessToken, notificationId);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId ? { ...item, is_read: true } : item
          )
        );
      } catch (err) {
        setError(err?.message || "Unable to update notification");
      }
    },
    [accessToken]
  );

  const loading = loadingDrivers || loadingNotifications;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6"
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
              <p className="text-sm text-muted-foreground">Monitor your linked drivers</p>
            </div>
          </div>
          <button
            onClick={() => {
              setError("");
              loadDrivers();
              loadNotifications();
            }}
            disabled={loading}
            className="rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm hover:bg-[hsl(var(--muted))] flex items-center gap-2 transition w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error ? <p className="text-sm text-destructive mt-4">{error}</p> : null}

        {!loadingDrivers && drivers.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">No linked drivers found.</p>
        ) : null}

        {!loadingDrivers && drivers.length > 0 ? (
          <ul className="mt-4 sm:mt-6 space-y-3">
            {drivers.map((driver, i) => (
              <motion.li
                key={driver.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
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

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass rounded-2xl p-4 sm:p-6 group hover:border-primary/30 transition-all duration-500"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg">Recent Driver Alerts</h3>
        </div>

        {loadingNotifications ? (
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent notifications.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {item.driver_name || item.driver_email || "Driver"}: {item.message}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs ${severityClass(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatDate(item.created_at)}
                </div>
                {!item.is_read ? (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    className="mt-3 text-xs px-2.5 py-1.5 rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition"
                  >
                    Mark as read
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
