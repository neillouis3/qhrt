import { Card } from '@heroui/react';
import type { ComponentProps } from 'react';

/** Shared card/surface styles — change rounding here, not per screen. */
export const surfaceClass = 'rounded-lg border-0 bg-default/30 shadow-none';

type AppCardProps = ComponentProps<typeof Card>;

export default function AppCard({ className, variant = 'transparent', ...props }: AppCardProps) {
  return (
    <Card variant={variant} className={[surfaceClass, className].filter(Boolean).join(' ')} {...props} />
  );
}

AppCard.Header = Card.Header;
AppCard.Title = Card.Title;
AppCard.Description = Card.Description;
AppCard.Content = Card.Content;
AppCard.Footer = Card.Footer;
