/**
 * Champ de recherche pensé pour la boutique :
 * - douchette USB : elle tape le code puis Entrée → `onScan` ;
 * - saisie au clavier (nom, code article ou code-barres) ;
 * - caméra du téléphone, de la tablette ou de l'ordinateur.
 */
import { useRef } from "react";
import { ActionIcon, TextInput, Tooltip } from "@mantine/core";
import { IconBarcode, IconSearch, IconX } from "@tabler/icons-react";
import { ScanVideo } from "./ScanVideo";
import { canUseCamera, useCameraScan } from "./useCameraScan";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onScan: (code: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function BarcodeField({ value, onChange, onScan, placeholder = "Nom, code article ou code-barres", autoFocus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cam = useCameraScan((code) => {
    onChange(code);
    onScan(code);
    inputRef.current?.focus();
  });

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
            {canUseCamera() && <ScanButton scanning={cam.scanning} onClick={() => (cam.scanning ? cam.stop() : void cam.start())} />}
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
