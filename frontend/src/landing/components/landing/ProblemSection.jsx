import { motion } from "framer-motion";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";

const stats = [
  {
    icon: AlertTriangle,
    value: "100,000+",
    label: "Drowsy driving crashes per year",
    description: "The NHTSA estimates over 100,000 crashes annually are caused by drowsy driving.",
  },
  {
    icon: Clock,
    value: "4 Seconds",
    label: "Average microsleep duration",
    description: "At highway speeds, 4 seconds of microsleep means traveling 100+ meters blind.",
  },
  {
    icon: TrendingUp,
    value: "21%",
    label: "Of fatal crashes involve fatigue",
    description: "Drowsy driving is a factor in over 1 in 5 fatal road accidents worldwide.",
  },
];

const ProblemSection = () => {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container px-4 ">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary tracking-wider uppercase">The Problem</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
            Drowsy Driving <span className="text-muted-foreground">Kills</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Most drivers don't realize when they're falling asleep. By the time they do, it's often too late.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass rounded-2xl p-8 group hover:border-primary/30 transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-foreground/80 mb-3">{stat.label}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;

