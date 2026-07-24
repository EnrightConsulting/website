# EnView v0.10.0 — Connected Services

This release introduces the reusable Connected Services framework and proves it with PowerView.

## PowerView test connection
- Stores an editable dashboard URL in browser storage.
- Tests the stable `/api/live` endpoint.
- Displays battery, solar, load, grid, and garage temperature when the API is reachable.
- Opens the complete PowerView dashboard in a new browser tab instead of embedding it.
- Adds a Connected Services manager and an asset-level Connections tab for energy assets.

## Deployment
Upload the contents of this folder to the repository root used by Cloudflare Pages. Existing browser data from v0.9.2 and earlier is migrated automatically.
