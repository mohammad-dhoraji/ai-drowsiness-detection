import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Plus } from "lucide-react";
import { getMyGuardians, linkGuardian } from "../services/guardianService";

export default function AddGuardianPage({ accessToken }) {
  const [guardianEmail, setGuardianEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [guardians, setGuardians] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const loadGuardians = useCallback(async () => {
    if (!accessToken) return;

    setListLoading(true);
    try {
      const response = await getMyGuardians(accessToken);
      setGuardians(response?.guardians || []);
    } catch {
      setGuardians([]);
    } finally {
      setListLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadGuardians();
  }, [loadGuardians]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await linkGuardian(accessToken, guardianEmail);
      setMessage("Guardian linked successfully.");
      setGuardianEmail("");
      await loadGuardians();
    } catch (err) {
      setError(err?.message || "Unable to link guardian");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-4 sm:p-6 group hover:border-primary/30 transition-all duration-500"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-display font-semibold">
            Link Guardian
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect a guardian to receive alerts
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={guardianEmail}
          onChange={(event) => setGuardianEmail(event.target.value)}
          placeholder="guardian@email.com"
          required
          className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 sm:py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-70 flex items-center justify-center gap-2 transition min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          {loading ? "Adding..." : "Add Guardian"}
        </button>
      </form>

      {message ? (
        <p className="mt-3 text-sm text-green-500">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3">My Guardians</h3>
        {listLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : guardians.length === 0 ? (
          <p className="text-sm text-muted-foreground">No guardians linked yet.</p>
        ) : (
          <ul className="space-y-2">
            {guardians.map((guardian) => (
              <li
                key={guardian.id}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3"
              >
                <p className="font-medium">{guardian.name || "Guardian"}</p>
                <p className="text-sm text-muted-foreground">{guardian.email}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  );
}
