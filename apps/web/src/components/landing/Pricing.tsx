import { Icon, Reveal, SectionHeading } from './ui'

const plans = [
  {
    name: 'Free',
    price: '$0',
    note: 'Free during beta',
    cta: 'Build my free plan',
    href: '/signup',
    featured: true,
    items: ['Personal food and workout plan', 'Weekly adaptive targets', 'Daily tracker and progress charts', 'AI coach, daily question limit', 'Safety rules and Ramadan mode'],
  },
  {
    name: 'Pro',
    price: 'Soon',
    note: 'Join the waitlist',
    cta: 'Join the waitlist',
    href: '#final',
    featured: false,
    items: ['Everything in Free', 'Unlimited AI coach', 'Photo and voice food logging', 'Family and budget plans', 'Shareable report for your dietitian'],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Pricing" title={<>Start free. <span className="text-gradient">Stay because it works.</span></>} />
        <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 100} className="h-full">
              <div className={`card relative flex h-full flex-col p-7 ${p.featured ? 'border-violet/50 shadow-[0_0_60px_-20px_rgba(79,70,229,0.45)]' : ''}`}>
                {p.featured && <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-violet-deep to-lilac px-3 py-1 text-[11px] font-semibold text-white">Most popular</span>}
                <p className="font-semibold text-heading">{p.name}</p>
                <p className="mt-3 text-4xl font-extrabold text-heading">{p.price}</p>
                <p className="mt-1 text-sm text-muted">{p.note}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.items.map((it) => (
                    <li key={it} className="flex gap-2.5 text-sm text-text"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-mint" />{it}</li>
                  ))}
                </ul>
                <a href={p.href} className={`mt-8 rounded-full px-6 py-3 text-center text-sm font-semibold ${p.featured ? 'btn-primary text-white' : 'border border-line bg-white text-heading hover:bg-ink-2'}`}>{p.cta}</a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
