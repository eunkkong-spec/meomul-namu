// Mobile / tablet menu: the ☰ button opens the main menu as a drop-down panel
const navHeader = document.querySelector('.site-header');
const navToggle = navHeader.querySelector('.menu-toggle');

function setMenu(open) {
  navHeader.classList.toggle('is-menu-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
}

navToggle.addEventListener('click', () => setMenu(!navHeader.classList.contains('is-menu-open')));
// close after choosing a link, on Esc, or when the screen grows back to desktop size
navHeader.querySelectorAll('.gnb a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
