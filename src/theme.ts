/** Thème Mantine aux couleurs de vitePOS : bleu nuit, accent rouge, Barlow. */
import { Button, createTheme, type MantineColorsTuple } from "@mantine/core";

const navy: MantineColorsTuple = [
  "#eef2fb",
  "#d8e2ff",
  "#b6c6f0",
  "#8fa5d9",
  "#6b84be",
  "#4e5e82",
  "#1a2b4c",
  "#14223d",
  "#0d1830",
  "#031636",
];

const brick: MantineColorsTuple = [
  "#fff0ee",
  "#ffdad6",
  "#ffb3ac",
  "#f6827a",
  "#e8564f",
  "#da3433",
  "#b6171e",
  "#930010",
  "#6e000b",
  "#410003",
];

export const theme = createTheme({
  primaryColor: "navy",
  primaryShade: { light: 6, dark: 5 },
  autoContrast: true,
  colors: { navy, brick },
  fontFamily: '"Barlow", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily: '"Barlow Condensed", "Arial Narrow", "Roboto Condensed", sans-serif',
    fontWeight: "700",
  },
  defaultRadius: "md",
  cursorType: "pointer",
  components: {
    // Cartes blanches sur fond gris clair, sans bordure (maquette validée).
    Paper: { defaultProps: { withBorder: false, radius: "md" } },
    Card: { defaultProps: { withBorder: true, radius: "md" } },
    TextInput: { defaultProps: { size: "md" } },
    PasswordInput: { defaultProps: { size: "md" } },
    NumberInput: { defaultProps: { size: "md" } },
    Select: { defaultProps: { size: "md", allowDeselect: false } },
    SegmentedControl: { defaultProps: { size: "md" } },
    Textarea: { defaultProps: { size: "md", autosize: true, minRows: 2 } },
    // Boutons principaux : le bleu nuit du site, en dégradé.
    Button: Button.extend({
      defaultProps: { size: "md" },
      vars: (_theme, props) =>
        (props.variant ?? "filled") === "filled" && (!props.color || props.color === "navy") && !props.disabled
          ? { root: { "--button-bg": "var(--app-glow), var(--app-night)", "--button-hover": "var(--app-glow), var(--app-night)", "--button-color": "#fff" } }
          : { root: {} },
    }),
    Modal: { defaultProps: { centered: true } },
  },
});
