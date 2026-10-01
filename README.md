# TGC 3D Card

Vite preview of `public/rive/3Dcard.riv`: a GPU-shaded 3D trading card. Pick a card from the thumbnails at the bottom to swap its artwork.

```sh
npm install
npm run dev      # local dev server
npm run build    # static build in dist/
```

## Layout

- `public/rive/3Dcard.riv`: Rive file (the `Card3D` script needs `enableGPUCanvas`)
- `public/cards/`: full-size card art (1024×1024)
- `public/cards/thumbs/`: 240px thumbnails
- `src/main.js`: loads the Rive file, finds the image view-model property and swaps the card art

Deployed on Vercel (Vite preset: `npm run build`, output `dist/`).
