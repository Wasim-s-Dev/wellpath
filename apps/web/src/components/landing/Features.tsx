import { Icon, Reveal, SectionHeading } from './ui'

const features = [
  { icon: 'adapt', title: 'A plan that learns your body', body: 'Your weight trend and what you eat reveal how much energy you really burn. Targets recalibrate every week, not once.' },
  { icon: 'food', title: 'Log food the way you talk', body: 'Type "2 roti and a bowl of daal" or snap a photo. WellPath understands local portions, from a katori to a plate.' },
  { icon: 'chat', title: 'An AI coach that shows its work', body: 'Ask anything, any time. Every answer explains why, using your plan and trusted guidelines, never guesses.' },
  { icon: 'shield', title: 'Safety rules built in', body: 'Knee pain, back pain or high blood pressure? Unsafe exercises are removed and a doctor notice is shown.' },
  { icon: 'moon', title: 'Ramadan mode', body: 'Sehri and iftar plans for your city, hydration timing, and light workouts at the right hour.' },
  { icon: 'wallet', title: 'Plans that fit your budget', body: 'Set a weekly grocery budget. Meals, swaps and a shopping list stay inside it.' },
  { icon: 'family', title: 'One kitchen, many goals', body: 'Cook one meal for the family. WellPath sets each person’s portion for their own target.' },
  { icon: 'chart', title: 'Progress you can read', body: 'Clear charts for weight, calories, water and training, plus a weekly report with one goal for next week.' },
]

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Features"
          title={<>Most apps give everyone the same plan. <span className="text-gradient">Yours changes with you.</span></>}
          sub="Built for people who have tried the fixed-plan apps and stopped after a week."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 80} className="h-full">
              <article className="card group h-full p-6 transition-colors hover:border-violet/40">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 text-lilac transition-transform group-hover:scale-110">
                  <Icon name={f.icon} />
                </span>
                <h3 className="mt-5 font-semibold text-heading">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
