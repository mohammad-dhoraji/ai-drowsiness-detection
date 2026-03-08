import { useTheme } from "../context/useTheme";
import { motion } from "framer-motion";
import { Activity, LogOut, Sun, Moon, Menu, X } from "lucide-react";
import { useState } from "react";

function getStatusUi(status) {
  if (status === "Connected") {
    return {
      dotClass: "bg-green-500",
      textClass: "text-green-500",
    };
  }
  if (status === "Disconnected") {
    return {
      dotClass: "bg-red-500",
      textClass: "text-red-500",
    };
  }
  return {
    dotClass: "bg-yellow-400",
    textClass: "text-yellow-400",
  };
}

export default function Header({
  status = "Initializing",
  userEmail = "",
  isAuthenticated = false,
  onLogout,
}) {
  const { dark, toggleTheme } = useTheme();
  const statusUi = getStatusUi(status);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border-b border-[hsl(var(--border))] sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-display font-semibold truncate max-w-[140px] sm:max-w-none">
                AI Driver Assistance
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden xs:block">
                Real-Time Drowsiness Detection
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${statusUi.dotClass} animate-pulse`}></span>
              <span className={`text-sm ${statusUi.textClass}`}>
                {status}
              </span>
            </div>

            {isAuthenticated ? (
              <span className="text-xs text-muted-foreground max-w-44 truncate">
                {userEmail}
              </span>
            ) : null}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="px-3 sm:px-4 py-2 rounded-lg bg-primary/10 border border-[hsl(var(--border))] hover:bg-primary/20 text-sm flex items-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pt-4 border-t border-[hsl(var(--border))] space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${statusUi.dotClass} animate-pulse`}></span>
              <span className={`text-sm ${statusUi.textClass}`}>
                {status}
              </span>
            </div>

            {isAuthenticated ? (
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            ) : null}

            <div className="flex gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 p-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition flex items-center justify-center gap-2"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span className="text-sm">Theme</span>
              </button>

              {isAuthenticated ? (
                <button
                  onClick={onLogout}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary/10 border border-[hsl(var(--border))] hover:bg-primary/20 text-sm flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : null}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
