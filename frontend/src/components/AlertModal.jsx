import { AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function AlertModal({ visible, severity = "HIGH", onClose }) {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="glass p-6 sm:p-8 rounded-2xl text-center w-full max-w-sm sm:max-w-[420px] glow-border"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>

          <h2 className="text-xl sm:text-2xl font-display font-bold mb-2 text-destructive">Critical Alert</h2>

          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Drowsiness detected ({severity}) - Pull over safely
          </p>

          <button
            onClick={onClose}
            className="bg-destructive text-destructive-foreground px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-lg hover:bg-destructive/90 transition flex items-center gap-2 mx-auto text-sm sm:text-base"
          >
            <X className="w-4 h-4" />
            Acknowledge
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
