const bgClasses = ['bg-1', 'bg-2', 'bg-3', 'bg-4', 'bg-5', 'bg-6'];

function pickBg(el) {
  document.querySelectorAll('.bg-sample').forEach(s => s.classList.remove('picked'));
  el.classList.add('picked');
  const preview = document.getElementById('bg-preview');
  bgClasses.forEach(c => preview.classList.remove(c));
  const match = [...el.classList].find(c => bgClasses.includes(c));
  if (match) {
    preview.classList.add(match);
    preview.style.background = '';
  } else {
    preview.style.background = el.style.background;
  }
}

function go(idx) {
  document.querySelectorAll('.panel').forEach((p, i) => p.classList.toggle('active', i === idx));
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === idx));
}
