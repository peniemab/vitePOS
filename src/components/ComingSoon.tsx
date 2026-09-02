'use client'

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-2 py-8">
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">{title}</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
        Écran en cours de branchement Next (ticket C+/F). La caisse et l’accueil sont déjà
        disponibles.
      </p>
    </div>
  )
}
