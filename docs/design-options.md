# SIA / LAB — Three original visual themes

This profile is designed as a computational-biology research portfolio. All banners are **PNG raster graphics** generated from an openly editable Python script, not animated SVG, and use original illustrative molecular/data motifs. They are not measurements or experimentally reconstructed molecular structures.

| Theme | Visual direction | Image |
| --- | --- | --- |
| **Molecular Lab** (default) | Dark teal DNA, clean typography, research aesthetic | [Preview](../assets/hero-molecular-lab.png) |
| **Protein Atlas** | Violet coiled-protein motif, structural bioinformatics aesthetic | [Preview](../assets/hero-protein-atlas.png) |
| **Research Skyline** | Isometric neon-green data towers, AI and computational science aesthetic | [Preview](../assets/hero-data-skyline.png) |

## Switch the main theme

**No code editing required:** open [Switch SIA/LAB theme](https://github.com/sialock/sialock/actions/workflows/switch-profile-theme.yml) in the Actions tab, choose **Run workflow**, select the theme, then run it. The workflow modifies only the hero image reference in `README.md` and records a normal commit.

For a manual switch, change the first `<img src="./assets/hero-molecular-lab.png"...>` reference in `README.md` to either `hero-protein-atlas.png` or `hero-data-skyline.png`.

## Regenerate raster banners

```bash
python -m pip install numpy Pillow
python scripts/render_profile_art.py
```

Alternatively run [Build 3D research artwork](https://github.com/sialock/sialock/actions/workflows/render-profile-art.yml) from GitHub Actions. All three images are deterministically generated as PNG.

## Real 3D GitHub contribution image

The PNG at `assets/contributions-3d.png` is **not illustrative sample data**. The workflow [Refresh 3D contribution landscape](../.github/workflows/profile-3d.yml) uses GitHub activity data to generate a three-dimensional view via `yoshi389111/github-profile-3d-contrib@v0.9.3`, converts the generated chart to PNG, and updates it on a weekly schedule.

The workflow uses the built-in `GITHUB_TOKEN` scoped to `contents: write` in this repository. No personal access token is required.

## Featured repository plots

The DonorShift-Bench graphic is linked from its own repository. The Protein-MC-Go example is rasterized from the project's checked-in demo energy plot. Both are synthetic teaching/demo outputs and must not be interpreted as clinical or experimental evidence.
