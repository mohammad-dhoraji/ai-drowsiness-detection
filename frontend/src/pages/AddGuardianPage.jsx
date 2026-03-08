import { useCallback, useEffect, useState } from "react";
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
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
        Link Guardian
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
        Link a guardian account using guardian email.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={guardianEmail}
          onChange={(event) => setGuardianEmail(event.target.value)}
          placeholder="guardian@email.com"
          required
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-70"
        >
          {loading ? "Adding..." : "Add Guardian"}
        </button>
      </form>

      {message ? (
        <p className="mt-3 text-sm text-green-600 dark:text-green-400">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">My Guardians</h3>
        {listLoading ? (
          <p className="text-sm text-gray-500 mt-2">Loading...</p>
        ) : guardians.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">No guardians linked yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {guardians.map((guardian) => (
              <li
                key={guardian.id}
                className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100">{guardian.name || "Guardian"}</p>
                <p className="text-gray-600 dark:text-gray-400">{guardian.email}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
