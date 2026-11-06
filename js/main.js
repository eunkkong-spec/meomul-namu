// Hero sound: background music up front, the video's own sound effects mixed in quietly.
// Browsers only allow sound after a click, so the page starts muted.
const MUSIC_VOLUME = 0.8;
const SFX_VOLUME = 0.2;

const soundBar = document.querySelector('.sound-bar');
const music = document.querySelector('.hero-audio');
const heroVideo = document.querySelector('.hero-media');

function setSound(on) {
  const label = on ? '소리 끄기' : '소리 켜기';
  soundBar.setAttribute('aria-pressed', String(on));
  soundBar.setAttribute('aria-label', label);
  soundBar.title = label;
}

soundBar.addEventListener('click', () => {
  if (music.paused) {
    music.volume = MUSIC_VOLUME;
    heroVideo.volume = SFX_VOLUME;
    heroVideo.muted = false;
    music.play().then(() => setSound(true)).catch(() => {
      heroVideo.muted = true;
      setSound(false);
    });
  } else {
    music.pause();
    heroVideo.muted = true;
    setSound(false);
  }
});

// Header: transparent while over the hero, solid after
const header = document.querySelector('.site-header');
const heroTrack = document.querySelector('.hero-track');

function updateHeader() {
  header.classList.toggle('is-over-hero', heroTrack.getBoundingClientRect().bottom > header.offsetHeight);
}
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', updateHeader);
updateHeader();

// Scene titles: the line above 머물나무 follows the story in the video
const SCENES = [
  { from: 0, text: '사랑이 머무는 곳' },            // planting → playing ball
  { from: 54, text: '아이와 함께 자라는' },          // reading under the tree → climbing it with a friend
  { from: 96, text: '꿈꾸는 소년의 쉼터' },          // the grown boy alone under the tree
  { from: 112, text: '쉼표가 필요 할 때, 머물고 싶은 곳' }, // couple and family
];
const tagline = document.querySelector('.hero-tagline span');
const heroTitle = document.querySelector('.hero-title span');

function flip(el) {
  el.classList.remove('is-flipping');
  void el.offsetWidth; // restart the animation
  el.classList.add('is-flipping');
}

let sceneIndex = 0;

function updateScene() {
  let i = 0;
  while (i + 1 < SCENES.length && heroVideo.currentTime >= SCENES[i + 1].from) i++;
  if (i === sceneIndex) return;
  sceneIndex = i;
  flip(tagline);
  setTimeout(() => flip(heroTitle), 800); // once the scene line has finished its turn, 머물나무 spins
  setTimeout(() => { tagline.textContent = SCENES[i].text; }, 400); // swap while edge-on
}
heroVideo.addEventListener('timeupdate', updateScene);
heroVideo.addEventListener('seeked', updateScene);

// Scroll-locked story: while the hero is at the top of the page and the video hasn't reached
// its end, scrolling doesn't move the page — it fast-forwards (or rewinds) the video instead.
// Once the video is at its end, the next scroll moves on down to the page.
let baseRate = 2;        // default speed; the speed button changes it
heroVideo.defaultPlaybackRate = baseRate;
heroVideo.playbackRate = baseRate;
let userPaused = false;  // set by the play/pause button
let scrubTarget = null;
const SECONDS_PER_PX = 0.03; // one mouse-wheel notch (~100px) ≈ 3 seconds of story

function resumeNormal() {
  scrubTarget = null;
  heroVideo.playbackRate = baseRate;
  if (userPaused) heroVideo.pause();
  else if (heroVideo.paused) heroVideo.play();
}

setInterval(() => {
  updateScene();
  if (scrubTarget === null || !heroVideo.duration || heroVideo.seeking) return;
  const diff = scrubTarget - heroVideo.currentTime;
  if (Math.abs(diff) < 0.3) {
    resumeNormal();
  } else if (diff > 6) {
    heroVideo.currentTime = scrubTarget - 2; // a big scroll jump: skip ahead, then fast-play the rest
  } else if (diff > 0) {
    heroVideo.playbackRate = Math.min(8, Math.max(2, diff * 2)); // further behind → faster
    if (heroVideo.paused) heroVideo.play();
  } else {
    heroVideo.currentTime = scrubTarget; // browsers can't play backwards, so jump back
    resumeNormal();
  }
}, 100);

const atTop = () => window.scrollY < 4;
const storyEnd = () => (heroVideo.duration || 0) - 0.8;

// true when this scroll gesture should drive the video instead of the page
function captureScroll(delta) {
  const d = heroVideo.duration;
  if (!d || !atTop()) return false;
  const now = scrubTarget ?? heroVideo.currentTime;
  if (delta > 0 && now >= storyEnd()) return false; // story finished → let the page scroll
  if (delta < 0 && now <= 0.1) return false;
  scrubTarget = Math.min(d - 0.1, Math.max(0, now + delta * SECONDS_PER_PX));
  return true;
}

window.addEventListener('wheel', (e) => {
  if (captureScroll(e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY)) e.preventDefault();
}, { passive: false });

