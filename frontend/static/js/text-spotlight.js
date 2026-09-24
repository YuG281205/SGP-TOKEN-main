/* Load after token-optimizer.js. No markup changes are needed. */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced || !finePointer) return;

  // Splitting text into word spans lets the light enlarge only the words it touches.
  const wrapWords = element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(node => {
      if (!node.nodeValue.trim()) return;
      const fragment = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.append(part);
          return;
        }
        const word = document.createElement('span');
        word.className = 'lp-spotlight-word';
        word.textContent = part;
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
  };

  document.querySelectorAll('.lp-feature__copy').forEach(copy => {
    // Limit the zoom to the heading and paragraph, not the number chips.
    copy.querySelectorAll('.feature-title, .feature-text').forEach(wrapWords);
    const words = [...copy.querySelectorAll('.lp-spotlight-word')];
    if (!words.length) return;

    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;
    const radius = 140;

    const paint = () => {
      frame = 0;
      const bounds = copy.getBoundingClientRect();
      copy.style.setProperty('--text-light-x', `${pointerX - bounds.left}px`);
      copy.style.setProperty('--text-light-y', `${pointerY - bounds.top}px`);

      words.forEach(word => {
        const rect = word.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const intensity = Math.max(0, 1 - Math.hypot(pointerX - x, pointerY - y) / radius);
        word.style.setProperty('--text-zoom', (1 + intensity * .14).toFixed(3));
        word.style.setProperty('--text-brightness', (1 + intensity * .22).toFixed(3));
        word.style.setProperty('--text-glow', intensity.toFixed(3));
      });
    };

    copy.classList.add('has-text-spotlight');
    copy.addEventListener('pointerenter', event => {
      copy.classList.add('is-text-lit');
      pointerX = event.clientX;
      pointerY = event.clientY;
      frame = requestAnimationFrame(paint);
    });
    copy.addEventListener('pointermove', event => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    }, { passive: true });
    copy.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      copy.classList.remove('is-text-lit');
      words.forEach(word => {
        word.style.removeProperty('--text-zoom');
        word.style.removeProperty('--text-brightness');
        word.style.removeProperty('--text-glow');
      });
    });
  });
})();