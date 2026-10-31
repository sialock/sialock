# SIA / Molecular Universe

An interactive Three.js portfolio for computational biology and machine learning. The project is deployed from the profile repository's `docs/` folder without changing the GitHub profile README.

## Contents

- Interactive 3D scene with three clickable research nodes (single-cell, protein modeling, next project)
- Generated DNA, illustrative protein loops and molecular network (not measured biological structures)
- Mouse/touch drag to rotate the scene, keyboard-accessible node labels, reduced-motion support
- Responsive project cards linked to real public research repositories
- Optional public GitHub API stars, with offline fallbacks
- No tracked patient data or access tokens
- Static CSS fallback when WebGL or the CDN is unavailable

## Local preview

```sh
python -m http.server 8000 --directory .
# visit http://localhost:8000
```

## Publishing on GitHub Pages

Copy the site files into `/docs` of the `sialock/sialock` profile repository, keeping its root `README.md` untouched. Then open **Settings → Pages → Build and deployment → Deploy from a branch → main → /docs → Save**. The site URL for this user account is expected to be `https://sialock.github.io/sialock/` when publication completes. You can change the page source or disable Pages from the same settings.

The scene uses a pinned `three@0.169.0` CDN import, which requires a network connection for WebGL. If the CDN cannot be loaded, the site still shows accessible project cards and a static orbit design. Repo metadata is loaded from public GitHub API without authentication and is nonessential.

## Scientific note

The 3D molecular shapes are intentionally illustrative. For actual structural analysis and its limitations, consult the individual project repositories.