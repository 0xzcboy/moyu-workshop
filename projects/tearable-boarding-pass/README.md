# Tearable Boarding Pass

Archived from the author's React / TypeScript project. Source files and the
dependency lockfile are preserved; local tool settings and build output are excluded.
This artwork is not covered by the gallery's MIT license. No redistribution or
commercial license has been assigned. Dependencies retain their own licenses.

Requires Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Production build with portable asset URLs:

```sh
npm run build -- --base ./
npm run preview
```

Drag the stub right and down to tear it off. Click Reattach to reset. Focus the
stub and press Enter / Space to tear it off, or Right / Down for 10% increments.
The DialKit panel adjusts ticket details, airline colors and motion parameters.
The original page loads Google Fonts; fallback fonts work if that service is
unavailable. The ticket is a visual interaction demo, not a valid travel document.
