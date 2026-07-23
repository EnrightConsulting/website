# EnView 0.6.1 — PowerView Connected

This release combines the polished EnView 0.4 experience with the object-based Core Engine introduced in 0.5.

## Product direction

The Core Engine powers EnView but no longer becomes the homepage.

Users see:

- A welcoming dashboard
- Today's priorities
- Favorite asset cards
- Applications
- Recent activity
- One-click access to useful information

The underlying asset IDs, locations and parts relationships remain available behind every screen.

## Included

- Restored polished dashboard experience
- Favorite asset cards powered by Core data
- Priority cards based on asset health
- Application cards
- Assets and Locations pages
- Working search across assets, locations and parts
- First expanded Tiguan detail experience
- Quick-action panel
- Parts and retailer search links
- Permanent EnView IDs behind the interface
- Responsive desktop and mobile layouts

## Deployment

Upload these files while preserving the folder structure:

- `index.html`
- `README.md`
- `assets/css/styles.css`
- `assets/js/app.js`
- `assets/data/core.json`

Cloudflare Pages should deploy automatically after the GitHub commit.

## Repository cleanup

After deployment is confirmed, delete old duplicate root-level files and folders that are no longer used:

- `app.js`
- `styles.css`
- `core.json`
- `css/`
- `js/`
- `data/`
- `maintenance.html`

Keep only the new `assets/` folder and the current root `index.html` and `README.md`.

## Next release

**EnView 0.7 — Tiguan Quick Capture**

- Fast service logging
- Mileage update
- Maintenance checkboxes
- Receipt and cost capture
- Automatic next-service calculation
- Local saved maintenance history


## PowerView connection

The PowerView sidebar item and dashboard application card now open the live PowerView dashboard in a new browser tab:

`http://192.168.1.54:8084/#mission`

This address is local to the home network, so it will work only when the device opening EnView can reach that private IP address.
