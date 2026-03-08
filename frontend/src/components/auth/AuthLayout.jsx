import { motion } from "framer-motion";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4 py-8 grid-pattern">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md sm:max-w-lg lg:max-w-xl glass rounded-2xl shadow-2xl p-6 sm:p-8 glow-border"
      >
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold mb-2 text-center"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-muted-foreground text-sm mb-6 sm:mb-8 text-center"
        >
          {subtitle}
        </motion.p>

        {children}
      </motion.div>
    </div>
  );
}

