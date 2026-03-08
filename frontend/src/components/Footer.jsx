import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-center text-sm text-muted-foreground py-6 border-t border-[hsl(var(--border))]"
    >
      <p>Final Year Engineering Project • 2026</p>
      <p className="text-xs mt-1">FastAPI • MediaPipe • Supabase • Computer Vision</p>
    </motion.footer>
  );
}
