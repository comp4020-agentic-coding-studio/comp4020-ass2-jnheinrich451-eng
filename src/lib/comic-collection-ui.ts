import type * as collection from './comic-collection';

export function initializeCollection(root: HTMLElement, api: Pick<typeof collection, 'readCollection' | 'saveCard' | 'questionForCode' | 'resetCollection'>) {
  const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const form = find<HTMLFormElement>('[data-code-form]');
  const input = find<HTMLInputElement>('#comic-code');
  const status = find<HTMLElement>('[data-collection-status]');
  const storageStatus = find<HTMLElement>('[data-collection-storage]');
  const spoiler = find<HTMLDetailsElement>('[data-collection-spoilers]');
  const reveal = find<HTMLButtonElement>('[data-reveal-preview]');
  const previewStatus = find<HTMLElement>('[data-preview-status]');
  const cards = [...root.querySelectorAll<HTMLDetailsElement>('[data-comic-id]')];
  const groups = [...root.querySelectorAll<HTMLDetailsElement>('[data-comic-group]')];
  const reset = find<HTMLButtonElement>('[data-reset-collection]');
  const confirmation = find('[data-reset-confirm]');
  let collected = new Set<string>();
  let preview = false;
  let presses = 0;
  const unavailable = 'Browser storage is unavailable. Cards can be unlocked for this visit; keep your codes to reopen them later.';
  function loadPreview(card: HTMLDetailsElement) {
    if (!card.open || card.querySelector<HTMLElement>('[data-card-content]')!.hidden) return;
    const image = card.querySelector<HTMLImageElement>('img[data-preview-src]');
    if (image && !image.hasAttribute('src')) image.src = image.dataset.previewSrc!;
  }
  cards.forEach(card => card.addEventListener('toggle', () => loadPreview(card)));
  try { collected = api.readCollection(localStorage); } catch { storageStatus.textContent = unavailable; }
  form.hidden = false;
  reveal.hidden = false;
  find('[data-collection-controls]').hidden = false;

  function render() {
    for (const card of cards) {
      const id = card.dataset.comicId!;
      const owned = collected.has(id);
      const available = owned || preview;
      card.querySelector<HTMLElement>('[data-card-content]')!.hidden = !available;
      card.querySelector<HTMLElement>('[data-card-lock]')!.hidden = available;
      card.querySelector<HTMLElement>('[data-card-state]')!.textContent = owned ? 'Collected' : preview ? 'Preview only' : 'Locked';
      loadPreview(card);
    }
    find('[data-collected-total]').textContent = `${collected.size} / ${cards.length}`;
    for (const group of groups) {
      const count = cards.filter(c => c.dataset.comicId!.startsWith(group.dataset.comicGroup!) && collected.has(c.dataset.comicId!)).length;
      const total = group.querySelectorAll('[data-comic-id]').length;
      group.querySelector('[data-group-count]')!.textContent = `${count} / ${total} collected`;
    }
    find('[data-preview-banner]').hidden = !preview;
    reveal.disabled = preview;
    reveal.textContent = preview ? 'Preview is open' : `Reveal preview · ${presses} / 3`;
  }
  function showCard(id: string, moveFocus: boolean) {
    const card = cards.find(c => c.dataset.comicId === id);
    if (!card) return;
    card.closest<HTMLDetailsElement>('[data-comic-group]')!.open = true;
    card.open = true;
    if (moveFocus) card.querySelector<HTMLElement>('summary')!.focus({preventScroll:true});
    card.scrollIntoView({block:'start',behavior:'instant'});
  }
  function followHash() {
    const match = /^#comic-([LS]\d{2})$/.exec(location.hash);
    if (match) showCard(match[1], false);
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (preview) { status.textContent = 'Leave preview before collecting a code. Preview never changes your collection.'; return; }
    if (!input.value.trim()) { status.textContent = 'Enter a code from a lecture or session self-check.'; return; }
    const q = api.questionForCode(input.value);
    if (!q) { status.textContent = 'That code is not recognised. Copy the complete code from a self-check, for example SLOP-L01.'; return; }
    const already = collected.has(q.id);
    collected.add(q.id);
    try { api.saveCard(localStorage, q.id); storageStatus.textContent = 'Collection saved in this browser. No quiz answers or scores are stored.'; }
    catch { storageStatus.textContent = unavailable; }
    document.dispatchEvent(new CustomEvent('slop:comic-unlocked',{detail:q.id}));
    render();
    status.textContent = already ? `${q.id} is already in your collection. Opened it below.` : `${q.id} collected. Opened its teaching comic below.`;
    history.replaceState(history.state, '', `#comic-${q.id}`);
    showCard(q.id, true);
  });
  input.addEventListener('input', () => { status.textContent = ''; });
  find('[data-expand-comics]').addEventListener('click', () => {
    groups.forEach(g => { g.open = true; });
    cards.forEach(c => { c.open = preview || collected.has(c.dataset.comicId!); });
  });
  find('[data-collapse-comics]').addEventListener('click', () => {
    cards.forEach(c => { c.open = false; });
    groups.forEach(g => { g.open = false; });
  });
  reveal.addEventListener('click', () => {
    if (!spoiler.open || preview) return;
    presses += 1;
    if (presses === 3) {
      preview = true;
      previewStatus.textContent = 'Preview open. All 17 comics are available; your collection has not changed.';
      groups.forEach(g => { g.open = true; });
      render();
      find<HTMLElement>('[data-exit-preview]').focus({preventScroll:true});
      find('[data-preview-banner]').scrollIntoView({block:'center',behavior:'instant'});
    } else { previewStatus.textContent = `${presses} of 3 presses. No speed requirement.`; render(); }
  });
  spoiler.addEventListener('toggle', () => {
    if (!spoiler.open && !preview) { presses = 0; previewStatus.textContent = ''; render(); }
  });
  find('[data-exit-preview]').addEventListener('click', () => {
    preview = false; presses = 0; previewStatus.textContent = ''; status.textContent = 'Back to your collection. Preview added no cards.';
    cards.filter(c => !collected.has(c.dataset.comicId!)).forEach(c => { c.open = false; });
    render();
    input.focus();
  });
  const controller = new AbortController();
  addEventListener('hashchange', followHash, {signal:controller.signal});
  addEventListener('storage', event => {
    if (event.key && !event.key.startsWith('slop8412:self-check:v1:')) return;
    try { collected = api.readCollection(localStorage); render(); } catch { storageStatus.textContent = unavailable; }
  }, {signal:controller.signal});
  const resetPreview = () => {
    preview = false; presses = 0; previewStatus.textContent = '';
    cards.filter(c => !collected.has(c.dataset.comicId!)).forEach(c => { c.open = false; });
    render();
  };
  const closeConfirmation = () => {
    confirmation.hidden = true;
    reset.setAttribute('aria-expanded', 'false');
    reset.focus({preventScroll:true});
  };
  reset.addEventListener('click', () => {
    confirmation.hidden = false;
    reset.setAttribute('aria-expanded', 'true');
    find('[data-cancel-reset]').focus();
  });
  find('[data-cancel-reset]').addEventListener('click', closeConfirmation);
  confirmation.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeConfirmation(); }
  });
  find('[data-confirm-reset]').addEventListener('click', () => {
    try {
      api.resetCollection(localStorage);
      collected.clear();
      status.textContent = 'Collection reset. All 17 comics are locked again; the same codes still work.';
      storageStatus.textContent = 'Comic unlocks removed from this browser. Other saved settings were not changed.';
    } catch {
      try {
        collected = api.readCollection(localStorage);
        status.textContent = 'The browser could not clear every saved unlock. The count shows the flags still saved.';
      } catch {
        collected.clear();
        status.textContent = 'Collection cleared for this visit only. Browser storage is unavailable, so saved unlocks could not be removed or verified.';
      }
      storageStatus.textContent = 'Reset could not be fully saved. You can retry when browser storage is available.';
    }
    resetPreview();
    cards.forEach(card => { card.open = false; });
    input.value = '';
    document.dispatchEvent(new CustomEvent('slop:collection-reset'));
    closeConfirmation();
  });
  // Clear ephemeral spoilers before leaving, including a browser back/forward cache restore.
  addEventListener('pagehide', resetPreview, {signal:controller.signal});
  document.addEventListener('astro:before-swap', () => { resetPreview(); controller.abort(); }, {once:true,signal:controller.signal});
  render();
  followHash();
  root.dataset.collectionReady = 'true';
}
