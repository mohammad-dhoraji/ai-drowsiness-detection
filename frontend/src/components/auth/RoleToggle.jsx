export default function RoleToggle({ role, setRole }) {
  return (
    <div className="flex bg-gray-800 p-1 rounded-lg mb-6">
      <button
        onClick={() => setRole("driver")}
        className={`flex-1 py-2 rounded-md text-sm transition ${
          role === "driver"
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Driver
      </button>

      <button
        onClick={() => setRole("guardian")}
        className={`flex-1 py-2 rounded-md text-sm transition ${
          role === "guardian"
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Guardian
      </button>
    </div>
  );
}