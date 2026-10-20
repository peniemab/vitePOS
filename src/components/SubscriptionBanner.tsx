/** Bandeau en haut des écrans : fin d'essai proche, retard de paiement ou lecture seule. */
import { Link } from "react-router";
import { Alert, Anchor } from "@mantine/core";
import { IconAlertTriangle, IconLock } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { SubscriptionMessage } from "../screens/AbonnementScreen";

export function SubscriptionBanner() {
  const { member, subscription: st } = useReady();
  const isOwner = member.role === "proprietaire";
  const color = st.state === "bloque" ? "red" : st.state === "grace" ? "orange" : "blue";
  return (
    <Alert color={color} mb="md" icon={st.readOnly ? <IconLock size={18} /> : <IconAlertTriangle size={18} />}>
      <SubscriptionMessage st={st} />{" "}
      {isOwner ? (
        <Anchor component={Link} to="/abonnement" fw={600}>
          Voir mon abonnement
        </Anchor>
      ) : (
        "Prévenez le propriétaire de la boutique."
      )}
    </Alert>
  );
}
