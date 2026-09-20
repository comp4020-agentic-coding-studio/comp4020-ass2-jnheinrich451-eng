/** One native modal reader, shared by all unlocked cards. No collection writes. */
export function initializeComicReader(root: HTMLElement) {
  const dialog = root.querySelector<HTMLDialogElement>('[data-comic-reader]')!;
  const image = dialog.querySelector<HTMLImageElement>('[data-reader-image]')!;
  const viewport = dialog.querySelector<HTMLElement>('[data-reader-viewport]')!;
  const title = dialog.querySelector<HTMLElement>('[data-reader-title]')!;
  const note = dialog.querySelector<HTMLElement>('[data-reader-note]')!;
  const status = dialog.querySelector<HTMLElement>('[data-reader-status]')!;
  const original = dialog.querySelector<HTMLAnchorElement>('[data-reader-original]')!;
  const close = dialog.querySelector<HTMLButtonElement>('[data-reader-close]')!;
  const smaller = dialog.querySelector<HTMLButtonElement>('[data-reader-smaller]')!;
  const larger = dialog.querySelector<HTMLButtonElement>('[data-reader-larger]')!;
  const reset = dialog.querySelector<HTMLButtonElement>('[data-reader-reset]')!;
  const zoomLabel = dialog.querySelector<HTMLElement>('[data-reader-zoom]')!;
  let trigger: HTMLButtonElement | undefined;
  let previousOverflow = '';
  let scrollLocked = false;
  function releaseScroll() {
    if (!scrollLocked) return;
    document.body.style.overflow = previousOverflow;
    scrollLocked = false;
  }
  let zoom = 1;
  let backdropDown = false;
  function setZoom(value: number) {
    zoom = Math.max(1, Math.min(3, value));
    image.style.width = `${zoom * 100}%`;
    smaller.disabled = zoom === 1;
    larger.disabled = zoom === 3;
    zoomLabel.textContent = zoom === 1 ? 'Fit width' : `${zoom * 100}%`;
  }
  root.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-read-comic]');
    if (!button || button.closest<HTMLElement>('[data-card-content]')?.hidden) return;
    trigger = button;
    title.textContent = button.dataset.title!;
    note.textContent = button.dataset.note!;
    image.alt = `${button.dataset.title}. Six-panel comic; the text version is available via Read transcript.`;
    status.textContent = 'Loading comic…';
    image.hidden = true;
    image.src = button.dataset.fullSrc!;
    original.href = button.dataset.fullSrc!;
    setZoom(1);
    // A native close event is queued: reopening immediately must not save
    // our own temporary scroll lock as the page's original overflow.
    if (!scrollLocked) previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    scrollLocked = true;
    viewport.scrollTo(0, 0);
    close.focus();
  });
  image.addEventListener('load', () => { image.hidden = false; status.textContent = ''; });
  image.addEventListener('error', () => { image.hidden = true; status.textContent = 'The comic could not load. Read the transcript or try the image link below.'; });
  close.addEventListener('click', () => dialog.close());
  smaller.addEventListener('click', () => setZoom(zoom - .5));
  larger.addEventListener('click', () => setZoom(zoom + .5));
  reset.addEventListener('click', () => { setZoom(1); viewport.scrollTo(0, 0); });
  const outside = (event: PointerEvent | MouseEvent) => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => {
    if (backdropDown && event.target === dialog && outside(event)) dialog.close();
    backdropDown = false;
  });
  dialog.addEventListener('close', () => {
    if (dialog.open) return; // Ignore a queued close from an earlier opening.
    releaseScroll();
    trigger?.focus({preventScroll:true});
  });
  dialog.querySelector('[data-reader-transcript]')!.addEventListener('click', () => {
    const transcript = trigger?.closest('[data-comic-id]')?.querySelector<HTMLDetailsElement>('[data-comic-transcript]');
    dialog.close();
    if (transcript) {
      // Run after native close/focus restoration.
      requestAnimationFrame(() => { transcript.open = true; transcript.querySelector('summary')!.focus(); });
    }
  });
  document.addEventListener('astro:before-swap', () => {
    if (dialog.open) dialog.close();
    releaseScroll();
  }, {once:true});
}
