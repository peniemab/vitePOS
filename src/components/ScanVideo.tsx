import type { RefObject } from "react";
import { Text } from "@mantine/core";

/** Image de la caméra pendant le scan, avec un cadre pour viser le code-barres. */
export function ScanVideo({ videoRef, scanning, error }: { videoRef: RefObject<HTMLVideoElement | null>; scanning: boolean; error: string }) {
  return (
    <>
      {scanning && (
        <div style={{ position: "relative", marginTop: 8, borderRadius: 8, overflow: "hidden", background: "#000" }}>
          <video ref={videoRef} muted playsInline style={{ display: "block", width: "100%", height: 200, objectFit: "cover" }} />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: "30% 12%",
              border: "2px solid rgba(255,255,255,.85)",
              borderRadius: 8,
              boxShadow: "0 0 0 999px rgba(0,0,0,.25)",
            }}
          />
          <Text size="xs" c="white" ta="center" style={{ position: "absolute", left: 0, right: 0, bottom: 6 }}>
            Placez le code-barres dans le cadre
          </Text>
        </div>
      )}
      {error && (
        <Text c="red" size="sm" mt={4}>
          {error}
        </Text>
      )}
    </>
  );
}
