import { lazy } from "react";
import { createBrowserRouter, Navigate, Route, RouterProvider, Routes } from "react-router";
import { firebaseConfigured } from "./data/firebase";
import { SessionProvider, useSession } from "./data/session";
import { Layout } from "./components/Layout";
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
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomeScreen />} />
        <Route path="caisse" element={<ComingSoon title="Caisse" />} />
        <Route path="stock" element={<ComingSoon title="Stock" />} />
        <Route path="ventes" element={<ComingSoon title="Ventes" />} />
        <Route path="plus" element={<PlusScreen />} />
        <Route path="clients" element={<ComingSoon title="Clients" />} />
        <Route path="depenses" element={<ComingSoon title="Dépenses" />} />
        <Route path="inventaire" element={<ComingSoon title="Inventaire" />} />
        <Route path="rapports" element={<ComingSoon title="Rapports" />} />
        <Route path="equipe" element={<TeamScreen />} />
        <Route path="parametres" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
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
