interface OnboardingProgressProps {
  step: number;
  total?: number;
}

export function OnboardingProgress({
  step,
  total = 5,
}: OnboardingProgressProps) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index < step;

        return (
          <span
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              isActive
                ? "w-5 bg-emerald-500/85"
                : "w-1.5 bg-slate-300/75"
            }`}
          />
        );
      })}
    </div>
  );
}
