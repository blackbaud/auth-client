export function getNonceStyleCount(nonce: string): number {
  return Array.from(document.querySelectorAll('style')).filter(
    (styleEl) => styleEl.nonce === nonce
  ).length;
}
