import { Icon, Reveal, SectionHeading } from './ui'

const rules = [
  'Rules set your calories and safety limits. The AI can explain them, never change them.',
  'Answers use your plan and trusted nutrition guidelines, with the reason shown.',
  'Medical questions get a clear "please see a doctor", not a guess.',
  'Your name and email are never sent to the AI.',
]

export function Coach() {
  return (
    <section id="coach" className="py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="AI coach"
            align="left"
            title={<>Ask why. <span className="text-gradient">Get a real answer.</span></>}
            sub="Generic chatbots do not know your plan and can invent numbers. WellPath's coach knows your targets, your progress and your limits."
          />
          <Reveal className="mt-8">
            <ul className="space-y-3">
              {rules.map((r) => (
                <li key={r} className="flex gap-3 text-sm text-text">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint"><Icon name="check" className="h-3 w-3" /></span>
                  {r}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="card card-glow space-y-4 p-5 sm:p-6" role="img" aria-label="Example conversation with the WellPath AI coach">
            <Bubble me text="Why is my target lower this week?" />
            <Bubble text="Your 14-day weight trend dropped 0.2 kg instead of the planned 0.5 kg. Your real energy use looks about 120 kcal lower than estimated, so the target moved from 2,050 to 1,930." source="Based on your logs and weight trend" />
            <Bubble me text="My knee hurts after squats." />
            <Bubble text="I've swapped squats for glute bridges and step-ups for now. If the pain is sharp, swelling, or lasts more than a few days, please see a doctor." source="Knee safety rule applied" warn />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Bubble({ text, me = false, source, warn = false }: { text: string; me?: boolean; source?: string; warn?: boolean }) {
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${me ? 'rounded-br-md bg-gradient-to-br from-violet-deep to-violet text-white' : 'rounded-bl-md border border-line bg-ink-2 text-text'}`}>
        {text}
        {source && <p className={`mt-2 text-[11px] font-medium ${warn ? 'text-amber' : 'text-lilac'}`}>{source}</p>}
      </div>
    </div>
  )
}
