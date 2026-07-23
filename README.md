# EnView 0.5 — Core Engine

EnView 0.5 moves the project from a collection of screens to a working object-based platform.

## What is new

### Permanent EnView IDs

Every object has a stable identifier:

- `ENV-VEH-0001`
- `ENV-EQP-0001`
- `ENV-ENG-0001`
- `ENV-LOC-0001`
- `ENV-PART-0001`

The identifier remains stable even if an object is renamed or moved.

### Core object types

- Assets
- Locations
- Parts
- Relationships
- Service history
- Documents and photos placeholders

### Working local persistence

New assets, locations and parts are saved in browser `localStorage`.

This is not yet a multi-user cloud database, but it proves the Core Engine behavior and data model before adding authentication and a hosted backend.

### Parts and ordering foundation

Part records now include:

- Part number
- Compatible asset IDs
- Preferred retailer
- Retailer search links
- Verified-fitment status
- Quantity on hand
- Inventory location

The interface can open Amazon or Walmart search results for a stored part. EnView does not sign into or place orders in a user's retail account.

### Relationships

Assets can connect to:

- Locations
- Parts
- Other assets
- Power systems
- Network devices

Example:

`ENV-VEH-0001 → uses_part → ENV-PART-0001`

## Files

- `index.html`
- `assets/css/styles.css`
- `assets/js/app.js`
- `assets/data/core.json`
- `README.md`

## GitHub deployment

Upload the contents of this package to the root of the `website` repository. Replace the current EnView files and preserve the folder structure.

Cloudflare Pages should deploy automatically.

## Important cleanup

The site only needs the new `assets` folder structure. Old root-level copies such as these can be removed after confirming deployment:

- `app.js`
- `styles.css`
- `css/`
- `js/`
- `maintenance.html`

## Next release

**EnView 0.6 — First Real Asset**

Build the full 2021 Volkswagen Tiguan experience on top of the Core Engine:

- Complete specifications
- Structured maintenance history
- Parts and fluids
- Documents
- Upcoming service
- Quick maintenance logging
