'use strict';

/* ============================================================
   Ibrahim Ahmed Shaikh — Portfolio
   Scroll-driven truck animation, reveals, counters
   ============================================================ */

const VIEWBOX_WIDTH = 200;
const VIEWBOX_HEIGHT = 2000;
const TRUCK_ANCHOR_RATIO = 0.45; // point in the viewport the truck tracks
const COUNTER_DURATION_MS = 1400;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- current year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- day / night toggle + swinging Pavitr ---------- */
const DAY_THEME = 'pavitr';
const SWING_DURATION_MS = 2100;

const themeToggle = document.getElementById('themeToggle');
const spideySwing = document.getElementById('spideySwing');
const spideyPendulum = document.getElementById('spideyPendulum');
const hireButton = document.querySelector('.nav__cta');

let swingTravel = null;
let swingSway = null;

function stopSwing() {
  if (swingTravel) {
    swingTravel.cancel();
    swingTravel = null;
  }
  if (swingSway) {
    swingSway.cancel();
    swingSway = null;
  }
  spideySwing.classList.remove('is-active');
  document.documentElement.classList.remove('spidey-flying');
}

function playSwing() {
  stopSwing();
  document.documentElement.classList.add('spidey-flying');
  spideySwing.classList.add('is-active');

  // rope occupies the top ~82% of the actor; the figure hangs at the bottom.
  // The rope's top edge stays pinned just above the viewport while swinging,
  // so the web always reads as attached to something overhead.
  const actorRect = spideySwing.getBoundingClientRect();
  const actorWidth = actorRect.width;
  const actorHeight = actorRect.height;
  const ropeTopY = -12;

  // land on the Hire Me button if it's visible, otherwise fly across and exit.
  // Landing pulls the whole actor up (rope off-screen) so the figure rises
  // to the button — like he's climbing the web as he arrives.
  const rect = hireButton.getBoundingClientRect();
  const canLand = rect.width > 0 && rect.top >= 0 && rect.top < window.innerHeight;
  const endX = canLand ? rect.right - 34 - actorWidth / 2 : window.innerWidth + 150;
  const endY = canLand ? rect.top - actorHeight * 0.83 : ropeTopY;

  const midX = (fraction) => window.innerWidth * fraction;

  const travelFrames = [
    { transform: `translate(${-actorWidth - window.innerWidth * 0.35}px, ${ropeTopY}px)`, offset: 0, easing: 'ease-in' },
    { transform: `translate(${midX(0.18)}px, ${ropeTopY}px)`, offset: 0.3, easing: 'ease-in-out' },
    { transform: `translate(${midX(0.42)}px, ${ropeTopY}px)`, offset: 0.55, easing: 'ease-in-out' },
    { transform: `translate(${midX(0.65)}px, ${ropeTopY}px)`, offset: 0.8, easing: 'ease-in-out' },
    { transform: `translate(${endX}px, ${endY}px)`, offset: 1 }
  ];
  const swayFrames = [
    { transform: 'rotate(-24deg)', offset: 0, easing: 'ease-in-out' },
    { transform: 'rotate(19deg)', offset: 0.3, easing: 'ease-in-out' },
    { transform: 'rotate(-17deg)', offset: 0.55, easing: 'ease-in-out' },
    { transform: 'rotate(13deg)', offset: 0.8, easing: 'ease-in-out' },
    { transform: 'rotate(0deg)', offset: 1 }
  ];

  swingTravel = spideySwing.animate(travelFrames, { duration: SWING_DURATION_MS });
  swingSway = spideyPendulum.animate(swayFrames, { duration: SWING_DURATION_MS });
  swingTravel.onfinish = stopSwing;
}

function applyTheme(isDay, withSwing) {
  if (isDay) {
    document.documentElement.setAttribute('data-theme', DAY_THEME);
    localStorage.setItem('theme', DAY_THEME);
    if (withSwing && !prefersReducedMotion) {
      playSwing();
    }
  } else {
    stopSwing();
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'midnight');
  }
  themeToggle.setAttribute('aria-pressed', String(isDay));
}

themeToggle.addEventListener('click', () => {
  applyTheme(!document.documentElement.hasAttribute('data-theme'), true);
});

// day is the default theme; entering in day mode plays the swing on load
applyTheme(document.documentElement.getAttribute('data-theme') === DAY_THEME, true);

/* ---------- nav: scrolled state + mobile menu ---------- */
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function updateNavState() {
  nav.classList.toggle('nav--scrolled', window.scrollY > 30);
}

function toggleMenu(forceClose) {
  const shouldOpen = forceClose ? false : !navLinks.classList.contains('is-open');
  navLinks.classList.toggle('is-open', shouldOpen);
  nav.classList.toggle('nav--menu-open', shouldOpen);
  navToggle.setAttribute('aria-expanded', String(shouldOpen));
}

navToggle.addEventListener('click', () => toggleMenu());
navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => toggleMenu(true));
});

/* ---------- "araam se" easter egg: nav spam detector ----------
   5 rapid clicks = one burst; the toast only appears on the 5th burst
   of the visit, so it stays a real easter egg. Once found, every
   further burst triggers it again. */
const NAV_SPAM_THRESHOLD = 5;
const NAV_SPAM_BURSTS_REQUIRED = 5;
const NAV_SPAM_WINDOW_MS = 1500;
const MEME_TOAST_DURATION_MS = 3200;

let navSpamCount = 0;
let navSpamBursts = 0;
let lastNavClickAt = 0;

