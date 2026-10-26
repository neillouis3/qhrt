const LENSES = [
  { cx: 400, cy: 270, fill: '#f8c8e4' },
  { cx: 513, cy: 335, fill: '#d4c4f5' },
  { cx: 513, cy: 465, fill: '#b5ddf5' },
  { cx: 400, cy: 530, fill: '#c5efc7' },
  { cx: 287, cy: 465, fill: '#f2edbc' },
  { cx: 287, cy: 335, fill: '#f8c4bc' },
] as const;

interface LogoProps {
  className?: string;
  title?: string;
  decorative?: boolean;
  animated?: boolean;
}

export default function Logo({
  className = 'h-10 w-10',
  title = 'QHRT',
  decorative = false,
  animated = false,
}: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 800"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      className={`logo-seed block shrink-0 ${animated ? 'logo-seed--animated' : ''} ${className}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative || undefined}
    >
      <g className="logo-seed__lenses">
        {LENSES.map((lens) => (
          <circle
            key={`${lens.cx}-${lens.cy}`}
            className="logo-seed__lens"
            cx={lens.cx}
            cy={lens.cy}
            r={150}
            fill={lens.fill}
          />
        ))}
      </g>
    </svg>
  );
}
