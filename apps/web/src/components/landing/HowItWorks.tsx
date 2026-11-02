import { Reveal, SectionHeading } from './ui'

const steps = [
  { n: '01', title: 'Answer a 60-second quiz', body: 'Goal, body, routine, food you like, injuries and how much time you have.' },
  { n: '02', title: 'Get a plan with reasons', body: 'Daily meals, home workouts and water targets, each with a one-line reason you can read.' },
  { n: '03', title: 'Log in a few taps', body: 'Meals by text, voice or photo. Water, sleep, weight and training in one place.' },
  { n: '04', title: 'Watch it adapt', body: 'Every week WellPath reviews your trend, adjusts targets safely, and tells you exactly why.' },
]

export function HowItWorks() {
  return (
    <section id="how" className="section-soft py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="How it works" title={<>From first question to a plan that fits, <span className="text-gradient">in four steps</span></>} />
        <ol className="relative mt-14 grid gap-6 md:grid-cols-4">
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-violet/50 to-transparent md:block" aria-hidden="true" />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <li className="relative">
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-violet/40 bg-ink text-sm font-bold text-lilac">{s.n}</span>
                <h3 className="mt-5 font-semibold text-heading">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
