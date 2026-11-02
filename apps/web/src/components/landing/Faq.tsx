import { Reveal, SectionHeading } from './ui'

const faqs = [
  { q: 'Is WellPath really free?', a: 'Yes. The full plan, tracker, adaptive targets and the AI coach with a daily question limit are free during beta. No card needed.' },
  { q: 'How is this different from a calorie counter?', a: 'Counters record what you ate. WellPath builds the plan, explains every number, and changes your targets each week based on your real progress.' },
  { q: 'Does it work with my local food?', a: 'Yes. WellPath understands everyday dishes and local portions, from a bowl of daal and roti to a chicken salad, and you can log in plain words.' },
  { q: 'Can the AI give me wrong numbers?', a: 'Your calories, macros and safety limits come from tested rules, not the AI. The coach only explains and suggests, and cannot change them.' },
  { q: 'I have an injury or a health condition. Can I use it?', a: 'WellPath removes unsuitable exercises for common problems like knee pain, back pain or high blood pressure and shows a doctor notice. It is not medical advice, so please follow your doctor.' },
  { q: 'What happens to my data?', a: 'Your data is encrypted in transit, never sold, and your name and email are never sent to the AI. You can export or delete everything at any time.' },
]

export function Faq() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <Reveal className="mt-12 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-heading">
                {f.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-transform duration-300 group-open:rotate-45">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
