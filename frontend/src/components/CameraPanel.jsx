import { motion } from "framer-motion";
import { Video, VideoOff } from "lucide-react";

export default function CameraPanel({
  videoRef,
  cameraOn,
  startCamera,
  stopCamera,
  cameraError,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-4 sm:p-5 group hover:border-primary/30 transition-all duration-500"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            {cameraOn ? (
              <Video className="w-4 h-4 text-primary" />
            ) : (
              <VideoOff className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <h2 className="font-display font-semibold text-lg">Live Feed</h2>
        </div>

        <button
          onClick={cameraOn ? stopCamera : startCamera}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition w-full sm:w-auto"
        >
          {cameraOn ? "Stop Camera" : "Start Camera"}
        </button>
      </div>

      <div className="bg-black/80 rounded-xl h-64 sm:h-80 lg:h-[350px] flex items-center justify-center text-muted-foreground overflow-hidden">
        {cameraOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <p className="flex items-center gap-2 text-sm sm:text-base">
            <VideoOff className="w-5 h-5" />
            <span className="hidden sm:inline">Start monitoring</span>
            <span className="sm:hidden">Tap to start</span>
          </p>
        )}
      </div>

      {cameraError ? (
        <p className="text-sm text-destructive mt-3">{cameraError}</p>
      ) : null}
    </motion.section>
  );
}
