# TypeGPU Playground

This demo is now a component-heavy design system showcase: actions, forms, badges, metrics, tables,
navigation shells, pricing cards, tabs, modal, and live toasts. TypeGPU powers the ambient accent
layer behind the UI, but the design system remains usable even when WebGPU is unavailable.

## Recommended launch command

```bash
env DRI_PRIME=pci-0000_00_02_0 google-chrome-stable \
  --ozone-platform=wayland \
  --render-node-override=/dev/dri/renderD128 \
  --enable-features=Vulkan,UseSkiaRenderer \
  --enable-unsafe-webgpu
```

## Notes

- Opera is currently not a supported target on this machine because its active GPU session reports `WebGPU: Disabled`.
- The app now keeps the component gallery alive even when `navigator.gpu` is missing or `requestAdapter()` returns `null`; only the TypeGPU accent layer falls back to diagnostics.
- For quick verification, open `chrome://gpu` and run `await navigator.gpu?.requestAdapter()` in DevTools.
