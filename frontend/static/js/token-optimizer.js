(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Animation states are opt-in: content never starts hidden if JavaScript fails.
  if (!reduced) document.body.classList.add('lp-motion-ready');

  const progress = $('#lpProgress');
  let scrollRAF = 0;
  addEventListener('scroll', () => { if (!scrollRAF) scrollRAF = requestAnimationFrame(() => { const max = document.documentElement.scrollHeight - innerHeight; progress.style.width = `${max ? scrollY / max * 100 : 0}%`; scrollRAF = 0; }); }, { passive: true });

  const hero = $('#lpHero'), spotlight = $('#lpSpotlight');
  if (hero && spotlight && !reduced && matchMedia('(hover:hover)').matches) {
    let raf = 0, x = 50, y = 30, tx = x, ty = y;
    hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width * 100; ty = (e.clientY - r.top) / r.height * 100; if (!raf) { const paint = () => { x += (tx - x) * .12; y += (ty - y) * .12; spotlight.style.setProperty('--sx', `${x}%`); spotlight.style.setProperty('--sy', `${y}%`); if (Math.abs(x-tx)+Math.abs(y-ty) > .1) raf = requestAnimationFrame(paint); else raf = 0; }; raf = requestAnimationFrame(paint); } }, { passive:true });
  }

  const links = $$('.lp-index a');
  const sectionIO = new IntersectionObserver(entries => entries.forEach(entry => { if (!entry.isIntersecting) return; entry.target.classList.add('in-view'); links.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`)); }), { threshold:.32 });
  $$('.lp-feature').forEach(section => sectionIO.observe(section));
  links.forEach(link => link.addEventListener('click', event => { event.preventDefault(); $(link.hash)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block:'start' }); }));

  // The hero enters as one short, readable sequence; no interaction is delayed.
  const heroReady = () => hero?.classList.add('is-ready');
  if (reduced) heroReady(); else requestAnimationFrame(() => requestAnimationFrame(heroReady));

  const closing = $('#lpClosing');
  if (closing) new IntersectionObserver(entries => entries.forEach(({ isIntersecting, target }) => {
    if (isIntersecting) target.classList.add('in-view');
  }), { threshold: .35 }).observe(closing);

  if (!reduced && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('.lp-frame').forEach(frame => {
      let raf = 0, px = 0, py = 0;
      const paint = () => { raf = 0; const r = frame.getBoundingClientRect(), x = (px-r.left)/r.width, y = (py-r.top)/r.height; frame.style.setProperty('--rx', `${(0.5-y)*7}deg`); frame.style.setProperty('--ry', `${(x-.5)*9}deg`); frame.style.setProperty('--gx', `${x*100}%`); frame.style.setProperty('--gy', `${y*100}%`); };
      frame.addEventListener('pointerenter', () => { frame.classList.add('is-tilting'); frame.style.setProperty('--shine','1'); });
      frame.addEventListener('pointermove', e => { px=e.clientX; py=e.clientY; if (!raf) raf=requestAnimationFrame(paint); }, { passive:true });
      frame.addEventListener('pointerleave', () => { if (raf) cancelAnimationFrame(raf); raf=0; frame.classList.remove('is-tilting'); ['--rx','--ry','--gx','--gy','--shine'].forEach(name => frame.style.removeProperty(name)); });
    });
  }

  const numberIO = new IntersectionObserver(entries => entries.forEach(({isIntersecting,target}) => { if (!isIntersecting) return; numberIO.unobserve(target); const end=Number(target.dataset.target), decimals=Number(target.dataset.decimals || 0), prefix=target.dataset.prefix || '', suffix=target.dataset.suffix || ''; if (reduced) { target.textContent = prefix + end.toLocaleString(undefined,{minimumFractionDigits:decimals,maximumFractionDigits:decimals}) + suffix; return; } const start=performance.now(), duration=1100; const tick = now => { const p=Math.min((now-start)/duration,1), eased=1-(1-p)**3; target.textContent=prefix+(end*eased).toLocaleString(undefined,{minimumFractionDigits:decimals,maximumFractionDigits:decimals})+suffix; if(p<1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }), {threshold:.55});
  $$('.lp-count').forEach(node => numberIO.observe(node));

  const typed = $('#lpTyped'), meter = $('#lpMeter'), chars = $('#lpChars');
  if (typed && meter && chars) { const before = 'I am writing to you today because I would really like it if you could please help me…'; const after = 'Role: Expert blog writer. Task: Write a detailed post about remote work and productivity.'; let timer = 0; const play = () => { typed.textContent=before; typed.style.opacity='1'; chars.textContent='3,233'; meter.style.width='0%'; requestAnimationFrame(()=>meter.style.width='100%'); setTimeout(()=>{typed.style.opacity='0'; setTimeout(()=>{typed.textContent=after;typed.style.opacity='1';chars.textContent='1,670';},220)},1250); }; if(reduced){typed.textContent=after;chars.textContent='1,670';meter.style.width='100%'}else{play();timer=setInterval(play,5600); document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInterval(timer);timer=0}else if(!timer){play();timer=setInterval(play,5600)}})} }
})();
/* Load after token-optimizer.js. No markup changes are needed. */
