import { motion } from "framer-motion";
import { Eye, Clock, AlertTriangle, Activity } from "lucide-react";

function getSeverityStyles(severity) {
  if (severity === "HIGH") {
    return "bg-red-500/20 text-red-500 border border-red-500/30";
  }
  if (severity === "MEDIUM") {
    return "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
  }
  return "bg-green-500/20 text-green-500 border border-green-500/30";
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
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass rounded-2xl p-4 sm:p-5 group hover:border-primary/30 transition-all duration-500 h-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-display font-semibold text-lg">Detection Status</h2>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Eye className="w-3 h-3" /> Eye Status
          </p>
          <p className="font-semibold text-sm sm:text-base">{eyeStatus}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">EAR Value</p>
          <p className="font-mono text-lg">{ear}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Closure Duration
          </p>
          <p className="font-mono text-lg">{duration}s</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Alert Level
          </p>
          <span className={`inline-flex px-3 py-1.5 rounded-full text-sm mt-1 ${getSeverityStyles(severity)}`}>
            {severity}
          </span>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </motion.section>
  );
}
