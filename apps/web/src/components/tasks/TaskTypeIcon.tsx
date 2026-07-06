import type { ComponentType, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

interface TaskTypeIconProps extends IconProps {
  taskType: string;
}

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function WaterIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3.5c-2.9 3.4-5 6.4-5 9.1a5 5 0 0 0 10 0c0-2.7-2.1-5.7-5-9.1Z" />
      <path d="M9.8 14.2c.4 1.1 1.2 1.7 2.4 1.7" />
    </svg>
  );
}

function FertilizeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 18c3.8 0 7-3.2 7-7V6" />
      <path d="M12 11c0-3.3 2.7-6 6-6" />
      <path d="M12 11c3.3 0 6 2.7 6 6" />
      <path d="M6 6v4" />
      <path d="M4 8h4" />
    </svg>
  );
}

function PruneIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="6.5" cy="17.5" r="2.2" />
      <circle cx="17.5" cy="17.5" r="2.2" />
      <path d="M8.1 15.9 18 6" />
      <path d="M15.9 15.9 6 6" />
      <path d="M14.5 7.5 18 6l-1.5 3.5" />
    </svg>
  );
}

function MistIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M7.5 14.5h8.2a3.3 3.3 0 0 0 .4-6.6 4.7 4.7 0 0 0-8.8 1.3A2.7 2.7 0 0 0 7.5 14.5Z" />
      <path d="M8 18h.01" />
      <path d="M12 19h.01" />
      <path d="M16 18h.01" />
    </svg>
  );
}

function PhTestIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M10 3v5.6l-4.7 8.2A2.7 2.7 0 0 0 7.6 21h8.8a2.7 2.7 0 0 0 2.3-4.2L14 8.6V3" />
      <path d="M8.5 3h7" />
      <path d="M7.3 16h9.4" />
      <path d="M10 12h4" />
    </svg>
  );
}

function PestControlIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3.5 19 6v5.2c0 4.4-2.8 7.9-7 9.3-4.2-1.4-7-4.9-7-9.3V6l7-2.5Z" />
      <path d="M9 12h6" />
      <path d="M10 9.5h4" />
      <path d="M10 14.5h4" />
      <path d="M8 10.5 6.8 9.3" />
      <path d="M16 10.5l1.2-1.2" />
    </svg>
  );
}

function RepotIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M8 21h8l1.5-9h-11L8 21Z" />
      <path d="M6 12h12" />
      <path d="M12 12V5" />
      <path d="M12 8c-2.6 0-4.5-1.7-4.5-4 2.6 0 4.5 1.7 4.5 4Z" />
      <path d="M12 8c2.6 0 4.5-1.7 4.5-4-2.6 0-4.5 1.7-4.5 4Z" />
    </svg>
  );
}

function RotateIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M19 8a7 7 0 0 0-12.1-2.1L5 8" />
      <path d="M5 4v4h4" />
      <path d="M5 16a7 7 0 0 0 12.1 2.1L19 16" />
      <path d="M19 20v-4h-4" />
    </svg>
  );
}

function CleanLeavesIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 18c5.2 0 11-4.8 11-11V4h-3C6.8 4 4 9.8 4 15v3h1Z" />
      <path d="M5 18 16 7" />
      <path d="M18 14v4" />
      <path d="M16 16h4" />
    </svg>
  );
}

function InspectPestsIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="m15 15 4.5 4.5" />
      <path d="M8.2 10.2h4.6" />
      <path d="M9 8h3" />
      <path d="M9 12.5h3" />
    </svg>
  );
}

function CheckMoistureIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M10.5 3.5c-2.4 2.9-4 5.3-4 7.5a4 4 0 0 0 7.5 1.9" />
      <path d="m13.5 17 2 2 4-5" />
      <path d="M8.8 12.8c.3.7.9 1.1 1.7 1.1" />
    </svg>
  );
}

function HealthCheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M20.4 7.8c0 5.2-8.4 10.7-8.4 10.7S3.6 13 3.6 7.8A4.3 4.3 0 0 1 11 4.9l1 1 1-1a4.3 4.3 0 0 1 7.4 2.9Z" />
      <path d="M8 12h2l1-2 2 4 1-2h2" />
    </svg>
  );
}

function LeafIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 19c6.2 0 12-5.4 12-12V4h-3C7.4 4 4 9.8 4 16v3h1Z" />
      <path d="M5 19 17 7" />
    </svg>
  );
}

const taskTypeIconComponents: Record<string, ComponentType<IconProps>> = {
  WATER: WaterIcon,
  FERTILIZE: FertilizeIcon,
  PRUNE: PruneIcon,
  MIST: MistIcon,
  PH_TEST: PhTestIcon,
  PEST_CONTROL: PestControlIcon,
  REPOT: RepotIcon,
  ROTATE: RotateIcon,
  CLEAN_LEAVES: CleanLeavesIcon,
  INSPECT_PESTS: InspectPestsIcon,
  CHECK_MOISTURE: CheckMoistureIcon,
  HEALTH_CHECK: HealthCheckIcon,
};

export function TaskTypeIcon({ taskType, ...props }: TaskTypeIconProps) {
  const Icon = taskTypeIconComponents[taskType] ?? LeafIcon;
  return <Icon {...props} aria-hidden focusable="false" />;
}
