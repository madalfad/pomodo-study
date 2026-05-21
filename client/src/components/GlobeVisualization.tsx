import { FC, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import createGlobe, { type Marker } from "cobe";
import { motion } from "framer-motion";

// Major study regions around the world
const studyRegions: Array<{ location: [number, number]; size: number }> = [
  { location: [40.7128, -74.006], size: 0.05 }, // New York
  { location: [51.5074, -0.1278], size: 0.05 }, // London
  { location: [48.8566, 2.3522], size: 0.04 }, // Paris
  { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo
  { location: [22.3193, 114.1694], size: 0.04 }, // Hong Kong
  { location: [-33.8688, 151.2093], size: 0.04 }, // Sydney
  { location: [37.7749, -122.4194], size: 0.05 }, // San Francisco
  { location: [55.7558, 37.6173], size: 0.04 }, // Moscow
  { location: [52.52, 13.405], size: 0.04 }, // Berlin
  { location: [31.2304, 121.4737], size: 0.05 }, // Shanghai
  { location: [37.5665, 126.978], size: 0.04 }, // Seoul
  { location: [1.3521, 103.8198], size: 0.04 }, // Singapore
  { location: [-6.2088, 106.8456], size: 0.04 }, // Jakarta
  { location: [25.2048, 55.2708], size: 0.04 }, // Dubai
  { location: [19.076, 72.8777], size: 0.05 }, // Mumbai
  { location: [-23.5505, -46.6333], size: 0.05 }, // São Paulo
  { location: [41.9028, 12.4964], size: 0.04 }, // Rome
  { location: [-34.6037, -58.3816], size: 0.04 }, // Buenos Aires
  { location: [59.3293, 18.0686], size: 0.03 }, // Stockholm
  { location: [30.0444, 31.2357], size: 0.04 }, // Cairo
];

// Try to enrich markers with the visitor's IP-based location for a personal touch.
// Falls back silently if the API is unreachable.
async function fetchUserMarker(): Promise<Marker | null> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) return null;
    const data = await response.json();
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return {
        location: [lat, lng],
        size: 0.1,
      };
    }
  } catch {
    // Network/CORS errors are non-fatal - the globe still renders with the
    // default study regions.
  }
  return null;
}

const GlobeVisualization: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerInteractingRef = useRef<number | null>(null);
  const pointerInteractionMovementRef = useRef(0);
  const [activeUsers, setActiveUsers] = useState<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Simulate active user count - matches the original behaviour.
    setActiveUsers(Math.floor(Math.random() * 500) + 1000);

    let phi = 0;
    let width = container.clientWidth;
    let height = container.clientHeight;
    // Rotation driven by user pointer drag.
    let pointerPhi = 0;

    const markers: Marker[] = studyRegions.map((m) => ({ ...m }));
    let destroyed = false;
    let frameHandle = 0;

    // Kick off the IP geolocation lookup in parallel; merge in once it resolves.
    fetchUserMarker().then((userMarker) => {
      if (!destroyed && userMarker) {
        markers.push(userMarker);
        globe.update({ markers });
      }
    });

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      globe.update({ width: width * 2, height: height * 2 });
    };
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvas, {
      devicePixelRatio: window.devicePixelRatio || 2,
      width: width * 2,
      height: height * 2,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      // Site palette: deep purple/navy base with warm amber accents.
      baseColor: [0.44, 0.47, 0.63], // ~#7077A1 muted purple
      markerColor: [0.96, 0.69, 0.48], // ~#F6B17A warm amber
      glowColor: [0.18, 0.2, 0.31], // ~#2D3250 deep navy
      markers,
    });

    // Drive rotation via requestAnimationFrame (cobe v2 removed the onRender callback).
    const tick = () => {
      if (destroyed) return;
      // Auto-rotate, but pause while the user is actively dragging.
      if (pointerInteractingRef.current === null) {
        phi += 0.003;
      }
      globe.update({ phi: phi + pointerPhi });
      frameHandle = requestAnimationFrame(tick);
    };
    frameHandle = requestAnimationFrame(tick);

    // Pointer drag interaction (lets visitors spin the globe).
    const onPointerDown = (e: PointerEvent) => {
      pointerInteractingRef.current =
        e.clientX - pointerInteractionMovementRef.current;
      canvas.style.cursor = "grabbing";
    };
    const onPointerUp = () => {
      pointerInteractingRef.current = null;
      canvas.style.cursor = "grab";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (pointerInteractingRef.current !== null) {
        const delta = e.clientX - pointerInteractingRef.current;
        pointerInteractionMovementRef.current = delta;
        pointerPhi = delta / 200;
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);

    // Initial fade-in (cobe renders a black canvas for a frame or two).
    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 600ms ease";
    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });

    return () => {
      destroyed = true;
      cancelAnimationFrame(frameHandle);
      globe.destroy();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="shadow-lg bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-xl font-poppins font-semibold mb-5 text-amber-400 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            pomodo Community
          </h2>

          <div
            ref={containerRef}
            className="globe-container relative h-[300px] w-full rounded-lg overflow-hidden shadow-inner"
            style={{
              background:
                "radial-gradient(circle at center, #2D3250 0%, #1a1a2e 70%)",
              boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)",
            }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
              style={{ cursor: "grab", contain: "layout paint size" }}
            />
          </div>

          <div className="mt-4 text-center text-sm text-gray-400 font-workSans">
            <p>
              <span className="font-semibold text-amber-400">
                {activeUsers.toLocaleString()}
              </span>{" "}
              people focusing worldwide right now
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GlobeVisualization;
