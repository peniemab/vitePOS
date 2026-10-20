/**
 * Lecture des codes-barres avec la caméra, sur tous les appareils :
 * - le lecteur intégré du navigateur quand il existe (Chrome Android, Mac) ;
 * - sinon le lecteur ZXing (iPhone, Windows, Firefox), servi par l'app elle-même
 *   et mis en cache pour fonctionner hors ligne.
 */
import { useEffect, useRef, useState } from "react";
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

interface Detector {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
}

interface DetectorClass {
  new (opts?: { formats?: string[] }): Detector;
  getSupportedFormats?: () => Promise<string[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: DetectorClass;
  }
}

/** Codes GS1 des produits (EAN, UPC, ITF-14, DataMatrix…) et codes internes courants. */
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "itf", "code_128", "code_39", "qr_code", "data_matrix"];

let detectorPromise: Promise<Detector> | null = null;

async function createDetector(): Promise<Detector> {
  const Native = window.BarcodeDetector;
  if (Native?.getSupportedFormats) {
    const supported = await Native.getSupportedFormats().catch(() => [] as string[]);
    const formats = FORMATS.filter((f) => supported.includes(f));
    if (formats.includes("ean_13")) return new Native({ formats });
  }
  const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill");
  prepareZXingModule({
    overrides: { locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? wasmUrl : prefix + path) },
  });
  return new BarcodeDetector({ formats: FORMATS as never });
}

function getDetector(): Promise<Detector> {
  detectorPromise ??= createDetector().catch((e) => {
    detectorPromise = null;
    throw e;
  });
  return detectorPromise;
}

export const canUseCamera = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

/** Ouvre la caméra arrière, lit le premier code trouvé, puis referme la caméra. */
export function useCameraScan(onCode: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef(0);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  function stop() {
    window.clearTimeout(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => stop, []);

  async function start() {
    setError("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch {
      setError("Impossible d'ouvrir la caméra. Autorisez-la dans le navigateur, puis réessayez.");
      return;
    }
    streamRef.current = stream;
    setScanning(true);
    let detector: Detector;
    try {
      detector = await getDetector();
    } catch {
      setError("Le lecteur de codes-barres n'a pas pu démarrer. Rechargez la page, ou tapez le code.");
      stop();
      return;
    }
    const tick = async () => {
      if (streamRef.current !== stream) return;
      const video = videoRef.current;
      if (video && !video.srcObject) {
        video.srcObject = stream;
        void video.play().catch(() => undefined);
      }
      if (video && video.readyState >= 2) {
        try {
          const [code] = await detector.detect(video);
          if (code?.rawValue && streamRef.current === stream) {
            navigator.vibrate?.(60);
            stop();
            onCodeRef.current(code.rawValue.trim());
            return;
          }
        } catch {
          // Image illisible : on essaie la suivante.
        }
      }
      // Une dizaine d'essais par seconde suffit et ménage la batterie.
      timerRef.current = window.setTimeout(() => void tick(), 100);
    };
    void tick();
  }

  return { videoRef, scanning, error, start, stop };
}