let touchY = null;
window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
window.addEventListener('touchmove', (e) => {
  if (touchY === null) return;
  const y = e.touches[0].clientY;
  if (captureScroll((touchY - y) * 2)) e.preventDefault();
  touchY = y;
}, { passive: false });

window.addEventListener('keydown', (e) => {
  const keys = { ArrowDown: 100, PageDown: 400, ' ': 400, ArrowUp: -100, PageUp: -400 };
  if (!(e.key in keys) || e.target.closest('input, textarea, button, a')) return;
  if (captureScroll(keys[e.key])) e.preventDefault();
});

// Scroll button: each click jumps to the next scene; after the last one it scrolls down to the page
const scrollBtn = document.querySelector('.scroll-btn');
scrollBtn.addEventListener('click', () => {
  const next = SCENES.find((s) => s.from > heroVideo.currentTime + 0.5);
  if (next) {
    scrubTarget = null;
    heroVideo.currentTime = next.from + 0.5;
    resumeNormal();
  } else {
    const r = heroTrack.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.bottom - header.offsetHeight, behavior: 'smooth' });
  }
});

// Hero video controls: play/pause, scrub, speed
const vbPlay = document.querySelector('.vb-play');
const vbSeek = document.querySelector('.vb-seek');
const vbTime = document.querySelector('.vb-time');
const vbSpeed = document.querySelector('.vb-speed');
const SPEEDS = [1, 2, 4];
let seeking = false;

const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

function syncPlay() {
  const paused = heroVideo.paused;
  vbPlay.classList.toggle('is-paused', paused);
  vbPlay.setAttribute('aria-label', paused ? '영상 재생' : '영상 일시정지');
  vbPlay.title = paused ? '재생' : '일시정지';
}

function syncTime() {
  const d = heroVideo.duration || 0;
  if (!seeking && d) vbSeek.value = Math.round((heroVideo.currentTime / d) * 1000);
  vbSeek.style.setProperty('--p', `${vbSeek.value / 10}%`);
  vbTime.textContent = `${fmt(heroVideo.currentTime)} / ${fmt(d)}`;
}

vbPlay.addEventListener('click', () => {
  userPaused = !heroVideo.paused;
  if (userPaused) heroVideo.pause(); else heroVideo.play();
});
heroVideo.addEventListener('play', syncPlay);
heroVideo.addEventListener('pause', syncPlay);
heroVideo.addEventListener('timeupdate', syncTime);
heroVideo.addEventListener('loadedmetadata', syncTime);

vbSeek.addEventListener('input', () => {
  seeking = true;
  scrubTarget = null; // a manual jump overrides any scroll-driven target
  heroVideo.currentTime = (vbSeek.value / 1000) * (heroVideo.duration || 0);
  syncTime();
});
vbSeek.addEventListener('change', () => { seeking = false; });

vbSpeed.addEventListener('click', () => {
  const next = SPEEDS[(SPEEDS.indexOf(heroVideo.playbackRate) + 1) % SPEEDS.length];
  baseRate = next;
  heroVideo.playbackRate = next;
  vbSpeed.textContent = `${next}×`;
  vbSpeed.setAttribute('aria-label', `재생 속도 ${next}배`);
});

syncPlay();
syncTime();

// 04 New books: category tabs
const bookTabs = document.querySelectorAll('.book-tab');
const books = document.querySelectorAll('.book');
const emptyMsg = document.querySelector('.empty-msg');
const track = document.querySelector('.book-track');

bookTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    bookTabs.forEach((t) => t.classList.toggle('is-active', t === tab));
    let shown = 0;
    books.forEach((book) => {
      const match = book.dataset.cat === tab.dataset.cat;
      book.hidden = !match;
      if (match) shown++;
    });
    emptyMsg.hidden = shown > 0;
    track.scrollLeft = 0;
  });
});

// 04 New books: next arrow
document.querySelector('.shelf-next').addEventListener('click', () => {
  const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  track.scrollBy({ left: atEnd ? -track.scrollWidth : track.clientWidth / 2 });
});

// 05 Photo tiles: click to open the photo where it sits and grow it to fill the screen
const EASE = 'cubic-bezier(.2, .8, .2, 1)';

