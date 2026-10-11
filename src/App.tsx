import { lazy } from "react";
import { createBrowserRouter, Navigate, Route, RouterProvider, Routes } from "react-router";
import { firebaseConfigured } from "./data/firebase";
import { SessionProvider, useSession } from "./data/session";
import { Layout } from "./components/Layout";
import { CatalogProvider } from "./data/products";
import { CartProvider } from "./data/sales";
import { ComingSoon } from "./components/ui";
import { ForgotPasswordScreen, LoginScreen, SignupScreen } from "./screens/AuthScreens";
import {
  ConfigMissingScreen,
  DisabledScreen,
  LoadingScreen,
  NoProfileScreen,
  OnboardingScreen,
  PendingScreen,
} from "./screens/GateScreens";
import { HomeScreen } from "./screens/HomeScreen";
import { PlusScreen } from "./screens/PlusScreen";
// Écrans chargés à la demande (démarrage plus rapide sur les petits téléphones ; tout reste en cache hors ligne).
const TeamScreen = lazy(() => import("./screens/TeamScreen").then((m) => ({ default: m.TeamScreen })));
const CaisseScreen = lazy(() => import("./screens/CaisseScreen").then((m) => ({ default: m.CaisseScreen })));
const TicketScreen = lazy(() => import("./screens/TicketScreen").then((m) => ({ default: m.TicketScreen })));
const VentesScreen = lazy(() => import("./screens/VentesScreen").then((m) => ({ default: m.VentesScreen })));
const ClientsScreen = lazy(() => import("./screens/ClientsScreen").then((m) => ({ default: m.ClientsScreen })));
const DepensesScreen = lazy(() => import("./screens/DepensesScreen").then((m) => ({ default: m.DepensesScreen })));
const JourneeScreen = lazy(() => import("./screens/JourneeScreen").then((m) => ({ default: m.JourneeScreen })));
const StockScreen = lazy(() => import("./screens/StockScreen").then((m) => ({ default: m.StockScreen })));
const ImportScreen = lazy(() => import("./screens/ImportScreen").then((m) => ({ default: m.ImportScreen })));
const SettingsScreen = lazy(() => import("./screens/SettingsScreen").then((m) => ({ default: m.SettingsScreen })));

function Gate() {
  const s = useSession();

  if (s.status === "loading") return <LoadingScreen />;

  if (s.status === "signedOut")
    return (
      <Routes>
        <Route path="/connexion" element={<LoginScreen />} />
        <Route path="/inscription" element={<SignupScreen />} />
        <Route path="/mot-de-passe" element={<ForgotPasswordScreen />} />
        <Route path="*" element={<Navigate to="/connexion" replace />} />
      </Routes>
    );

  if (s.status === "noProfile") return <NoProfileScreen error={s.error} offline={s.offline} />;
  if (s.status === "noBoutique") return <OnboardingScreen user={s.user} profile={s.profile} />;
  if (s.status === "pending") return <PendingScreen member={s.member} boutique={s.boutique} />;
  if (s.status === "disabled") return <DisabledScreen member={s.member} boutique={s.boutique} />;

  return (
    <CatalogProvider>
      <CartProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomeScreen />} />
            <Route path="caisse" element={<CaisseScreen />} />
            <Route path="ticket/:id" element={<TicketScreen />} />
            <Route path="stock" element={<StockScreen />} />
            <Route path="stock/import" element={<ImportScreen />} />
            <Route path="ventes" element={<VentesScreen />} />
            <Route path="plus" element={<PlusScreen />} />
            <Route path="clients" element={<ClientsScreen />} />
            <Route path="depenses" element={<DepensesScreen />} />
            <Route path="journee" element={<JourneeScreen />} />
            <Route path="inventaire" element={<ComingSoon title="Inventaire" />} />
            <Route path="rapports" element={<ComingSoon title="Rapports" />} />
            <Route path="equipe" element={<TeamScreen />} />
            <Route path="parametres" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </CartProvider>
    </CatalogProvider>
  );
}

function Root() {
  return (
    <SessionProvider>
      <Gate />
    </SessionProvider>
  );
}

const router = createBrowserRouter([{ path: "*", element: <Root /> }]);

export function App() {
  if (!firebaseConfigured) return <ConfigMissingScreen />;
  return <RouterProvider router={router} />;
}
