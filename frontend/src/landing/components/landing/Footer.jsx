import { Eye } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/30 py-10">
      <div className="container px-4  ">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-semibold text-foreground">DrowsyGuard</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Final Year Engineering Project 2026 — AI Driver Drowsiness Detection System
          </p>
          <div className="flex items-center gap-6">
            {["React", "FastAPI", "OpenCV", "Supabase"].map((tech) => (
              <span key={tech} className="text-xs text-muted-foreground/60">{tech}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

