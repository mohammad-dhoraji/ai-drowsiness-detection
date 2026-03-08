import { useRef, useState, useEffect, useCallback } from "react";

export default function useCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState("");

  const startCamera = async () => {
    try {
      setCameraError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      setStream(mediaStream);
      setCameraOn(true);
    } catch {
      setCameraOn(false);
      setStream(null);
      setCameraError("Camera access failed. Please allow permissions and retry.");
    }
  };

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setCameraOn(false);
    setStream(null);
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const captureFrame = useCallback((quality = 0.7) => {
    const video = videoRef.current;
    if (!video || !cameraOn) return null;
    if (!video.videoWidth || !video.videoHeight) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  }, [cameraOn]);

  return {
    videoRef,
    cameraOn,
    cameraError,
    startCamera,
    stopCamera,
    captureFrame,
  };
}
