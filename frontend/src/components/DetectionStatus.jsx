function getSeverityStyles(severity) {
  if (severity === "HIGH") {
    return "bg-red-100 text-red-700";
  }
  if (severity === "MEDIUM") {
    return "bg-yellow-100 text-yellow-700";
  }
  return "bg-green-100 text-green-700";
}

export default function DetectionStatus({ detection, error, cameraOn }) {
  const eyeStatus = cameraOn
    ? detection.eyes_closed
      ? "Eyes Closed"
      : "Eyes Open"
    : "Awaiting Data";
  const severity = detection.severity || "LOW";
  const ear =
    typeof detection.ear === "number" && Number.isFinite(detection.ear)
      ? detection.ear.toFixed(3)
      : "0.000";
  const duration =
    typeof detection.duration === "number" && Number.isFinite(detection.duration)
      ? detection.duration.toFixed(1)
      : "0.0";

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 border dark:border-gray-800">
      <h2 className="font-semibold text-lg mb-4">Detection Status</h2>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Eye Status</p>
          <p className="font-semibold">{eyeStatus}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">EAR Value</p>
          <p className="font-mono">{ear}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Closure Duration</p>
          <p className="font-mono">{duration}s</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Alert Level</p>
          <span className={`px-3 py-1 rounded-full text-sm ${getSeverityStyles(severity)}`}>
            {severity}
          </span>
        </div>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    </section>
  );
}
