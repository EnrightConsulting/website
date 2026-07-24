# EnView 0.7.2 — Maintenance Intelligence

This release expands EnView from the 0.6.1 experience layer into a functional maintenance-planning system.

## Included

- Asset-specific maintenance programs
- Multiple maintenance plans per asset
- Maintenance plan groups
- Manufacturer, EnView, company, regulatory, and user-created sources
- Multiple time- and meter-based triggers per plan
- Manufacturer/suggested intervals preserved beside editable active intervals
- Optional reason for interval overrides
- User-created plans above manufacturer specifications
- Reusable service checklists
- Service recording with date, cost, notes, and meter readings
- Automatic next-due calculations
- Current, due-soon, overdue, and needs-setup statuses
- Local browser persistence through localStorage
- Maintenance plan search through the global search bar

## Use

Open `index.html` through a local web server or deploy the folder to Cloudflare Pages. Direct file opening may block the JSON fetch in some browsers.

## Data

Starter data lives in `assets/data/core.json`. User changes are stored in the browser under `enview-v0.7.2`.
