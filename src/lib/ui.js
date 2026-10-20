/** Tiny event bus so any page can open the auth modal without prop drilling. */
export function openAuth(mode = 'signin') {
  window.dispatchEvent(new CustomEvent('priva:auth', { detail: { mode } }));
}
