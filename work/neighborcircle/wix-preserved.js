// Local navigation replaces Wix's remote runtime; the original layout is unchanged.
const banner = document.querySelector('#WIX_ADS');
if (banner) {
  banner.replaceChildren();
  const back = document.createElement('a');
  back.id = 'wix-portfolio-return'; back.href = '../../#work'; back.textContent = '← Back to Charlene’s portfolio';
  banner.append(back);
}
document.querySelectorAll('a[data-anchor-comp-id]').forEach(link => {
  const target = document.getElementById(link.dataset.anchorCompId);
  if (target) link.href = '#' + target.id;
});
// Keep the original two-photo workshop gallery functional without Wix scripts.
const gallery = document.querySelector('#comp-js96izja');
if (gallery) {
  const images = [...gallery.querySelectorAll('img')];
  const sources = images.map(image => image.getAttribute('src'));
  gallery.querySelectorAll('source').forEach(source => source.remove());
  let current = 0;
  gallery.querySelector('[data-hook="nav-arrow-next"]')?.addEventListener('click', () => {
    current = (current + 1) % sources.length;
    images[0].src = sources[current];
    images[0].alt = current ? 'Co-design workshop participants and their design ideas' : 'Co-design workshop in progress';
  });
}
