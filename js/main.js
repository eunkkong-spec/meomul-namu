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
const hero = document.querySelector('.hero');

function updateHeader() {
  header.classList.toggle('is-over-hero', window.scrollY < hero.offsetHeight - header.offsetHeight);
}
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', updateHeader);
updateHeader();

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

vbPlay.addEventListener('click', () => (heroVideo.paused ? heroVideo.play() : heroVideo.pause()));
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
