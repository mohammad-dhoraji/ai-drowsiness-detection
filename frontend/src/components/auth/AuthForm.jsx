import { useState, useEffect } from "react";
import GoogleButton from "./GoogleButton";

export default function AuthForm({
  mode,
  onSubmit,
  onGoogle,
  loading,
  error,
  toggleMode,
  initialRole = "driver",
  onRoleChange,
}) {
  const [role, setRole] = useState(initialRole);

  // Sync internal state when initialRole prop changes
  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    // Notify parent component if callback provided
    if (onRoleChange) {
      onRoleChange(newRole);
    }
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      email,
      password,
      role,
    };

    await onSubmit(payload);
  };

  return (
    <div className="space-y-4">
      {/* Role Toggle */}
      <div className="flex bg-black/40 rounded-lg p-1 mb-6">
        <button
          onClick={() => handleRoleChange("driver")}
          className={`flex-1 py-2 rounded-md text-sm transition ${
            role === "driver" ? "bg-blue-600 text-white" : "text-gray-400"
          }`}
        >
          Driver
        </button>

        <button
          onClick={() => handleRoleChange("guardian")}
          className={`flex-1 py-2 rounded-md text-sm transition ${
            role === "guardian" ? "bg-blue-600 text-white" : "text-gray-400"
          }`}
        >
          Guardian
        </button>
      </div>

      <GoogleButton onClick={onGoogle} />

      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gray-700"></div>
        <span className="px-3 text-gray-400 text-sm">OR</span>
        <div className="flex-1 h-px bg-gray-700"></div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 transition rounded-lg font-medium text-white"
        >
          {loading
            ? "Loading..."
            : mode === "login"
            ? "login"
            : "Create Account"}
        </button>
      </form>

      <p className="text-sm text-gray-400 mt-6 text-center">
        {mode === "login"
          ? "Don't have an account?"
          : "Already have an account?"}

        <button
          onClick={toggleMode}
          className="ml-2 text-blue-500 hover:underline"
        >
          {mode === "login" ? "Sign Up" : "login"}
        </button>
      </p>
    </div>
  );
}
