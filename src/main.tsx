import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { DatesProvider } from "@mantine/dates";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/fr";
import "@fontsource/google-sans/latin-400.css";
import "@fontsource/google-sans/latin-500.css";
import "@fontsource/google-sans/latin-600.css";
import "@fontsource/google-sans/latin-700.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./styles.css";
import { theme } from "./theme";
import { App } from "./App";
import { listenForInstall } from "./data/install";
import { announceUpdate, startUpdates } from "./data/update";

// Les champs de date comprennent une date tapée au clavier (« 15/03/2027 »), pas seulement le calendrier.
dayjs.extend(customParseFormat);

// Met l'application en cache pour qu'elle s'ouvre sans internet, et l'installe à jour sans gêner une vente.
startUpdates();
// Garde la proposition d'installation du navigateur pour le bouton « Installer ».
listenForInstall();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <DatesProvider settings={{ locale: "fr", firstDayOfWeek: 1 }}>
        <ModalsProvider labels={{ confirm: "Confirmer", cancel: "Annuler" }}>
          <Notifications position="top-center" />
          <App />
        </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
announceUpdate();
