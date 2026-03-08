export default function CameraPanel({
  videoRef,
  cameraOn,
  startCamera,
  stopCamera,
  cameraError,
}) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 col-span-2 border dark:border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Live Feed</h2>

        <button
          onClick={cameraOn ? stopCamera : startCamera}
          className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm"
        >
          {cameraOn ? "Stop Camera" : "Start Camera"}
        </button>
      </div>

      <div className="bg-black rounded-lg h-[350px] flex items-center justify-center text-gray-300 overflow-hidden">
        {cameraOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <p>Start monitoring</p>
        )}
      </div>

      {cameraError ? (
        <p className="text-sm text-red-600 dark:text-red-400 mt-3">{cameraError}</p>
      ) : null}
    </section>
  );
}
