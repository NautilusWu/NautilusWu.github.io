import { onReady, prefersReducedMotion } from './ready';

/**
 * Pointer-tracked spotlight on cards.
 *
 * One delegated `pointermove` per container rather than one per card, values
 * written as percentages so the gradient in CSS does the work. Coalesced into
 * a single rAF so a fast pointer cannot queue up style writes.
 */
onReady(() => {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  const zones = document.querySelectorAll<HTMLElement>('[data-spotlight]');
  if (!zones.length) return;

  let pending: { card: HTMLElement; x: number; y: number } | null = null;
  let frame = 0;

  const flush = () => {
    frame = 0;
    if (!pending) return;
    pending.card.style.setProperty('--mx', `${pending.x}%`);
    pending.card.style.setProperty('--my', `${pending.y}%`);
    pending = null;
  };

  const onMove = (event: PointerEvent) => {
    const card = (event.target as HTMLElement).closest<HTMLElement>('.card');
    if (!card) return;
    const box = card.getBoundingClientRect();
    pending = {
      card,
      x: ((event.clientX - box.left) / box.width) * 100,
      y: ((event.clientY - box.top) / box.height) * 100,
    };
    if (!frame) frame = requestAnimationFrame(flush);
  };

  zones.forEach((zone) => zone.addEventListener('pointermove', onMove, { passive: true }));

  return () => {
    zones.forEach((zone) => zone.removeEventListener('pointermove', onMove));
    if (frame) cancelAnimationFrame(frame);
  };
});
