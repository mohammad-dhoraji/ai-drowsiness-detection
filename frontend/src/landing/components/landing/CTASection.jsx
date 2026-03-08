import { Button } from "@/landing/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
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
    <section id="contact" className="relative py-24 md:py-32">
      <div className="container px-4 ">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glass rounded-3xl p-10 md:p-16 text-center glow-border relative overflow-hidden"
        >
          <div className="absolute inset-0 grid-pattern opacity-10" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Start Protecting Lives</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Ready to Make Roads{" "}
              <span className="text-gradient">Safer?</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
              Join the AI-powered safety revolution. Set up your monitoring system in minutes
              and help prevent drowsy driving accidents.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="text-base px-8" onClick={handleStartMonitoring}>
                Start Monitoring <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="heroOutline" size="lg" className="text-base px-8">
                View Documentation
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

