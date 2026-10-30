// Hero video sound toggle
const video = document.querySelector('.hero-story');
const soundBtn = document.querySelector('.sound-toggle');

soundBtn.addEventListener('click', () => {
  video.muted = !video.muted;
  if (!video.muted) video.play();
  soundBtn.setAttribute('aria-pressed', String(!video.muted));
  soundBtn.textContent = video.muted ? '소리 켜기' : '소리 끄기';
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

// 05 Under the tree: tile filters
const filters = document.querySelectorAll('.filter');
const tiles = document.querySelectorAll('.tile');

filters.forEach((btn) => {
  btn.addEventListener('click', () => {
    filters.forEach((f) => f.classList.toggle('is-active', f === btn));
    const type = btn.dataset.filter;
    tiles.forEach((tile) => {
      tile.hidden = type !== 'all' && tile.dataset.type !== type;
    });
  });
});
