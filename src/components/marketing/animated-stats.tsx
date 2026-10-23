import { STATS } from "@/lib/constants";
import { CountUp } from "./count-up";

export function AnimatedStats() {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className="border-l border-white/15 pl-5 sm:pl-6"
        >
          <dd className="text-[2rem] font-semibold leading-none tracking-[-0.04em] text-white sm:text-h2">
            <CountUp value={stat.value} />
          </dd>
          <dt className="mt-2 text-caption font-semibold uppercase tracking-[0.15em] text-ktf-gray-400">
            {stat.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
