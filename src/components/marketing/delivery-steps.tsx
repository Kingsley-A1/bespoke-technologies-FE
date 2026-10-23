import { DELIVERY_PROCESS } from "@/lib/constants";
import { StaggerGroup } from "./stagger-group";

/**
 * The three delivery steps. On wider screens a line connects the step markers
 * and draws across once, when the section first comes into view; on phones the
 * steps stack. Server-rendered and motion-library free.
 */
export function DeliverySteps() {
  return (
    <StaggerGroup className="relative mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
      {DELIVERY_PROCESS.map((phase) => (
        <article key={phase.step} className="relative">
          <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-ktf-gray-300 bg-white text-caption tabular-nums font-medium text-ktf-navy">
            {phase.step}
          </span>
          <h3 className="mt-5 text-h5 font-semibold tracking-[-0.02em] text-ktf-obsidian">{phase.title}</h3>
          <p className="mt-2 max-w-xs text-body-sm leading-body text-ktf-gray-600">{phase.description}</p>
        </article>
      ))}
      <span
        aria-hidden="true"
        className="ktf-progress-line pointer-events-none absolute left-5 right-[calc(33.333%-2.25rem)] top-5 hidden h-px bg-ktf-blue-deep/60 md:block"
      />
    </StaggerGroup>
  );
}
