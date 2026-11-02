/**
 * WellPath landing page.
 * Sections live in src/components/landing. No image files: every visual is HTML, CSS or inline SVG.
 */
import { Nav } from './components/landing/Nav'
import { FoodMarquee, Hero } from './components/landing/Hero'
import { LiveTargets } from './components/landing/LiveTargets'
import { Features } from './components/landing/Features'
import { HowItWorks } from './components/landing/HowItWorks'
import { Coach } from './components/landing/Coach'
import { Safety } from './components/landing/Safety'
import { Pricing } from './components/landing/Pricing'
import { Faq } from './components/landing/Faq'
import { FinalCta, Footer } from './components/landing/FinalCta'

export default function App() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-violet focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
      <Nav />
      <main id="main">
        <Hero />
        <FoodMarquee />
        <Features />
        <LiveTargets />
        <HowItWorks />
        <Coach />
        <Safety />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
