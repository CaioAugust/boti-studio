const icons = {
  key: '<circle cx="8" cy="9" r="4"/><path d="m11 12 8 8m-3-3 2-2m-5-1 2-2"/>',
  layers: '<path d="m12 4 9 5-9 5-9-5zm-9 9 9 5 9-5M3 17l9 5 9-5"/>',
  reset: '<path d="M3 12a9 9 0 1 1 3 7m-3-7V6m0 6h6"/>',
  mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v1a7 7 0 0 0 14 0v-1m-7 8v3m-3 0h6"/>',
  send: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
  volume: '<path d="M3 9v6h4l5 4V5L7 9zm13 0a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  arrow: '<path d="M6 18 18 6M8 6h10v10"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  github: '<path d="M9 19c-4 1-4-2-6-2m12 5v-3.5a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6a4.7 4.7 0 0 0-1.3-3.2 4.4 4.4 0 0 0-.1-3.2s-1-.3-3.3 1.2a11 11 0 0 0-6 0C6.7 3.5 5.7 3.8 5.7 3.8a4.4 4.4 0 0 0-.1 3.2 4.7 4.7 0 0 0-1.3 3.2c0 4.7 2.8 5.7 5.5 6A3 3 0 0 0 9 18.5V22"/>',
};

export function setIcon(element, name) {
  element.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[name] + '</svg>';
}
