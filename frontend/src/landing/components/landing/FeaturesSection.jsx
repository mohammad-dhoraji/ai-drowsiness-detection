import { motion } from "framer-motion";
import { Eye, Activity, Brain, Bell, ClipboardList, Users } from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Real-Time Monitoring",
    description: "Continuous webcam-based driver face tracking with sub-second latency.",
  },
  {
    icon: Activity,
    title: "EAR-Based Detection",
    description: "Eye Aspect Ratio algorithm precisely measures eye openness to detect fatigue.",
  },
  {
    icon: Brain,
    title: "AI Face Mesh",
    description: "MediaPipe's 468-point face mesh ensures accurate landmark extraction.",
  },
  {
    icon: Bell,
    title: "Smart Alert System",
    description: "Multi-tier alerts: visual warnings, audio alarms, and escalation protocols.",
  },
  {
    icon: ClipboardList,
    title: "Event Logging",
    description: "Complete history of drowsiness events with timestamps and severity levels.",
  },
  {
    icon: Users,
    title: "Guardian Notifications",
    description: "Automatic alerts to designated guardians when repeated drowsiness is detected.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="container px-4  ">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary tracking-wider uppercase">Features</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
            Everything You Need for{" "}
            <span className="text-gradient">Driver Safety</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A comprehensive suite of tools designed to keep drivers alert and roads safe.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass rounded-2xl p-6 group hover:border-primary/30 transition-all duration-500"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

