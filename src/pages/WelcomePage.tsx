import { Link } from 'react-router-dom'

const ILLUSTRATION =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuASqmVE7m76Ryzk3DnWB544bBW9PjDurfhy4U5mophSVSHqG008jssv26CrgE6QCqoWai1HvphFHRZLnralZ89CJp9Xo4UQi3Urtyv8hP9ZeL8Qn0rtSOengGxTuWrHXk2jAtNqTMFmqzf-DU4o9bFrOSKMxnEKPZN_woDafgl7he88NuE8hPtBFWVqthQJlI85dMccJSjWu9tYdCljrK1V5Zx3nsvG9tIBr4K6bYJjMjDRZ9-rBQA4'

export function WelcomePage() {
  return (
    <main className="bl-welcome flex min-h-screen flex-1 flex-col px-margin-mobile md:px-margin-desktop py-8 mx-auto w-full max-w-md relative h-screen">
      <header className="flex flex-col items-center justify-center pt-8 pb-12 w-full">
        <div className="bg-primary-container text-on-primary-container p-4 rounded-xl mb-stack-md flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-4xl">storefront</span>
        </div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight text-center w-full">
          vitePOS
        </h1>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center w-full mb-12">
        <div className="w-full aspect-square max-w-[280px] bg-surface-container-low rounded-full flex items-center justify-center mb-8 relative overflow-hidden border border-outline-variant">
          <img
            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90"
            alt="Illustration d'une épicerie de quartier moderne"
            src={ILLUSTRATION}
          />
        </div>
        <div className="text-center px-4">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-sm">
            Gérez votre boutique,
            <br />
            même sans internet.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px] mx-auto">
            Le système de caisse fiable et rapide conçu pour les commerces de proximité.
          </p>
        </div>
      </section>

      <footer className="w-full mt-auto pb-6 flex flex-col gap-stack-sm z-10 bg-surface">
        <Link
          to="/onboarding/create"
          className="w-full min-h-[56px] flex items-center justify-center bg-primary text-on-primary rounded-xl font-headline-md text-headline-md transition-transform active:scale-95 shadow-sm"
        >
          Créer une boutique
        </Link>
        <Link
          to="/onboarding/join"
          className="w-full min-h-[56px] flex items-center justify-center bg-surface border-2 border-outline-variant text-primary rounded-xl font-body-lg text-body-lg font-semibold transition-colors hover:bg-surface-variant active:scale-95"
        >
          Rejoindre une boutique
        </Link>
      </footer>
    </main>
  )
}
