import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { DatesProvider } from "@mantine/dates";
import "dayjs/locale/fr";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/barlow-condensed/latin-500.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./styles.css";
import { theme } from "./theme";
import { App } from "./App";

// Met l'application en cache pour qu'elle s'ouvre sans internet, et l'actualise automatiquement.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <DatesProvider settings={{ locale: "fr", firstDayOfWeek: 1 }}>
        <ModalsProvider labels={{ confirm: "Confirmer", cancel: "Annuler" }}>
          <Notifications position="top-center" />
          <App />
        </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
