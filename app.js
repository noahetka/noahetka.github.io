// Friday Night MTB: simple static data-driven carousel
// All client-side; no accounts needed.

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
  const d = Math.max(0, Math.floor(ms / MS.day));
  const h = Math.max(0, Math.floor((ms % MS.day) / MS.hour));
  const m = Math.max(0, Math.floor((ms % MS.hour) / MS.minute));
  const s = Math.max(0, Math.floor((ms % MS.minute) / 1000));
  return { d, h, m, s };
}

function countdownLabel(ms) {
  const { d, h, m, s } = remaining(ms);
  const parts = [];
  if (d) parts.push(`${d}d`);
  parts.push(`${pad(h)}h:${pad(m)}m:${pad(s)}s`);
  return parts.join(' ');
}

function progressPercent(now, start, end) {
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function buildCard(event) {
  const startsAt = new Date(event.startsAt).getTime();
  const endsAt = new Date(event.endsAt || event.startsAt).getTime(); // same-day if not set
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

  const gallery = document.createElement('div');
  gallery.className = 'gallery';
  if (event.gallery && event.gallery.length) {
    gallery.style.backgroundImage = `url(${event.gallery[0]})`;
  }
  body.appendChild(gallery);

  const info = document.createElement('div');
  info.className = 'info';
  info.innerHTML = `
    <p class="meta"><span class="label">When</span><br><strong>${fmtDate(new Date(startsAt))}</strong></p>
    <p class="meta"><span class="label">Where</span><br><strong>${event.location}</strong></p>
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

  // Lock overlay if needed
  const lock = document.createElement('div');
  lock.className = 'lock-overlay';
  lock.innerHTML = `<div class="lock-label">Opens 48h before</div>`;
  if (st !== 'locked') lock.style.display = 'none';

  card.appendChild(head);
  card.appendChild(body);
  card.appendChild(foot);
  card.appendChild(lock);

  // Behavior: update countdown/progress/live gallery
  function tick() {
    const now = Date.now();
    const stNow = stateOf(now, startsAt, endsAt);
    const cd = card.querySelector('[data-role="countdown"]');
    const progressEl = progInner;

    // countdown target depends on state
    let label = '';
    if (stNow === 'locked') {
      const untilUnlock = (startsAt - UNLOCK_LEAD_MS) - now;
      label = `Unlocks in ${countdownLabel(untilUnlock)}`;
      lock.style.display = '';
    } else if (stNow === 'upcoming') {
      const untilStart = startsAt - now;
      label = `Starts in ${countdownLabel(untilStart)}`;
      lock.style.display = 'none';
    } else if (stNow === 'live') {
      const untilEnd = endsAt - now;
      label = `LIVE • ${countdownLabel(untilEnd)} left`;
      lock.style.display = 'none';
    } else {
      label = `Event finished`;
      lock.style.display = 'none';
    }
    cd.textContent = label;

    // badge + progress
    if (card.dataset.state !== stNow) {
      card.dataset.state = stNow;
      badge.className = `badge ${stNow}`;
      badge.textContent = stNow.toUpperCase();
    }
    progressEl.style.width = progressPercent(now, startsAt, endsAt) + '%';
  }

  // rotate gallery images every few seconds after event
  let gIdx = 0;
  if (event.gallery && event.gallery.length > 1) {
    setInterval(() => {
      if (Date.now() > endsAt) {
        gIdx = (gIdx + 1) % event.gallery.length;
        gallery.style.opacity = 0.08;
        setTimeout(() => {
          gallery.style.backgroundImage = `url(${event.gallery[gIdx]})`;
          gallery.style.opacity = 0.18;
        }, 300);
      }
    }, 4000);
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

async function main() {
  initNav();
  try {
    const res = await fetch('assets/data/events.json', { cache: 'no-store' });
    const data = await res.json();
    const events = (data.events || []).slice().sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    events.forEach(evt => CAROUSEL.appendChild(buildCard(evt)));
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
(function initEdgeHoverScroll() {
  const hasTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (hasTouch) return; // don't override touch devices

  let vx = 0; // px per frame
  const EDGE_FRAC = 0.12; // 12% of viewport width on each side
  const MAX_SPEED = 18;   // px per frame (~60fps)

  function onMove(e) {
    const w = window.innerWidth;
    const x = e.clientX;
    const edge = Math.floor(w * EDGE_FRAC);

    if (x < edge) {
      const t = (edge - x) / edge; // 0..1
      vx = -Math.round(t * MAX_SPEED);
    } else if (x > w - edge) {
      const t = (x - (w - edge)) / edge; // 0..1
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

  function loop() {
    if (rafId == null && vx !== 0) rafId = requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', (e) => { onMove(e); loop(); }, { passive: true });
  window.addEventListener('mouseleave', () => { vx = 0; }, { passive: true });
})();

