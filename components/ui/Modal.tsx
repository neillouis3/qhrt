'use client';

import { Modal as HeroModal, useOverlayState } from '@heroui/react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'lg',
} as const;

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const state = useOverlayState({
    isOpen,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
  });

  return (
    <HeroModal state={state}>
      <HeroModal.Backdrop variant="blur">
        <HeroModal.Container size={sizeMap[size]} placement="center">
          <HeroModal.Dialog aria-label={title}>
            <HeroModal.CloseTrigger />
            {title && (
              <HeroModal.Header>
                <HeroModal.Heading>{title}</HeroModal.Heading>
              </HeroModal.Header>
            )}
            <HeroModal.Body>{children}</HeroModal.Body>
          </HeroModal.Dialog>
        </HeroModal.Container>
      </HeroModal.Backdrop>
    </HeroModal>
  );
}
