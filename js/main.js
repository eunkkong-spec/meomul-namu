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

// Scroll scrubbing: the video always plays on its own. Scrolling down through the pinned hero
// fast-forwards it by the amount scrolled (it really plays, up to 8×), scrolling up rewinds it;
// when scrolling stops it carries on playing from there.
let baseRate = 2;        // default speed; the speed button changes it
heroVideo.defaultPlaybackRate = baseRate;
heroVideo.playbackRate = baseRate;
let userPaused = false;  // set by the play/pause button
let scrubTarget = null;
let lastProgress = 0;

function scrollProgress() {
  const r = heroTrack.getBoundingClientRect();
  const span = r.height - window.innerHeight;
  return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
}

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

window.addEventListener('scroll', () => {
  const p = scrollProgress();
  const d = heroVideo.duration || 0;
  const delta = (p - lastProgress) * d; // the whole hero track = the whole video
  lastProgress = p;
  if (!d || Math.abs(delta) < 0.01) return;
  const from = scrubTarget ?? heroVideo.currentTime;
  scrubTarget = Math.min(d - 0.1, Math.max(0, from + delta));
}, { passive: true });

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
