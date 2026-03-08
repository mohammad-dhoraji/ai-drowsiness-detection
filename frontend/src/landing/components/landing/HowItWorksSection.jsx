import { motion } from "framer-motion";
import { Camera, ScanFace, Eye, BellRing } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Camera Monitoring",
    description: "A webcam continuously captures the driver's face in real-time during the journey.",
    step: "01",
  },
  {
    icon: ScanFace,
    title: "Face Landmark Detection",
    description: "MediaPipe Face Mesh detects 468 facial landmarks to precisely track eye positions.",
    step: "02",
  },
  {
    icon: Eye,
    title: "Eye Closure Analysis",
    description: "The Eye Aspect Ratio (EAR) algorithm detects prolonged eye closure indicating drowsiness.",
    step: "03",
  },
  {
    icon: BellRing,
    title: "Alert Activation",
    description: "Visual and audio alerts trigger instantly. Guardians are notified of repeated events.",
    step: "04",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32">
      <div className="container px-4  ">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary tracking-wider uppercase">How It Works</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
            Four Steps to <span className="text-gradient">Safety</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From camera feed to alert — our AI pipeline processes everything in milliseconds.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative glass rounded-2xl p-6 group hover:border-primary/30 transition-all duration-500"
            >
              <span className="absolute top-4 right-4 text-5xl font-display font-bold text-foreground/5 group-hover:text-primary/10 transition-colors">
                {step.step}
              </span>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

