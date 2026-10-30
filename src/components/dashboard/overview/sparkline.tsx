interface SparklineProps {
  values: number[];
  /** Fill the area under the line */
  area?: boolean;
  label: string;
}

/** Small trend line for the KPI tiles. */
export function Sparkline({ values, area = false, label }: SparklineProps) {
  if (values.length < 2) return <div className="h-9" />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((value, i) => {
    const x = (i / (values.length - 1)) * 200;
    const y = 32 - ((value - min) / range) * 28;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const line = `M${points.join(' L')}`;
  return (
    <svg viewBox="0 0 200 36" preserveAspectRatio="none" className="mt-1 h-9 w-full" role="img" aria-label={label}>
      {area && <path d={`${line} L200 36 L0 36Z`} className="fill-brand-blue/10" />}
      <path d={line} fill="none" className="stroke-brand-blue" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
