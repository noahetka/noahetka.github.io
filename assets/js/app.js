// Friday Night MTB: minimalist, boxed, locked-until-48h carousel
const CAROUSEL = document.getElementById('carousel');
const HOT_LEFT = document.getElementById('hot-left');
const HOT_RIGHT = document.getElementById('hot-right');

const MS = {
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000
};

const UNLOCK_LEAD_MS = 48 * MS.hour; // unlock 48 hours before event

const stateOf = (now, startsAtMs, endsAtMs) => {
  if (now < startsAtMs - UNLOCK_LEAD_MS) return 'locked';
  if (now < startsAtMs) return 'upcoming';
  if (now >= startsAtMs && now <= endsAtMs) return 'live';
  return 'past';
};

const fmtDate = (d) =>
  d.toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit', timeZoneName:'short' });

const pad = (n) => String(n).padStart(2,'0');

function remaining(ms) {
  const d = Math.max(0, Math.floor(ms / 86400000));
  const h = Math.max(0, Math.floor((ms % 86400000) / 3600000));
  const m = Math.max(0, Math.floor((ms % 3600000) / 60000));
  const s = Math.max(0, Math.floor((ms % 60000) / 1000));
  return { d, h, m, s };
}

function countdownLabel(ms) {
  const { d, h, m, s } = remaining(ms);
  const parts = [];
  if (d) parts.push(`${d}d`);
  parts.push(`${pad(h)}h:${pad(m)}m:${pad(s)}s`);
  return parts.join(' ');
}

function unlockRemainingLabel(untilMs) {
  const { d, h, m, s } = remaining(untilMs);
  const parts = [];
  if (d) parts.push(`${d} days`);
  parts.push(`${pad(h)} hours`, `${pad(m)} minutes`, `${pad(s)} seconds`);
  return `Location unlocked in [${parts.join(', ')}]`;
}

function progressPercent(now, start, end) {
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function buildCard(event) {
  const startsAt = new Date(event.startsAt).getTime();
  const endsAt = new Date(event.endsAt || event.startsAt).getTime();
  const now = Date.now();
  const st = stateOf(now, startsAt, endsAt);

  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('tabindex', '0');
  card.dataset.startsAt = startsAt;
  card.dataset.endsAt = endsAt;
  card.dataset.state = st;

  // Head
  const head = document.createElement('div');
  head.className = 'card-head';
  const badge = document.createElement('span');
  badge.className = `badge ${st}`;
  badge.textContent = st.toUpperCase();
  const title = document.createElement('h2');
  title.className = 'title';
  title.textContent = event.title;
  head.appendChild(badge);
  head.appendChild(title);

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';

  const info = document.createElement('div');
  info.className = 'info';
  info.innerHTML = `
    <p class="meta"><span class="label">When</span><br><strong>${fmtDate(new Date(startsAt))}</strong></p>
    <p class="meta"><span class="label">Where</span><br><strong><span data-role="where"></span></strong></p>
    ${event.note ? `<p class="meta"><span class="label">Note</span><br>${event.note}</p>` : ''}
    <p class="countdown" data-role="countdown"></p>
  `;
  body.appendChild(info);

  // Foot
  const foot = document.createElement('div');
  foot.className = 'card-foot';
  const prog = document.createElement('div');
  prog.className = 'progress';
  const progInner = document.createElement('span');
  prog.appendChild(progInner);
  const idx = document.createElement('small');
  idx.textContent = event.id ? `#${event.id}` : '';
  foot.appendChild(prog);
  foot.appendChild(idx);

  // Lock overlay
  const lock = document.createElement('div');
  lock.className = 'lock-overlay';
  lock.innerHTML = `<div class="lock-label">Opens 48h before</div>`;

  card.appendChild(head);
  card.appendChild(body);
  card.appendChild(foot);
  card.appendChild(lock);

  // Behavior: update countdown/progress/badges and where label
  function tick() {
    const now = Date.now();
    const stNow = stateOf(now, startsAt, endsAt);
    const cd = card.querySelector('[data-role="countdown"]');
    const whereEl = card.querySelector('[data-role="where"]');
    const progressEl = progInner;

    if (stNow === 'locked') {
      const untilUnlock = (startsAt - UNLOCK_LEAD_MS) - now;
      cd.textContent = `Unlocks in ${countdownLabel(untilUnlock)}`;
      if (whereEl) whereEl.textContent = unlockRemainingLabel(untilUnlock);
      lock.style.display = 'grid';
    } else if (stNow === 'upcoming') {
      const untilStart = startsAt - now;
      cd.textContent = `Starts in ${countdownLabel(untilStart)}`;
      if (whereEl) whereEl.textContent = (event.location && event.location.trim()) ? event.location : 'TBA';
      lock.style.display = 'none';
    } else if (stNow === 'live') {
      const untilEnd = endsAt - now;
      cd.textContent = `LIVE • ${countdownLabel(untilEnd)} left`;
      if (whereEl) whereEl.textContent = (event.location && event.location.trim()) ? event.location : 'TBA';
      lock.style.display = 'none';
    } else {
      cd.textContent = `Event finished`;
      if (whereEl) whereEl.textContent = (event.location && event.location.trim()) ? event.location : 'TBA';
      lock.style.display = 'none';
    }

    if (card.dataset.state !== stNow) {
      card.dataset.state = stNow;
      badge.className = `badge ${stNow}`;
      badge.textContent = stNow.toUpperCase();
    }
    progressEl.style.width = progressPercent(now, startsAt, endsAt) + '%';
  }

  tick();
  setInterval(tick, 1000);
  return card;
}

function scrollByOne(dir = 1) {
  const cardWidth = CAROUSEL.querySelector('.card')?.getBoundingClientRect().width || 400;
  CAROUSEL.scrollBy({ left: dir * (cardWidth + 20), behavior: 'smooth' });
}

function initNav() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') scrollByOne(1);
    if (e.key === 'ArrowLeft') scrollByOne(-1);
  });
  HOT_LEFT.addEventListener('click', () => scrollByOne(-1));
  HOT_RIGHT.addEventListener('click', () => scrollByOne(1));
}

