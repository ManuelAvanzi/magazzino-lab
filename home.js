const scenes = {
  stoccaggio: ['assets/homepage/lab-stoccaggio.jpg', 'Rendering del laboratorio: scaffalature portapallet, corsia mezzi e carrelli elevatori'],
  ricevimento: ['assets/homepage/lab-ricevimento.jpg', 'Rendering del laboratorio: baie di ricevimento e carrello elevatore'],
  imballaggio: ['assets/homepage/lab-imballaggio.jpg', 'Rendering del laboratorio: banchi imballaggio e scaffalature']
};
const hero = document.querySelector('#hero-image');
const heroSection = document.querySelector('.hero');
const sceneLayer = document.querySelector('.hero-scenes');
const sceneButtons = [...document.querySelectorAll('[data-scene]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const desktopMotion = matchMedia('(min-width: 761px)');
const pauseButton = document.createElement('button');
pauseButton.id = 'home-motion-toggle';
document.querySelector('.scene-selector').append(pauseButton);
let activeScene = 0, paused = reducedMotion.matches, heroVisible = true, slideTimer, scrollFrame;
const layers = Object.entries(scenes).map(([name, [src, alt]], index) => {
  const image = index === 0 ? hero : new Image();
  image.src = src; image.alt = alt; image.classList.add('hero-still');
  image.classList.toggle('active', index === 0);
  image.setAttribute('aria-hidden', String(index !== 0));
  if (index) sceneLayer.append(image);
  const film = document.createElement('video');
  film.className = 'hero-film'; film.muted = true; film.playsInline = true;
  film.preload = 'none'; film.setAttribute('aria-hidden', 'true');
  film.addEventListener('playing', () => film.classList.add('ready'));
  film.addEventListener('error', () => film.classList.remove('ready'));
  film.addEventListener('ended', () => {
    if (activeScene === index && !paused && heroVisible && !document.hidden) showScene((index + 1) % layers.length);
  });
  sceneLayer.append(film);
  return {image, film, name};
});
function scheduleMotion() {
  clearTimeout(slideTimer);
  const running = !paused && heroVisible && !document.hidden;
  heroSection.classList.toggle('motion-stopped', !running);
  layers.forEach(({film, name}, i) => {
    film.classList.toggle('active', i === activeScene && desktopMotion.matches && !reducedMotion.matches);
    if (running && i === activeScene && desktopMotion.matches && !reducedMotion.matches) {
      if (!film.hasAttribute('src')) film.src = `assets/homepage/lab-${name}.webm`;
      film.play().catch(() => film.classList.remove('ready'));
    } else film.pause();
  });
  // Also advances if a browser cannot play the film; the still remains visible.
  if (running) slideTimer = setTimeout(() => showScene((activeScene + 1) % layers.length), 11000);
}
function showScene(index) {
  if (index !== activeScene) {
    const next = layers[index].film;
    next.classList.remove('ready');
    if (next.readyState) next.currentTime = 0;
  }
  activeScene = index;
  layers.forEach(({image}, i) => {
    image.classList.toggle('active', i === index);
    image.setAttribute('aria-hidden', String(i !== index));
    sceneButtons[i].setAttribute('aria-pressed', String(i === index));
  });
  scheduleMotion();
}
function syncPause() {
  pauseButton.textContent = paused ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-label', paused ? 'Riprendi le animazioni' : 'Metti in pausa le animazioni');
  pauseButton.setAttribute('aria-pressed', String(paused));
  scheduleMotion();
}
sceneButtons.forEach((button, index) => button.addEventListener('click', () => showScene(index)));
pauseButton.addEventListener('click', () => { paused = !paused; syncPause(); });
reducedMotion.addEventListener('change', () => {
  paused = reducedMotion.matches;
  heroSection.style.setProperty('--parallax', '0px');
  syncPause();
});
desktopMotion.addEventListener('change', scheduleMotion);
document.addEventListener('visibilitychange', scheduleMotion);
new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; scheduleMotion(); }).observe(heroSection);
window.addEventListener('scroll', () => {
  if (scrollFrame || paused || reducedMotion.matches || !heroVisible) return;
  scrollFrame = requestAnimationFrame(() => {
    heroSection.style.setProperty('--parallax', `${Math.min(scrollY * .10, 55)}px`);
    scrollFrame = null;
  });
}, {passive: true});
window.addEventListener('pagehide', () => {clearTimeout(slideTimer); cancelAnimationFrame(scrollFrame); scrollFrame = null; layers.forEach(({film}) => film.pause());});
window.addEventListener('pageshow', scheduleMotion);
syncPause();
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Apri menu'); nav.classList.remove('open'); }
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
  nav.classList.toggle('open', open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
try {
  const saved = JSON.parse(localStorage.getItem('magazzino-lab-v1'));
  if (saved?.version === 1 && Array.isArray(saved.objects)) document.querySelector('#resume').innerHTML = 'Riprendi il tuo progetto <span>→</span>';
} catch { /* Accesso al laboratorio disponibile anche senza salvataggi. */ }
