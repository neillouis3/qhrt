'use client';

import { createContext, useContext } from 'react';

export interface NavItem {
  name: string;
  path: string;
}

export interface NavbarLinksContextValue {
  adminLinks?: NavItem[];
}

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
