import { Button } from "@/landing/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/landing/assets/hero-bg.jpg";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleStartMonitoring = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
      </div>

      {/* Floating elements */}
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-1/4 left-[10%] hidden lg:block"
      >
        <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="text-xs text-muted-foreground">EAR: 0.31</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 7, repeat: Infinity }}
        className="absolute top-1/3 right-[12%] hidden lg:block"
      >
        <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
          <Shield className="w-3 h-3 text-primary" />
          <span className="text-xs text-muted-foreground">Driver Active</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-1/3 left-[15%] hidden lg:block"
      >
        <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-xs text-muted-foreground">Face Mesh Active</span>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 container px-4 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI-Powered Road Safety System</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl sm:text-5xl md:text-7xl font-display font-bold leading-tight mb-6"
        >
          <span className="text-foreground/60">Real-Time</span>{" "}
          <span className="text-foreground glow-text">Driver Drowsiness</span>{" "}
          <span className="text-gradient">Detection</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Harnessing computer vision and AI to monitor driver alertness in real-time.
          Detect fatigue before it becomes danger. Protect lives on every journey.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button variant="hero" size="lg" className="text-base px-8" onClick={handleStartMonitoring}>
            Start Monitoring <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button variant="heroOutline" size="lg" className="text-base px-8">
            Learn More
          </Button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 glass rounded-full px-4 py-2"
        >
          <div className="w-1 h-4 rounded-full bg-primary/50 relative overflow-hidden">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-full h-1/2 bg-primary rounded-full"
            />
          </div>
          <span className="text-xs text-muted-foreground">Scroll down</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

