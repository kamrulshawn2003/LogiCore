import React from 'react';

const PALETTE = [
  ['#f87171', '#ef4444'],
  ['#fb923c', '#f97316'],
  ['#fbbf24', '#f59e0b'],
  ['#4ade80', '#22c55e'],
  ['#2dd4bf', '#14b8a6'],
  ['#38bdf8', '#0ea5e9'],
  ['#818cf8', '#6366f1'],
  ['#c084fc', '#a855f7'],
  ['#f472b6', '#ec4899'],
];

const placeholderDataUri = (name = '') => {
  const seed = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  const [from, to] = PALETTE[seed % PALETTE.length];
  const letter = (name || 'LC').charAt(0).toUpperCase();
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="400" height="400" fill="url(#g)"/>` +
    `<text x="200" y="216" font-family="Arial, sans-serif" font-size="150" font-weight="bold" ` +
    `fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="middle">${letter}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Product image with a deterministic gradient placeholder fallback.
 * Avoids broken images when a product has no image_url.
 */
const ProductImage = ({ src, name, className, alt }) => {
  const [error, setError] = React.useState(false);
  const source = !src || error ? placeholderDataUri(name) : src;
  return (
    <img
      src={source}
      alt={alt || name || 'product'}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};

export default ProductImage;
