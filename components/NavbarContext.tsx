export interface NavItem {
  name: string;
  path: string;
}

export interface NavbarLinksContextValue {
  adminLinks?: NavItem[];
  userLinks?: NavItem[];
}
