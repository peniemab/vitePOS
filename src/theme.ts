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

/** Bleu ciel de l'app et du site (#3987e5 en teinte 6) : couleur principale. */
const sky: MantineColorsTuple = [
  "#eaf4ff",
  "#d4e7fd",
  "#a9cdf8",
  "#7cb2f3",
  "#5a9cee",
  "#4690ea",
  "#3987e5",
  "#2c6fc6",
  "#2260ad",
  "#164f92",
];

/** Menthe (#1fb57a) : les succès (« Envoyé », « Vente enregistrée »…), à la place du vert-bleu de Mantine. */
const teal: MantineColorsTuple = [
  "#e6f8f0",
  "#c8efdd",
  "#95e0bf",
  "#5fcf9e",
  "#36c184",
  "#1fb57a",
  "#16a06b",
  "#11915e",
  "#0b7a4e",
  "#05633e",
];

export const theme = createTheme({
  primaryColor: "sky",
  primaryShade: { light: 6, dark: 5 },
  autoContrast: true,
  colors: { navy, brick, sky, teal },
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
    // Boutons principaux : le bleu de l'app (bleu ciel zébré en mode clair), en dégradé.
    Button: Button.extend({
      defaultProps: { size: "md" },
      vars: (_theme, props) =>
        (props.variant ?? "filled") === "filled" && (!props.color || props.color === "sky" || props.color === "navy") && !props.disabled
          ? { root: { "--button-bg": "var(--app-glow), var(--app-night)", "--button-hover": "var(--app-glow), var(--app-night)", "--button-color": "#fff" } }
          : { root: {} },
    }),
    Modal: { defaultProps: { centered: true } },
  },
});
