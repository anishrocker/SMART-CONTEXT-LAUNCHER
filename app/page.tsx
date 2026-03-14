import { launchFlows } from '@/app/lib/commands';

const agentModules = [
  {
    name: 'Command parser',
    detail: 'Turns short natural inputs into an unambiguous context.'
  },
  {
    name: 'Action workflows',
    detail: 'Chains the right launches, sequencing, and fallbacks.'
  },
  {
    name: 'Integrations',
    detail: 'Connects local apps, browser tabs, APIs, and automation hooks.'
  },
  {
    name: 'UI palette',
    detail: 'Keeps the command surface fast, visual, and keyboard-first.'
  }
];

const operatingPrinciples = [
  'One command opens a full environment',
  'Parallel modules coordinate the launch',
  'Built for developers who move across tools all day'
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.2),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#020617_55%,_#02030a_100%)]" />

      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-16 pt-8 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-orange-300">
              Smart Context Launcher
            </p>
          </div>
          <a
            href="/launch"
            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 font-mono text-xs text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/20"
          >
            Open Command Center
          </a>
        </div>

        <div className="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.28em] text-orange-200">
              Launch environments, not tabs
            </p>

            <h1 className="mt-8 font-display text-5xl uppercase leading-[0.92] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Type one word.
              <br />
              Open the whole workflow.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              A Raycast-inspired control surface for developers. Enter a context like{' '}
              <span className="font-mono text-cyan-300">gym</span> or{' '}
              <span className="font-mono text-cyan-300">study</span>, and the launcher fans
              out the exact tools, utilities, and automations that belong together.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {operatingPrinciples.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>

            <a
              href="/launch"
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/20 px-6 py-3 font-mono text-sm uppercase tracking-wider text-orange-200 transition hover:border-orange-400/60 hover:bg-orange-500/30"
            >
              Open Command Center
              <span className="text-orange-400/70">⌘K</span>
            </a>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-orange-500/10 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-slate-950/80 p-4 shadow-[0_30px_80px_rgba(2,6,23,0.65)] backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-400">
                      Command Palette
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Parallel modules resolve, preview, and launch the environment.
                    </p>
                  </div>
                  <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 font-mono text-xs text-cyan-200">
                    Live context
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-[#020817] p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">&gt;</span>
                    <span className="font-mono text-lg text-cyan-300">study</span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {launchFlows[1].actions.map((action, index) => (
                      <div
                        key={action}
                        className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-white">{action}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            Stage 0{index + 1} syncs into the same context.
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-400/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.25em] text-emerald-300">
                          Ready
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                      Parser
                    </p>
                    <p className="mt-3 text-sm text-slate-300">Maps intent from a single keyword.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                      Workflow
                    </p>
                    <p className="mt-3 text-sm text-slate-300">Schedules actions without manual setup.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                      Integrations
                    </p>
                    <p className="mt-3 text-sm text-slate-300">Launches apps, timers, notes, and blockers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/20 px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-orange-300">
              Example contexts
            </p>
            <h2 className="mt-4 font-display text-4xl uppercase tracking-[-0.04em] text-white sm:text-5xl">
              Small prompts.
              <br />
              Full setups.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              The page demonstrates how each command becomes a launchable operating mode instead
              of a single destination.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {launchFlows.map((flow) => (
              <article
                key={flow.command}
                className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.45)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
                      Type
                    </p>
                    <p className="mt-3 font-mono text-3xl text-cyan-300">{flow.command}</p>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-slate-300">
                    {flow.label}
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-400">{flow.summary}</p>

                <div className="mt-6 space-y-3">
                  {flow.actions.map((action) => (
                    <div
                      key={action}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                    >
                      <p className="text-base font-medium text-white">{action}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 sm:p-10">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-orange-300">
              Parallel modules
            </p>
            <h2 className="mt-4 font-display text-4xl uppercase tracking-[-0.04em] text-white sm:text-5xl">
              Agents build the stack behind each command.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Instead of treating the launcher as a single search box, the system is framed as a
              set of cooperating modules that parse intent, orchestrate workflows, and keep the UI
              responsive.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {agentModules.map((module) => (
              <div
                key={module.name}
                className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5"
              >
                <p className="font-mono text-xs uppercase tracking-[0.26em] text-slate-500">
                  Agent module
                </p>
                <h3 className="mt-4 text-xl font-semibold text-white">{module.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{module.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
