# EnView 0.8.1 — Stabilization

This release fixes the startup/event-binding failure in v0.8.0 and connects the visible Asset Center controls.

## Fixed and verified
- Add Asset opens from Asset Center and Quick Action
- Asset forms save, edit, archive, disable, sleep, restore, and permanently delete
- All six Quick Action buttons now perform a real action
- Log Service opens a real service workflow
- Move Asset updates the permanent asset record
- Add Receipt stores a receipt and adds asset history
- Order Parts opens a focused web search
- Report Issue creates an open issue and dashboard priority
- Dashboard View All, profile/settings, navigation, search, filters, and modal close controls are connected
- Existing v0.8.0 and v0.7.2 browser data is migrated automatically
- Startup errors are shown visibly instead of silently leaving controls disconnected

## Deployment
Upload the contents of this folder to the root of the EnrightConsulting/website repository. Cloudflare Pages will deploy automatically.
