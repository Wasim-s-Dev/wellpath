import { Icon, Reveal, SectionHeading } from './ui'

const items = [
  { icon: 'shield', title: 'Safety first', body: 'Injury and condition rules filter every workout. Calorie targets never drop below safe minimums.' },
  { icon: 'lock', title: 'Your data stays yours', body: 'Encrypted in transit, health details protected, and one tap to export or delete everything.' },
  { icon: 'chat', title: 'Honest about limits', body: 'WellPath is a wellness planner. It does not diagnose, treat or replace your doctor.' },
  { icon: 'bell', title: 'Nudges, not nagging', body: 'Reminders for water, meals and training at times you choose. Turn them off any time.' },
]

export function Safety() {
  return (
    <section id="safety" className="section-soft py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Safety and privacy" title={<>Built to be trusted <span className="text-gradient">with your health</span></>} />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 80} className="h-full">
              <div className="card h-full p-6">
                <Icon name={it.icon} className="h-6 w-6 text-lilac" />
                <h3 className="mt-4 font-semibold text-heading">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{it.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
