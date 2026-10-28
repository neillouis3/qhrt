'use client';

import { Avatar } from '@heroui/react';
import { avatarSrcFromUser } from '@/lib/userAvatar';
import { initialsFromUser, type NameSource } from '@/lib/userName';

export default function UserAvatar({
  user,
  size = 'md',
  src,
  className,
}: {
  user: NameSource;
  size?: 'sm' | 'md';
  src?: string;
  className?: string;
}) {
  const imageSrc = src || avatarSrcFromUser(user);
  const initial = initialsFromUser(user);

  return (
    <Avatar size={size} color="accent" className={className}>
      {imageSrc ? <Avatar.Image src={imageSrc} alt="" /> : null}
      <Avatar.Fallback>{initial}</Avatar.Fallback>
    </Avatar>
  );
}
