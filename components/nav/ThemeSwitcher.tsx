'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons';

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="size-8" aria-hidden />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      isIconOnly
      size="sm"
      variant="tertiary"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onPress={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <HugeiconsIcon
        icon={isDark ? Moon02Icon : Sun03Icon}
        size={18}
        strokeWidth={1.5}
        className="text-foreground"
      />
    </Button>
  );
}
