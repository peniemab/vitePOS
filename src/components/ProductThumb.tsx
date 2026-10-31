/** Vignette d'article (icône ou initiales sur la couleur du rayon) et pastilles de rayon, partagées par la caisse et le stock. */
import type { CSSProperties, ReactNode } from "react";
import { UnstyledButton } from "@mantine/core";
import { IconBeer, IconBottle, IconBread, IconCandle, IconDeviceMobile, IconDroplet, IconEgg, IconGrain } from "@tabler/icons-react";
import { categoryColor, initials, productIcon, type ProductIcon } from "../lib/products";

const ICONS: Record<ProductIcon, typeof IconBottle> = {
  bottle: IconBottle,
  droplet: IconDroplet,
  grain: IconGrain,
  phone: IconDeviceMobile,
  beer: IconBeer,
  bread: IconBread,
  egg: IconEgg,
  candle: IconCandle,
};

/** L'icône de l'article, ou ses initiales s'il n'en a pas. */
export function ProductGlyph({ name, category, size = 28 }: { name: string; category: string; size?: number }) {
  const key = productIcon(name, category);
  const Icon = key ? ICONS[key] : null;
  return Icon ? <Icon size={size} stroke={1.7} /> : <>{initials(name)}</>;
}

/** Petit carré coloré devant une ligne d'article. */
export function ProductThumb({ name, category }: { name: string; category: string }) {
  return (
    <span className="thumb" style={{ "--c": categoryColor(category) } as CSSProperties} aria-hidden>
      <ProductGlyph name={name} category={category} size={22} />
    </span>
  );
}

export function CatPill({ value, current, onPick, children }: { value: string; current: string; onPick: (v: string) => void; children: ReactNode }) {
  return (
    <UnstyledButton className="cat" role="radio" aria-checked={value === current} data-on={value === current || undefined} onClick={() => onPick(value)}>
      {children}
    </UnstyledButton>
  );
}
