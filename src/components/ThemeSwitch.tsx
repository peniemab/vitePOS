/** Choix de l'apparence (clair, sombre, ou comme le téléphone), gardé sur l'appareil. */
import { SegmentedControl, useMantineColorScheme, type MantineColorScheme } from "@mantine/core";
import { IconDeviceMobile, IconMoon, IconSun } from "@tabler/icons-react";

const OPTIONS: { value: MantineColorScheme; label: string; Icon: typeof IconSun }[] = [
  { value: "auto", label: "Automatique", Icon: IconDeviceMobile },
  { value: "light", label: "Clair", Icon: IconSun },
  { value: "dark", label: "Sombre", Icon: IconMoon },
];

export function ThemeSwitch() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  return (
    <SegmentedControl
      fullWidth
      value={colorScheme}
      onChange={(v) => setColorScheme(v as MantineColorScheme)}
      data={OPTIONS.map(({ value, label, Icon }) => ({
        value,
        label: (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon size={16} />
            {label}
          </span>
        ),
      }))}
    />
  );
}
