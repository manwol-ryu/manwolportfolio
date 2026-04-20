const toggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const scrim = document.getElementById('sidebar-scrim');

function setOpen(open) {
  sidebar.classList.toggle('open', open);
  scrim.classList.toggle('show', open);
  toggle.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  document.body.style.overflow = open ? 'hidden' : '';
}

toggle.addEventListener('click', () => {
  setOpen(!sidebar.classList.contains('open'));
});

scrim.addEventListener('click', () => setOpen(false));

sidebar.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 820px)').matches) setOpen(false);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sidebar.classList.contains('open')) setOpen(false);
});

const navLinks = sidebar.querySelectorAll('.sidebar-item[href^="#"]');
const sections = [...navLinks]
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && sections.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => {
          a.classList.toggle('on', a.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach(s => observer.observe(s));
}
