import { STATS } from "@/lib/constants";

export function AnimatedStats() {
  return (
    <dl className="ktf-stagger grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className="border-l border-white/15 pl-5 sm:pl-6"
        >
          <dd className="text-[2rem] font-bold leading-none tracking-tight text-white sm:text-h2">
            {stat.value}
          </dd>
          <dt className="mt-2 text-caption font-semibold uppercase tracking-[0.15em] text-ktf-gray-400">
            {stat.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
