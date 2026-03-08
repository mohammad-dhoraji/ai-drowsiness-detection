import { useTheme } from "../context/useTheme";

function getStatusUi(status) {
  if (status === "Connected") {
    return {
      dotClass: "bg-green-500",
      textClass: "text-green-700 dark:text-green-400",
    };
  }
  if (status === "Disconnected") {
    return {
      dotClass: "bg-red-500",
      textClass: "text-red-700 dark:text-red-400",
    };
  }
  return {
    dotClass: "bg-yellow-400",
    textClass: "text-gray-600 dark:text-gray-300",
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

  return (
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        <div>
          <h1 className="text-xl font-semibold">
            AI Driver Assistance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-Time Drowsiness Detection System
          </p>
        </div>

        <div className="flex items-center gap-4">

          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${statusUi.dotClass}`}></span>
            <span className={`text-sm ${statusUi.textClass}`}>
              {status}
            </span>
          </div>

          {isAuthenticated ? (
            <span className="text-xs text-gray-500 dark:text-gray-400 max-w-44 truncate">
              {userEmail}
            </span>
          ) : null}

          <button
            onClick={toggleTheme}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-md text-sm"
          >
            {dark ? "Light" : "Dark"}
          </button>

          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="px-4 py-1 bg-gray-200 dark:bg-gray-800 rounded-md"
            >
              Logout
            </button>
          ) : null}

        </div>
      </div>
    </header>
  );
}
