# PeachWeb 3D Scene (local)

Offline extract of the 3D scene from https://romantic-fzwqyx.peachweb.site/

Includes the PeachWeb runtime, scene state, GLB models, HDRIs, textures, Draco decoder, and related assets (~16 MB).

## Run

```powershell
python -m http.server 3456
```

Open http://localhost:3456

Or double-click `start.bat`.

## Notes

- The site UI shell is included so the PeachWeb player can boot; the 3D scene is the fixed full-bleed canvas behind it.
- Scene is not editable — this is a runtime + asset dump, not a PeachWeb project file.
- Must be served over HTTP (not `file://`) because of ES modules / WASM / fetch.
