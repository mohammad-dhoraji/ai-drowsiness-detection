export default function AlertModal({ visible, severity = "HIGH", onClose }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center w-[420px] border dark:border-gray-800">
        <h2 className="text-2xl font-semibold mb-2">Critical Alert</h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Drowsiness detected ({severity}) - Pull over safely
        </p>

        <button
          onClick={onClose}
          className="bg-red-600 text-white px-5 py-2 rounded-md"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