// Center a given card in the viewport
function centerCardInView(card) {
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const listRect = CAROUSEL.getBoundingClientRect();
  const currentCenter = CAROUSEL.scrollLeft + listRect.width / 2;
  const cardCenter = card.offsetLeft + rect.width / 2;
  const delta = cardCenter - currentCenter;
  CAROUSEL.scrollBy({ left: delta, behavior: 'auto' });
}


function pickBestCard(cards, now = Date.now()) {
  const live = cards.find(c => c.dataset.state === 'live');
  if (live) return live;
  const upcoming = cards.find(c => c.dataset.state === 'upcoming');
  if (upcoming) return upcoming;

  // Otherwise, choose the nearest future locked; else the nearest past
  let nearestFuture = null, futureDist = Infinity;
  let nearestPast = null, pastDist = Infinity;
  cards.forEach(c => {
    const s = parseInt(c.dataset.startsAt, 10);
    if (s >= now) {
      const d = s - now;
      if (d < futureDist) { futureDist = d; nearestFuture = c; }
    } else {
      const d = now - s;
      if (d < pastDist) { pastDist = d; nearestPast = c; }
    }
  });
  return nearestFuture || nearestPast || cards[0];
}

async function main() {
  initNav();
  try {
    const res = await fetch('assets/data/events.json', { cache: 'no-store' });
    const data = await res.json();
    const events = (data.events || []).slice().sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

    const cards = [];
    events.forEach(evt => { const c = buildCard(evt); CAROUSEL.appendChild(c); cards.push(c); });

    // Choose starting card: live > upcoming > closest by start time
    const startCard = pickBestCard(cards, Date.now());
    requestAnimationFrame(() => centerCardInView(startCard));

  } catch (err) {
    const errEl = document.createElement('p');
    errEl.style.color = 'salmon';
    errEl.textContent = 'Failed to load events. Check assets/data/events.json';
    CAROUSEL.appendChild(errEl);
    console.error(err);
  }
}

main();

// --- Edge-hover auto-scroll ---

// --- Edge-hover auto-scroll (robust for hybrid devices) ---
(function initEdgeHoverScroll() {
  // Enable if any fine pointer (mouse/trackpad) is present
  const anyFine = matchMedia('(any-pointer: fine)').matches;
  if (!anyFine) return;

  let vx = 0; // px/frame
  const EDGE_FRAC = 0.12; // 12% of viewport width
  const MAX_SPEED = 18;

  function onMove(e) {
    // Only respond to mouse pointers
    if (e.pointerType && e.pointerType !== 'mouse') { vx = 0; return; }

    const listRect = CAROUSEL.getBoundingClientRect();
    const inY = e.clientY >= listRect.top && e.clientY <= listRect.bottom;
    const w = window.innerWidth;
    const x = e.clientX;
    const edge = Math.floor(w * EDGE_FRAC);

    if (inY && x < edge) {
      const t = (edge - x) / edge;
      vx = -Math.round(t * MAX_SPEED);
    } else if (inY && x > w - edge) {
      const t = (x - (w - edge)) / edge;
      vx = Math.round(t * MAX_SPEED);
    } else {
      vx = 0;
    }
  }

  let rafId = null;
  function tick() {
    if (vx !== 0) {
      CAROUSEL.scrollLeft += vx;
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }
  function loop() { if (rafId == null && vx !== 0) rafId = requestAnimationFrame(tick); }

  // Use pointer events when available, fallback to mousemove
  if (window.PointerEvent) {
    window.addEventListener('pointermove', (e) => { onMove(e); loop(); }, { passive: true });
    window.addEventListener('pointerleave', () => { vx = 0; }, { passive: true });
  } else {
    window.addEventListener('mousemove', (e) => { onMove(e); loop(); }, { passive: true });
    window.addEventListener('mouseleave', () => { vx = 0; }, { passive: true });
  }
})();
// --- Auto-focus the next relevant block (without hijacking user) ---
(function initAutoFocusNext() {
  const cards = () => Array.from(CAROUSEL.querySelectorAll('.card'));
  let lastUserAction = Date.now();
  let lastCenteredId = null;

  function markUser() { lastUserAction = Date.now(); }
  CAROUSEL.addEventListener('scroll', markUser, { passive: true });
  document.addEventListener('keydown', markUser, { passive: true });
  document.addEventListener('pointerdown', markUser, { passive: true });

  function currentCenteredCardId() {
    const rect = CAROUSEL.getBoundingClientRect();
    const center = CAROUSEL.scrollLeft + rect.width / 2;
    let best = null, bestDist = Infinity;
    cards().forEach(c => {
      const cr = c.getBoundingClientRect();
      const cc = c.offsetLeft + cr.width / 2;
      const d = Math.abs(cc - center);
      if (d < bestDist) { bestDist = d; best = c; }
    });
    return best?.dataset.startsAt || null;
  }

  function tick() {
    const now = Date.now();
    // Only refocus if user has been idle for a bit
    const idleMs = now - lastUserAction;
    if (idleMs > 15000) { // 15s idle threshold
      const best = pickBestCard(cards(), now);
      const bestId = best?.dataset.startsAt || null;
      const curId = currentCenteredCardId();
      if (best && bestId && bestId !== curId && bestId !== lastCenteredId) {
        centerCardInView(best);
        lastCenteredId = bestId;
      }
    }
  }

  setInterval(tick, 30000); // check every 30s
})();
