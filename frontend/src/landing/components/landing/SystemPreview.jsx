import { motion } from "framer-motion";
import { Eye, Activity, AlertTriangle, Video, Shield, Clock } from "lucide-react";

const SystemPreview = () => {
  return (
    <section id="dashboard" className="relative py-24 md:py-32">
      <div className="container px-4  ">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary tracking-wider uppercase">System Preview</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
            Live Dashboard <span className="text-muted-foreground">Interface</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A real-time monitoring dashboard that gives you complete visibility into driver alertness.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glass rounded-3xl p-4 md:p-6 glow-border"
        >
          {/* Dashboard header */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-sm font-medium text-foreground">Live Monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Session: 01:24:38</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Camera feed mock */}
            <div className="md:col-span-2 bg-background rounded-2xl border border-border/50 p-4 aspect-video flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Video className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground/70">Camera Feed</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                  <span className="text-xs text-primary">LIVE</span>
                </div>
              </div>
              <div className="flex-1 bg-muted/30 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="grid-pattern absolute inset-0 opacity-30" />
                {/* Face mesh visualization */}
                <div className="relative">
                  <div className="w-32 h-40 md:w-40 md:h-52 border-2 border-primary/40 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <ScanLines />
                      <span className="text-xs text-primary/60 mt-2 block">Face Detected</span>
                    </div>
                  </div>
                  {/* Eye indicators */}
                  <div className="absolute top-1/3 left-2 md:left-4 flex items-center gap-1">
                    <div className="w-6 h-3 md:w-8 md:h-4 border border-accent/60 rounded-full" />
                  </div>
                  <div className="absolute top-1/3 right-2 md:right-4 flex items-center gap-1">
                    <div className="w-6 h-3 md:w-8 md:h-4 border border-accent/60 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats panel */}
            <div className="flex flex-col gap-4">
              <MetricCard
                icon={Eye}
                label="Eye Status"
                value="Open"
                status="safe"
              />
              <MetricCard
                icon={Activity}
                label="EAR Value"
                value="0.31"
                status="safe"
                subtitle="Threshold: 0.25"
              />
              <MetricCard
                icon={AlertTriangle}
                label="Alert Level"
                value="Normal"
                status="safe"
              />
              <MetricCard
                icon={Shield}
                label="Guardian"
                value="Connected"
                status="safe"
                subtitle="No alerts sent"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const ScanLines = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" className="text-primary/40">
    <circle cx="24" cy="18" r="6" stroke="currentColor" fill="none" strokeWidth="1" />
    <path d="M12 40 C12 30 36 30 36 40" stroke="currentColor" fill="none" strokeWidth="1" />
    <line x1="24" y1="0" x2="24" y2="48" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    <line x1="0" y1="24" x2="48" y2="24" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
  </svg>
);

const MetricCard = ({ icon: Icon, label, value, subtitle }) => (
  <div className="bg-background rounded-xl border border-border/50 p-4 flex-1">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <div className="text-lg font-display font-semibold text-primary">{value}</div>
    {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
  </div>
);

export default SystemPreview;

