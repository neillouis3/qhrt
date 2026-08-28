'use client';

import { createContext, useContext } from 'react';
import { NavbarLinksContextValue } from '@/components/NavbarContext';

const NavbarLinksContext = createContext<NavbarLinksContextValue>({});

export function useNavbarLinks() {
  return useContext(NavbarLinksContext);
}

export default function NavbarProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: NavbarLinksContextValue;
}) {
  return <NavbarLinksContext.Provider value={value}>{children}</NavbarLinksContext.Provider>;
}
