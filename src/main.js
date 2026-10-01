import {
  Rive,
  Layout,
  Fit,
  Alignment,
  RuntimeLoader,
  decodeImage,
} from '@rive-app/webgl2';
import riveWasmUrl from '@rive-app/webgl2/rive.wasm?url';
import './style.css';

// Serve the runtime WASM from our own build instead of the unpkg CDN.
RuntimeLoader.setWasmUrl(riveWasmUrl);

const CARDS = [
  { id: 'tim', label: 'Tim' },
  { id: 'brock', label: 'Brock' },
  { id: 'jd_dark', label: 'JD (Dark)' },
  { id: 'jd_light', label: 'JD (Light)' },
];

const DEFAULT_CARD = 'brock';

const BASE = import.meta.env.BASE_URL;
const cardUrl = (id) => `${BASE}cards/card_${id}.png`;
const thumbUrl = (id) => `${BASE}cards/thumbs/card_${id}.png`;

const canvas = document.getElementById('rive-canvas');
const thumbsEl = document.getElementById('thumbs');

const decodedImages = new Map();
let imageProperty = null;
// The embedded card image asset. The Card3D script samples this asset for its
// shader texture, so it is swapped alongside the data-bound image property.
let cardAsset = null;
let selectedId = null;

const rive = new Rive({
  src: `${BASE}rive/3Dcard.riv`,
  canvas,
  autoplay: true,
  autoBind: true,
  stateMachine: 'State Machine 1',
  // The card is drawn by a Luau script using GPU shaders (GPU Canvas).
  enableGPUCanvas: true,
  layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  assetLoader: (asset) => {
    if (asset.isImage) cardAsset = asset;
    // Let the runtime load the embedded bytes; we only keep a reference.
    return false;
  },
  onLoad: () => {
    rive.resizeDrawingSurfaceToCanvas();
    imageProperty = findImageProperty(rive.viewModelInstance);
    if (imageProperty) {
      console.info(`Using image property "${imageProperty.path}"`);
    } else {
      console.warn('No image data-bind property found on the view model.');
    }
    selectCard(DEFAULT_CARD);
  },
});

window.addEventListener('resize', () => rive.resizeDrawingSurfaceToCanvas());

// Walk the view model (including nested view models) and return the first
// image-typed property along with its accessor.
function findImageProperty(vmi, prefix = '') {
  if (!vmi) return null;
  for (const prop of vmi.properties) {
    const path = prefix ? `${prefix}/${prop.name}` : prop.name;
    console.debug(`[viewmodel] ${path}: ${prop.type}`);
    if (prop.type === 'image') {
      return { path, accessor: vmi.image(prop.name) };
    }
    if (prop.type === 'viewModel') {
      const found = findImageProperty(vmi.viewModel(prop.name), path);
      if (found) return found;
    }
  }
  return null;
}

function loadImage(id) {
  if (!decodedImages.has(id)) {
    const promise = fetch(cardUrl(id))
      .then((res) => res.arrayBuffer())
      .then((buf) => decodeImage(new Uint8Array(buf)));
    decodedImages.set(id, promise);
  }
  return decodedImages.get(id);
}

async function selectCard(id) {
  selectedId = id;
  for (const btn of thumbsEl.children) {
    btn.setAttribute('aria-pressed', String(btn.dataset.id === id));
  }
  const image = await loadImage(id);
  // Ignore stale loads if another card was picked while this one decoded.
  if (selectedId !== id) return;
  if (imageProperty) imageProperty.accessor.value = image;
  cardAsset?.setRenderImage(image);
}

for (const card of CARDS) {
  const btn = document.createElement('button');
  btn.className = 'thumb';
  btn.dataset.id = card.id;
  btn.title = card.label;
  btn.setAttribute('aria-pressed', 'false');
  btn.innerHTML = `<img src="${thumbUrl(card.id)}" alt="${card.label}" />`;
  btn.addEventListener('click', () => selectCard(card.id));
  thumbsEl.appendChild(btn);
}
