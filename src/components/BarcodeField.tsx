/**
 * Champ de recherche pensé pour la boutique :
 * - douchette USB : elle tape le code puis Entrée → `onScan` ;
 * - saisie au clavier ;
 * - caméra du téléphone quand le navigateur sait lire les codes-barres (BarcodeDetector).
 */
import { useEffect, useRef, useState } from "react";
import { ActionIcon, Text, TextInput, Tooltip } from "@mantine/core";
import { IconBarcode, IconSearch, IconX } from "@tabler/icons-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onScan: (code: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface Detector {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => Detector;
  }
}

const canUseCamera = () => typeof window !== "undefined" && !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia;

export function BarcodeField({ value, onChange, onScan, placeholder = "Nom, catégorie ou code-barres", autoFocus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef(0);
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState("");

  function stopCamera() {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => stopCamera, []);

  async function startCamera() {
    setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setScanning(true);
      const detector = new window.BarcodeDetector!({
        formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"],
      });
      const tick = async () => {
        const video = videoRef.current;
        if (video && !video.srcObject) {
          video.srcObject = stream;
          void video.play();
        }
        if (video && video.readyState >= 2) {
          try {
            const [code] = await detector.detect(video);
            if (code?.rawValue) {
              onChange(code.rawValue);
              onScan(code.rawValue);
              stopCamera();
              inputRef.current?.focus();
              return;
            }
          } catch {
            // Image illisible : on passe à la suivante.
          }
        }
        frameRef.current = requestAnimationFrame(() => void tick());
      };
      frameRef.current = requestAnimationFrame(() => void tick());
    } catch {
      setCamError("Impossible d'ouvrir la caméra. Vérifiez l'autorisation dans le navigateur.");
      stopCamera();
    }
  }

  return (
    <div>
      <TextInput
        ref={inputRef}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        leftSection={<IconSearch size={18} />}
        rightSectionWidth={value ? 72 : 40}
        rightSection={
          <>
            {value && (
              <ActionIcon variant="subtle" color="gray" aria-label="Effacer" onClick={() => onChange("")}>
                <IconX size={16} />
              </ActionIcon>
            )}
            {canUseCamera() && (
              <Tooltip label={scanning ? "Arrêter la caméra" : "Scanner avec la caméra"}>
                <ActionIcon
                  variant={scanning ? "filled" : "subtle"}
                  aria-label={scanning ? "Arrêter la caméra" : "Scanner un code-barres"}
                  onClick={() => (scanning ? stopCamera() : void startCamera())}
                >
                  <IconBarcode size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </>
        }
        onChange={(e) => onChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            e.preventDefault();
            onScan(value.trim());
          }
        }}
      />
      {scanning && (
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ marginTop: 8, width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, background: "#000" }}
        />
      )}
      {camError && (
        <Text c="red" size="sm" mt={4}>
          {camError}
        </Text>
      )}
    </div>
  );
}
