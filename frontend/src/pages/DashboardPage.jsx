import { useCallback, useEffect, useRef, useState } from "react";

import Header from "./components/Header";
import CameraPanel from "./components/CameraPanel";
import DetectionStatus from "./components/DetectionStatus";
import EventHistory from "./components/EventHistory";
import AlertModal from "./components/AlertModal";
import Footer from "./components/Footer";
import AddGuardianPage from "./pages/AddGuardianPage";
import GuardianDashboardPage from "./pages/GuardianDashboardPage";
import useCamera from "./hooks/useCamera";
import { useAuth } from "./context/useAuth";
import { getMe } from "./services/authService";
import { analyzeFrame } from "./services/detectionService";
import { getEvents } from "./services/logsService";

const DETECTION_INTERVAL_MS = 400;

const DEFAULT_DETECTION = {
  eyes_closed: false,
  duration: 0,
  ear: 0,
  severity: "LOW",
  alert: false,
  timestamp: 0,
};

function createSessionId() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function DashboardPage() {
  const [alertVisible, setAlertVisible] = useState(false);
  const [detection, setDetection] = useState(DEFAULT_DETECTION);
  const [detectionError, setDetectionError] = useState("");
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [backendStatus, setBackendStatus] = useState("Initializing");
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const { accessToken, user, signOut } = useAuth();

  const { videoRef, cameraOn, cameraError, startCamera, stopCamera, captureFrame } = useCamera();

  const detectionIntervalRef = useRef(null);
  const detectionInFlightRef = useRef(false);
  const sessionIdRef = useRef(null);

  const audioContextRef = useRef(null);
  const alarmIntervalRef = useRef(null);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  const startAlarm = useCallback(() => {
    if (alarmIntervalRef.current) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    const context = audioContextRef.current;

    const beep = () => {
      if (context.state === "suspended") context.resume();

      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.value = 0.12;

      osc.connect(gain);
      gain.connect(context.destination);

      osc.start();
      osc.stop(context.currentTime + 0.2);
    };

    beep();
    alarmIntervalRef.current = setInterval(beep, 700);
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setBackendStatus("Disconnected");
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    setProfileError("");

    getMe(accessToken)
      .then((data) => {
        if (cancelled) return;
        setBackendStatus("Connected");
        setProfile(data || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setBackendStatus("Disconnected");
        setProfile(null);
        setProfileError(err?.message || "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const isDriver = profile?.role === "driver";
  const isGuardian = profile?.role === "guardian";

  const loadHistory = useCallback(async () => {
    if (!accessToken || !isDriver) return;

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await getEvents(accessToken, { page: 1, page_size: 20 });
      setHistoryItems(response?.events || []);
    } catch (error) {
      setHistoryError(error.message || "Unable to load history");
    } finally {
      setHistoryLoading(false);
    }
  }, [accessToken, isDriver]);

  useEffect(() => {
    if (!isDriver) {
      stopAlarm();
      return;
    }

    loadHistory();
  }, [isDriver, loadHistory, stopAlarm]);

  useEffect(() => {
    if (!cameraOn || !accessToken || !isDriver) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      return;
    }

    sessionIdRef.current = sessionIdRef.current || createSessionId();

    detectionIntervalRef.current = setInterval(async () => {
      if (detectionInFlightRef.current) return;

      const frameData = captureFrame(0.7);
      if (!frameData) return;

      detectionInFlightRef.current = true;

      try {
        const response = await analyzeFrame(accessToken, {
          frame_data: frameData,
          timestamp: Date.now() / 1000,
          session_id: sessionIdRef.current,
        });

        setDetection(response || DEFAULT_DETECTION);

        if (response?.alert) {
          setAlertVisible(true);
          startAlarm();
        }
      } catch (error) {
        setDetectionError(error.message);
      } finally {
        detectionInFlightRef.current = false;
      }
    }, DETECTION_INTERVAL_MS);

    return () => clearInterval(detectionIntervalRef.current);
  }, [cameraOn, accessToken, captureFrame, isDriver, startAlarm]);

  const handleLogout = async () => {
    stopCamera();
    setAlertVisible(false);
    stopAlarm();
    await signOut();
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] grid-pattern">
      <AlertModal visible={alertVisible} severity={detection.severity} onClose={() => setAlertVisible(false)} />

      <Header
        status={backendStatus}
        userEmail={user?.email}
        onLogout={handleLogout}
      />

      {profileError ? (
        <main className="max-w-3xl mx-auto px-4 sm:p-6">
          <div className="glass rounded-xl border border-destructive/30 p-4 text-destructive">{profileError}</div>
        </main>
      ) : null}

      {!profileError && isDriver ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <CameraPanel
                videoRef={videoRef}
                cameraOn={cameraOn}
                cameraError={cameraError}
                startCamera={startCamera}
                stopCamera={stopCamera}
              />
            </div>
            <div>
              <DetectionStatus detection={detection} error={detectionError} cameraOn={cameraOn} />
            </div>
          </div>

          <EventHistory
            events={historyItems}
            loading={historyLoading}
            error={historyError}
            onRefresh={loadHistory}
          />

          <AddGuardianPage accessToken={accessToken} />
        </main>
      ) : null}

      {!profileError && isGuardian ? (
        <main>
          <GuardianDashboardPage accessToken={accessToken} />
        </main>
      ) : null}

      {!profileError && !isDriver && !isGuardian ? (
        <main className="max-w-3xl mx-auto px-4 sm:p-6">
          <div className="glass rounded-xl border border-yellow-500/30 p-4 text-yellow-500 text-sm sm:text-base">
            Account role is missing. Please sign up again with Driver or Guardian role.
          </div>
        </main>
      ) : null}

      <Footer />
    </div>
  );
}

export default DashboardPage;