function showMemeToast() {
  if (document.querySelector('.meme-toast')) {
    return;
  }
  const toast = document.createElement('div');
  toast.className = 'meme-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML =
    '<span class="meme-toast__urdu">ایجاز شہاب، آرام سے</span>' +
    '<span class="meme-toast__roman">Eijaz Shahab&hellip; araam se</span>';
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('meme-toast--leaving'), MEME_TOAST_DURATION_MS - 400);
  setTimeout(() => toast.remove(), MEME_TOAST_DURATION_MS);
}

function countNavSpam() {
  const now = performance.now();
  navSpamCount = now - lastNavClickAt < NAV_SPAM_WINDOW_MS ? navSpamCount + 1 : 1;
  lastNavClickAt = now;
  if (navSpamCount >= NAV_SPAM_THRESHOLD) {
    navSpamCount = 0;
    navSpamBursts += 1;
    if (navSpamBursts >= NAV_SPAM_BURSTS_REQUIRED) {
      navSpamBursts = NAV_SPAM_BURSTS_REQUIRED - 1;
      showMemeToast();
    }
  }
}

document.querySelectorAll('.nav__links a:not(.nav__cta)').forEach((link) => {
  link.addEventListener('click', countNavSpam);
});

/* ---------- scroll progress bar ---------- */
const progressBar = document.getElementById('progressBar');

function updateProgressBar() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  progressBar.style.transform = `scaleX(${progress})`;
}

/* ---------- reveal on scroll ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ---------- animated stat counters ---------- */
function animateCounter(el) {
  const target = Number(el.dataset.count);
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / COUNTER_DURATION_MS, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased);
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  if (prefersReducedMotion) {
    el.textContent = target;
    return;
  }
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

document.querySelectorAll('.stat__num').forEach((el) => counterObserver.observe(el));

/* ---------- truck along the road ---------- */
const roadWrap = document.getElementById('roadWrap');
const roadSvg = document.getElementById('roadSvg');
const roadPath = document.getElementById('roadBase');
const roadDriven = document.getElementById('roadDriven');
const truck = document.getElementById('truck');

const pathLength = roadPath.getTotalLength();
roadDriven.style.strokeDasharray = String(pathLength);
roadDriven.style.strokeDashoffset = String(pathLength);

function getJourneyProgress() {
  const rect = roadWrap.getBoundingClientRect();
  const anchorY = window.innerHeight * TRUCK_ANCHOR_RATIO;
  const progress = (anchorY - rect.top) / rect.height;
  return Math.min(Math.max(progress, 0), 1);
}

function viewBoxToWrap(point, svgRect, wrapRect) {
  return {
    x: svgRect.left - wrapRect.left + (point.x / VIEWBOX_WIDTH) * svgRect.width,
    y: svgRect.top - wrapRect.top + (point.y / VIEWBOX_HEIGHT) * svgRect.height
  };
}

function updateTruck() {
  const progress = getJourneyProgress();
  const distance = progress * pathLength;

  // draw the "driven" chamak patti trail behind the truck
  roadDriven.style.strokeDashoffset = String(pathLength - distance);

  const svgRect = roadSvg.getBoundingClientRect();
  const wrapRect = roadWrap.getBoundingClientRect();

  const point = roadPath.getPointAtLength(distance);
  const lookAhead = roadPath.getPointAtLength(Math.min(distance + 8, pathLength));

  const pos = viewBoxToWrap(point, svgRect, wrapRect);
  const ahead = viewBoxToWrap(lookAhead, svgRect, wrapRect);

  // truck SVG faces right, so the tangent angle is the rotation
  const angle = Math.atan2(ahead.y - pos.y, ahead.x - pos.x) * (180 / Math.PI);

  truck.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${angle}deg)`;
}

/* ---------- draggable truck: drag to drive the journey ----------
   Dragging scrubs the page scroll to match the truck's position on
   the road, so the truck stays on the path and the timeline follows. */
const TRUCK_DRAG_SPEED = 0.7; // scroll px per dragged px — keeps the drive leisurely

let isDraggingTruck = false;
let truckDragStartScrollY = 0;
let truckDragStartPointerY = 0;

truck.addEventListener('pointerdown', (event) => {
  isDraggingTruck = true;
  // anchor the drag to its starting point so movement never compounds
  truckDragStartScrollY = window.scrollY;
  truckDragStartPointerY = event.clientY;
  truck.setPointerCapture(event.pointerId);
  document.body.classList.add('is-dragging-truck');
  event.preventDefault();
});

truck.addEventListener('pointermove', (event) => {
  if (isDraggingTruck) {
    const dragDelta = event.clientY - truckDragStartPointerY;
    window.scrollTo({ top: truckDragStartScrollY + dragDelta * TRUCK_DRAG_SPEED, behavior: 'instant' });
  }
});

['pointerup', 'pointercancel'].forEach((type) => {
  truck.addEventListener(type, () => {
    isDraggingTruck = false;
    document.body.classList.remove('is-dragging-truck');
  });
});

/* ---------- scroll handling (rAF throttled) ---------- */
let isTickScheduled = false;

function onScrollOrResize() {
  if (isTickScheduled) {
    return;
  }
  isTickScheduled = true;
  requestAnimationFrame(() => {
    updateNavState();
    updateProgressBar();
    updateTruck();
    isTickScheduled = false;
  });
}

window.addEventListener('scroll', onScrollOrResize, { passive: true });
window.addEventListener('resize', onScrollOrResize);
window.addEventListener('load', onScrollOrResize);

onScrollOrResize();
