# Components layout

## Folders

| Folder | Purpose |
|--------|---------|
| `admin/` | Admin CMS tabs and shared admin UI |
| `auth/` | Login, signup, reset password flows |
| `conversation/` | Guided conversation session UI |
| `home/` | Home ambient layout and dashboard sections |
| `layout/` | Page shells, skeletons, public layout, errors |
| `marketing/` | Landing icons and session-aware CTAs |
| `nav/` | Navbar, provider, theme switcher, user menu |
| `session/` | Recap UI, session entry wrappers, progress, rows |
| `settings/` | Settings form, nav, account modals |
| `therapeutic/` | Journey / therapeutic engine session UI |
| `ui/` | Shared primitives (card, modal, logo, fields) |
| `user/` | User-facing route screens (`*Page.tsx`) |

## Naming rules

1. **Files** — `PascalCase.tsx`, matching the primary export (e.g. `HomePage.tsx` → `HomePage`).
2. **Route screens** — `user/*Page.tsx` pairs with `app/(user)/…/page.tsx` (e.g. `SessionsPage` for `/sessions`, not “Conversations”).
3. **Multi-export modules** — descriptive file names: `HomeDashboardSections`, `SessionRecap`, `SettingsAccountModals`, `MarketingCtas`, `LandingIcons`, `SessionEntry`.
4. **Imports** — always use the full path, e.g. `@/components/user/HomePage`, `@/components/ui/AppCard`.
