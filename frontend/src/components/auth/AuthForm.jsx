import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {/* Role Toggle */}
      <div className="flex bg-[hsl(var(--muted))] rounded-lg p-1 mb-4 sm:mb-6">
        <button
          onClick={() => handleRoleChange("driver")}
          className={`flex-1 py-2 rounded-md text-sm transition ${
            role === "driver"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Driver
        </button>

        <button
          onClick={() => handleRoleChange("guardian")}
          className={`flex-1 py-2 rounded-md text-sm transition ${
            role === "guardian"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Guardian
        </button>
      </div>

      <GoogleButton onClick={onGoogle} />

      <div className="flex items-center my-4 sm:my-6">
        <div className="flex-1 h-px bg-[hsl(var(--border))]"></div>
        <span className="px-3 text-muted-foreground text-sm">OR</span>
        <div className="flex-1 h-px bg-[hsl(var(--border))]"></div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Email */}
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-3 py-2.5 sm:py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-3 py-2.5 sm:py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary hover:bg-primary/90 transition rounded-lg font-medium text-primary-foreground"
        >
          {loading
            ? "Loading..."
            : mode === "login"
            ? "Login"
            : "Create Account"}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-4 sm:mt-6 text-center">
        {mode === "login"
          ? "Don't have an account?"
          : "Already have an account?"}

        <button
          onClick={toggleMode}
          className="ml-1 sm:ml-2 text-primary hover:underline"
        >
          {mode === "login" ? "Sign Up" : "Login"}
        </button>
      </p>
    </motion.div>
  );
}

