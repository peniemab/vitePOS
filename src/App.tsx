import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import { CartProvider } from './lib/cart'
import { AppShell } from './components/AppShell'
import { WelcomePage } from './pages/WelcomePage'
import { CreateBoutiquePage } from './pages/CreateBoutiquePage'
import { JoinBoutiquePage } from './pages/JoinBoutiquePage'
import { LoginPage } from './pages/LoginPage'
import { AccueilPage } from './pages/AccueilPage'
import { CaissePage } from './pages/CaissePage'
import { PaiementPage } from './pages/PaiementPage'
import { TicketPage } from './pages/TicketPage'
import { ProduitsPage } from './pages/ProduitsPage'
import { ImportProduitsPage } from './pages/ImportProduitsPage'
import { StockBasPage } from './pages/StockBasPage'
import { InventairePage, InventaireSessionPage } from './pages/InventairePage'
import { ClientsPage, ClientDetailPage } from './pages/ClientsPage'
import { JourneePage } from './pages/JourneePage'
import { RapportJournalierPage } from './pages/RapportJournalierPage'
import { VentesPage } from './pages/VentesPage'
import { ParametresPage, PlusPage } from './pages/ParametresPage'
import { TauxChangePage } from './pages/TauxChangePage'
import { DepensesPage } from './pages/DepensesPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { EquipePage } from './pages/EquipePage'
import { EquipeEditPage } from './pages/EquipeEditPage'
import { EquipeCreatePage } from './pages/EquipeCreatePage'

function Gate({ children }: { children: ReactNode }) {
  const { ready, boutique, user } = useAuth()
  if (!ready) {
    return (
      <div className="bl-welcome flex min-h-screen items-center justify-center bg-surface text-on-surface">
        Chargement…
      </div>
    )
  }
  if (!boutique) {
    return (
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/onboarding/create" element={<CreateBoutiquePage />} />
        <Route path="/onboarding/join" element={<JoinBoutiquePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }
  if (!user) return <LoginPage />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Gate>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<AccueilPage />} />
              <Route path="caisse" element={<CaissePage />} />
              <Route path="caisse/paiement" element={<PaiementPage />} />
              <Route path="ticket/:id" element={<TicketPage />} />
              <Route path="produits" element={<ProduitsPage />} />
              <Route path="produits/import" element={<ImportProduitsPage />} />
              <Route path="stock-bas" element={<StockBasPage />} />
              <Route path="inventaire" element={<InventairePage />} />
              <Route path="inventaire/:id" element={<InventaireSessionPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="journee" element={<JourneePage />} />
              <Route path="journee/rapport" element={<RapportJournalierPage />} />
              <Route path="journee/rapport/:sessionId" element={<RapportJournalierPage />} />
              <Route path="ventes" element={<VentesPage />} />
              <Route path="depenses" element={<DepensesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="equipe" element={<EquipePage />} />
              <Route path="equipe/nouveau" element={<EquipeCreatePage />} />
              <Route path="equipe/:userId" element={<EquipeEditPage />} />
              <Route path="plus" element={<PlusPage />} />
              <Route path="parametres" element={<ParametresPage />} />
              <Route path="parametres/taux" element={<TauxChangePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Gate>
      </CartProvider>
    </AuthProvider>
  )
}
