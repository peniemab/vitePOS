/** Menu « Plus » : les rubriques qui ne sont pas déjà dans la barre du haut (ordinateur) ou du bas (téléphone). */
import { Link } from "react-router";
import { useMediaQuery } from "@mantine/hooks";
import { Paper, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { PageTitle } from "../components/ui";
import { InstallCard } from "../components/InstallCard";
import { TABS, useTopTabs } from "../components/Layout";
import { useSections } from "../components/sections";

export function PlusScreen() {
  // Même seuil que la mise en page : barre du haut sur ordinateur, barre du bas sur téléphone.
  const wide = useMediaQuery("(min-width: 62em)", true);
  const topTabs = useTopTabs();
  const shown = new Set((wide ? topTabs : TABS).map((t) => t.to));
  const items = useSections()
    .flatMap((g) => g.items)
    .filter((i) => !shown.has(i.to));

  return (
    <>
      <PageTitle title="Plus" />
      <Paper p={0} style={{ overflow: "hidden" }}>
        {items.map((i) => (
          <UnstyledButton key={i.to} component={Link} to={i.to} className="list-row" px="md">
            <ThemeIcon variant="light" size="lg">
              <i.icon size={20} />
            </ThemeIcon>
            <Text style={{ flex: 1 }}>{i.label}</Text>
            <IconChevronRight size={18} opacity={0.5} />
          </UnstyledButton>
        ))}
      </Paper>
      <InstallCard mt="md" />
    </>
  );
}
