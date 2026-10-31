/**
 * Champ de recherche pensé pour la boutique :
 * - douchette USB : elle tape le code puis Entrée → `onScan` ;
 * - saisie au clavier (nom, code article ou code-barres) ;
 * - caméra du téléphone, de la tablette ou de l'ordinateur.
 */
import { useRef } from "react";
import { ActionIcon, Button, TextInput, Tooltip, type MantineSize } from "@mantine/core";
import { IconBarcode, IconScan, IconSearch, IconX } from "@tabler/icons-react";
import { ScanVideo } from "./ScanVideo";
import { canUseCamera, useCameraScan } from "./useCameraScan";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onScan: (code: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Bouton caméra : petite icône dans le champ (par défaut), bouton « Scanner » à côté, ou carré bleu nuit dans le champ. */
  scan?: "icon" | "label" | "dark";
  size?: MantineSize;
}

export function BarcodeField({ value, onChange, onScan, placeholder = "Nom, code article ou code-barres", autoFocus, scan = "icon", size }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cam = useCameraScan((code) => {
    onChange(code);
    onScan(code);
    inputRef.current?.focus();
  });

  const camera = canUseCamera();
  const toggle = () => (cam.scanning ? cam.stop() : void cam.start());
  const field = (
    <TextInput
      ref={inputRef}
      size={size}
      style={{ flex: 1 }}
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      inputMode="search"
      enterKeyHint="search"
      autoComplete="off"
      leftSection={<IconSearch size={18} />}
      rightSectionWidth={(value ? 32 : 0) + (camera && scan !== "label" ? (scan === "dark" ? 48 : 40) : 8)}
      rightSection={
        <>
          {value && (
            <ActionIcon variant="subtle" color="gray" aria-label="Effacer" onClick={() => onChange("")}>
              <IconX size={16} />
            </ActionIcon>
          )}
          {camera && scan === "icon" && <ScanButton scanning={cam.scanning} onClick={toggle} />}
          {camera && scan === "dark" && (
            <ActionIcon
              size={34}
              radius={8}
              className="scan-dark"
              aria-label={cam.scanning ? "Arrêter la caméra" : "Scanner un code-barres"}
              onClick={toggle}
            >
              <IconScan size={20} />
            </ActionIcon>
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
  );

  return (
    <div>
      {scan === "label" && camera ? (
        <div style={{ display: "flex", gap: 10 }}>
          {field}
          <Button
            size={size}
            variant={cam.scanning ? "filled" : "subtle"}
            color={cam.scanning ? undefined : "dark"}
            leftSection={<IconScan size={20} />}
            onClick={toggle}
          >
            {cam.scanning ? "Arrêter" : "Scanner"}
          </Button>
        </div>
      ) : (
        field
      )}
      <ScanVideo videoRef={cam.videoRef} scanning={cam.scanning} error={cam.error} />
    </div>
  );
}

export function ScanButton({ scanning, onClick }: { scanning: boolean; onClick: () => void }) {
  return (
    <Tooltip label={scanning ? "Arrêter la caméra" : "Scanner avec la caméra"}>
      <ActionIcon variant={scanning ? "filled" : "subtle"} aria-label={scanning ? "Arrêter la caméra" : "Scanner un code-barres"} onClick={onClick}>
        <IconBarcode size={18} />
      </ActionIcon>
    </Tooltip>
  );
}
