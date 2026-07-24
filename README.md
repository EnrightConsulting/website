# EnView v0.9.2 — PowerView Integration

This focused release keeps the original PowerView dashboard inside the EnView experience instead of opening a separate browser window.

## Included

- PowerView opens within EnView while the EnView sidebar and header remain visible
- The existing PowerView dashboard is embedded without rebuilding it
- Live summary strip for battery SOC, solar, home load, grid, and garage temperature
- Stable fields use `solark.soc`, `solark.pvPower`, `solark.loadPower`, `solark.gridPower`, and `garage_temp.garage_temp_f`
- Reload and same-tab full-screen controls
- Editable HTTPS PowerView connection URL for temporary Cloudflare tunnel changes
- Clear fallback guidance when the tunnel is offline or embedding is blocked
- Existing v0.9.1 browser data migrates automatically

## Deployment

Upload the contents of this folder to the EnView GitHub repository / Cloudflare Pages project.

The default PowerView URL is the current temporary Cloudflare tunnel. Use **PowerView → Connection** to update it when the tunnel address changes.
