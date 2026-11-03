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