function openPhoto(tile) {
  const thumb = tile.querySelector('img');
  const start = thumb.getBoundingClientRect();
  const caption = tile.querySelector('.tile-caption')?.innerHTML || tile.querySelector('.tile-badge')?.textContent || '';

  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML = `<img src="${thumb.currentSrc || thumb.src}" alt="${thumb.alt}"><p class="lightbox-caption">${caption}</p>
    <button type="button" class="lightbox-close" aria-label="닫기">×</button>`;
  document.body.appendChild(box);
  const img = box.querySelector('img');

  // fit the full photo into the screen, keeping its shape
  const ratio = thumb.naturalWidth / thumb.naturalHeight || 1;
  let w = Math.min(window.innerWidth * 0.9, 1100);
  let h = w / ratio;
  const maxH = window.innerHeight * 0.78;
  if (h > maxH) { h = maxH; w = h * ratio; }
  const end = { left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 - 20, width: w, height: h };
  const from = { left: start.left, top: start.top, width: start.width, height: start.height };
  const px = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });

  Object.assign(img.style, px(end));
  img.animate([px(from), px(end)], { duration: 450, easing: EASE });
  box.animate([{ backgroundColor: 'rgba(30, 20, 14, 0)' }, { backgroundColor: 'rgba(30, 20, 14, .82)' }], { duration: 450, fill: 'forwards' });
  thumb.style.visibility = 'hidden';

  function close() {
    document.removeEventListener('keydown', onKey);
    const now = thumb.getBoundingClientRect();
    const back = { left: now.left, top: now.top, width: now.width, height: now.height };
    box.classList.add('is-closing');
    box.animate([{ backgroundColor: 'rgba(30, 20, 14, .82)' }, { backgroundColor: 'rgba(30, 20, 14, 0)' }], { duration: 350, fill: 'forwards' });
    img.animate([px(end), px(back)], { duration: 350, easing: EASE, fill: 'forwards' }).onfinish = () => {
      thumb.style.visibility = '';
      box.remove();
      tile.focus();
    };
  }
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  box.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  box.querySelector('.lightbox-close').focus();
}

document.querySelectorAll('.tile-photo').forEach((tile) => {
  tile.tabIndex = 0;
  tile.setAttribute('role', 'button');
  tile.setAttribute('aria-label', `${tile.querySelector('img').alt} 크게 보기`);
  tile.addEventListener('click', () => openPhoto(tile));
  tile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPhoto(tile); }
  });
});

// 04 New books: 예약대기 opens a reservation form in a modal
const reserveModal = document.querySelector('#reserve');
const reserveForm = reserveModal.querySelector('.reserve-form');
const reserveFormHTML = reserveForm.innerHTML;

function openReserve(book) {
  reserveForm.innerHTML = reserveFormHTML; // fresh form each time
  reserveForm.querySelector('.reserve-book').textContent = book;
  reserveForm.dataset.book = book;
  reserveModal.showModal();
}
document.querySelectorAll('[data-book]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openReserve(btn.dataset.book);
  });
});
reserveModal.querySelector('.modal-close').addEventListener('click', () => reserveModal.close());
reserveModal.addEventListener('click', (e) => { if (e.target === reserveModal) reserveModal.close(); });

reserveForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = reserveForm;
  const problems = [];
  if (!(Number(f.count.value) >= 1)) problems.push('권수');
  if (!f.name.value.trim()) problems.push('이름');
  if (!/^[0-9-]{9,13}$/.test(f.phone.value.trim())) problems.push('연락처');
  if (!f.agree.checked) problems.push('개인정보 수집 동의');
  const err = f.querySelector('.form-error');
  if (problems.length) {
    err.textContent = `다음 항목을 확인해 주세요: ${problems.join(', ')}`;
    err.hidden = false;
    return;
  }
  // no server yet — show the confirmation in place of the form
  f.innerHTML = `
    <div class="donate-done">
      <h3>예약대기가 접수되었어요</h3>
      <p><b>${f.dataset.book}</b> · ${f.count.value}권<br>
        책이 들어오면 <b>${f.phone.value.trim()}</b>로 바로 알려 드릴게요.</p>
      <button type="button" class="btn btn-green" onclick="this.closest('dialog').close()">닫기</button>
    </div>`;
});

// 03 Next week: 미리 읽고 참여하기 opens the book club sign-up in a modal
const joinModal = document.querySelector('#join');
const joinForm = joinModal.querySelector('.join-form');
const joinFormHTML = joinForm.innerHTML;

document.querySelector('a[href="#join"]').addEventListener('click', (e) => {
  e.preventDefault();
  joinForm.innerHTML = joinFormHTML; // fresh form each time
  joinModal.showModal();
});
joinModal.querySelector('.modal-close').addEventListener('click', () => joinModal.close());
joinModal.addEventListener('click', (e) => { if (e.target === joinModal) joinModal.close(); });

joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = joinForm;
  const problems = [];
  if (!(Number(f.people.value) >= 1)) problems.push('인원');
  if (!f.name.value.trim()) problems.push('이름');
  if (!/^[0-9-]{9,13}$/.test(f.phone.value.trim())) problems.push('연락처');
  if (!f.agree.checked) problems.push('개인정보 수집 동의');
  const err = f.querySelector('.form-error');
  if (problems.length) {
    err.textContent = `다음 항목을 확인해 주세요: ${problems.join(', ')}`;
    err.hidden = false;
    return;
  }
  // no server yet — show the confirmation in place of the form
  const prep = f.book.value;
  f.innerHTML = `
    <div class="donate-done">
      <h3>참여 신청이 접수되었어요</h3>
      <p><b>사춘기 아들과 우당탕탕 영국여행기</b> 독서토론 · ${f.people.value}명<br>
        11월 6일 금요일 오후 7시에 만나요. 모임 전날 <b>${f.phone.value.trim()}</b>로 안내 문자를 보내 드릴게요.</p>
      <p>${prep}</p>
      <button type="button" class="btn btn-green" onclick="this.closest('dialog').close()">닫기</button>
    </div>`;
});
