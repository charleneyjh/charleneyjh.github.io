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

// Cross-links stay within the migrated portfolio when a case study is available.
document.querySelectorAll('a').forEach(link => {
  if (link.href === 'https://charleneyjh.wixsite.com/website/neighborcircle-chi-2019') link.href = '../neighborcircle/';
  if (link.textContent.trim() === 'About') link.href = '../../#about';
});
const overviewLink = document.querySelector('a[data-anchor-comp-id="PAGE_TOP_ANCHOR"]');
if (overviewLink) overviewLink.href = '#SITE_HEADER';
