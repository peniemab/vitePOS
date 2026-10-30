import { useMemo } from "react";
import { Paper } from "@mantine/core";
import { bitmapDataUrl } from "../data/bitmapCanvas";
import { lineBitmap, paperDots, type PaperWidth, type ReceiptLine } from "../lib/receipt";

/** Le ticket tel qu'il sort de l'imprimante (seul élément imprimé par le navigateur). */
export function Receipt({ lines, width }: { lines: ReceiptLine[]; width: PaperWidth }) {
  // Logo, QR codes et code-barres : les mêmes images que sur le papier.
  const images = useMemo(() => lines.map((l) => {
    const b = lineBitmap(l, width);
    return b ? { src: bitmapDataUrl(b), width: b.width } : null;
  }), [lines, width]);
  return (
    <Paper className="receipt" p="md" shadow="xs">
      {lines.map((l, i) => {
        const img = images[i];
        if (img)
          return (
            <img
              key={i}
              className="receipt-image"
              src={img.src}
              alt=""
              // Même proportion qu'à l'impression : la largeur de l'image sur la largeur du papier.
              style={{ width: `${Math.min(100, (img.width / paperDots(width)) * 100)}%` }}
            />
          );
        switch (l.kind) {
          case "title":
            return (
              <div key={i} className="receipt-title">
                {l.text}
              </div>
            );
          case "center":
            return (
              <div key={i} style={{ textAlign: "center" }}>
                {l.text}
              </div>
            );
          case "text":
            return <div key={i}>{l.text}</div>;
          case "pair":
            return (
              <div key={i} className="receipt-pair" style={{ fontWeight: l.strong ? 700 : undefined, fontSize: l.strong ? "1.1em" : undefined }}>
                <span>{l.left}</span>
                <span>{l.right}</span>
              </div>
            );
          case "rule":
            return <hr key={i} className="receipt-rule" />;
          default:
            return null;
        }
      })}
    </Paper>
  );
}
