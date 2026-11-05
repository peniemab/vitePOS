/**
 * « Premiers pas » sur l'accueil d'une boutique neuve (propriétaire seulement) :
 * taux, premiers articles, première vente, impression, premier vendeur.
 * Disparaît quand tout est fait, ou quand le propriétaire la masque (sur cet appareil).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Anchor, Group, Paper, Progress, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import { IconCheck, IconChevronRight } from "./icons";
import { useReady } from "../data/session";
import { useCatalog } from "../data/products";
import { watchHasSale } from "../data/sales";
import { watchMembers } from "../data/boutique";
import { hasChosenPrinter } from "../data/printer";
import { doneCount, firstSteps } from "../lib/firstSteps";
import { HelpLink } from "./Help";

const hiddenKey = (boutiqueId: string) => `vitepos.premiers-pas.masque.${boutiqueId}`;

function readHidden(boutiqueId: string): boolean {
  try {
    return localStorage.getItem(hiddenKey(boutiqueId)) === "1";
  } catch {
    return false;
  }
}

export function FirstSteps() {
  const { boutique, member } = useReady();
  const owner = member.role === "proprietaire";
  const { products } = useCatalog();
  const [hasSale, setHasSale] = useState<boolean>();
  const [memberCount, setMemberCount] = useState<number>();
  const [hidden, setHidden] = useState(() => readHidden(boutique.id));

  useEffect(() => {
    if (!owner || hidden) return;
    return watchHasSale(boutique.id, setHasSale, () => setHasSale(true));
  }, [boutique.id, owner, hidden]);
  useEffect(() => {
    if (!owner || hidden) return;
    return watchMembers(
      boutique.id,
      (m) => setMemberCount(m.filter((x) => x.status !== "disabled").length),
      () => setMemberCount(1),
    );
  }, [boutique.id, owner, hidden]);

  if (!owner || hidden || !products || hasSale === undefined || memberCount === undefined) return null;

  const steps = firstSteps({
    hasRate: boutique.usdRateCdf > 0,
    productCount: products.filter((p) => !p.archived).length,
    hasSale,
    printerChosen: hasChosenPrinter(),
    memberCount,
  });
  const done = doneCount(steps);
  if (done === steps.length) return null;

  function hide() {
    try {
      localStorage.setItem(hiddenKey(boutique.id), "1");
    } catch {
      // Stockage indisponible : la liste reviendra à la prochaine ouverture.
    }
    setHidden(true);
  }

  return (
    <Paper p="md" mb="md" className="first-steps">
      <Group justify="space-between" align="baseline" mb={4}>
        <Text fw={700} fz="lg">
          Premiers pas
        </Text>
        <Text size="sm" c="dimmed" className="n">
          {done} sur {steps.length}
        </Text>
      </Group>
      <Progress value={(done / steps.length) * 100} size="sm" mb="sm" />
      {steps.map((s) => (
        <UnstyledButton key={s.id} component={Link} to={s.to} className="first-step" data-done={s.done || undefined}>
          <ThemeIcon size={26} radius="xl" variant={s.done ? "filled" : "light"} color={s.done ? "teal" : "gray"}>
            {s.done ? <IconCheck size={16} /> : <span className="n">{steps.indexOf(s) + 1}</span>}
          </ThemeIcon>
          <span className="label">{s.label}</span>
          {!s.done && <IconChevronRight size={18} />}
        </UnstyledButton>
      ))}
      <Group justify="space-between" mt="sm" gap="xs">
        <HelpLink />
        <Anchor component="button" type="button" size="sm" c="dimmed" onClick={hide}>
          Masquer
        </Anchor>
      </Group>
    </Paper>
  );
}
