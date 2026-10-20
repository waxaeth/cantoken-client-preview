const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu() { nav.classList.remove('is-open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open menu'); }
menuToggle.addEventListener('click', () => { const open = menuToggle.getAttribute('aria-expanded') !== 'true'; menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); nav.classList.toggle('is-open', open); });
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
function selectAudience(audience, focus = false) {
  document.querySelector('.audience-section')?.classList.toggle('audience-investor', audience === 'investor');
  document.querySelectorAll('[data-tab]').forEach(tab => { const selected = tab.dataset.tab === audience; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; document.getElementById(`${tab.dataset.tab}-panel`).hidden = !selected; if (selected && focus) tab.focus(); });
}
document.querySelectorAll('[data-tab]').forEach(tab => {
  tab.addEventListener('click', () => selectAudience(tab.dataset.tab));
  tab.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); selectAudience(e.key === 'Home' ? 'issuer' : e.key === 'End' ? 'investor' : tab.dataset.tab === 'issuer' ? 'investor' : 'issuer', true); } });
});
document.querySelectorAll('[data-audience]').forEach(a => a.addEventListener('click', () => selectAudience(a.dataset.audience)));
function syncHash() { if (location.hash === '#investors') selectAudience('investor'); else if (location.hash === '#issuers') selectAudience('issuer'); }
window.addEventListener('hashchange', syncHash); syncHash();
document.querySelectorAll('[data-interest]').forEach(a => a.addEventListener('click', () => { document.querySelector('[name="interest"]').value = a.dataset.interest; }));
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => {
  const dialog = document.getElementById(button.dataset.dialog);
  closeMenu();
  if (dialog.id === 'terms-dialog') window.resetTermsDialog();
  if (dialog.id === 'video-dialog') { const frame = document.createElement('iframe'); frame.src = 'https://www.youtube-nocookie.com/embed/LpBKxHL6UkY?rel=0'; frame.title = 'Qualifying Investors Presentation'; frame.allow = 'encrypted-media; picture-in-picture; fullscreen'; frame.allowFullscreen = true; document.getElementById('video-player').replaceChildren(frame); }
  dialog.showModal(); document.body.classList.add('dialog-open');
}));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-close-dialog]').forEach(a => a.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', e => { if (e.target === dialog) { const box = dialog.getBoundingClientRect(); if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); if (dialog.id === 'video-dialog') document.getElementById('video-player').replaceChildren(); });
});
const termsDialog = document.getElementById('terms-dialog');
if (termsDialog) {
  const text = termsDialog.querySelector('.terms-scroll');
  const acknowledgement = termsDialog.querySelector('#terms-acknowledge');
  const continueButton = termsDialog.querySelector('#terms-continue');
  const progress = termsDialog.querySelector('#terms-progress');
  window.resetTermsDialog = function () {
    text.scrollTop = 0;
    acknowledgement.checked = false;
    acknowledgement.disabled = true;
    continueButton.disabled = true;
    progress.textContent = 'Scroll to the end to acknowledge these terms.';
  };
  text.addEventListener('scroll', () => {
    if (text.scrollTop > 0 && text.scrollTop + text.clientHeight >= text.scrollHeight - 4) {
      acknowledgement.disabled = false;
      progress.textContent = 'You can now confirm that you have read and understand the terms.';
    }
  });
  acknowledgement.addEventListener('change', () => {
    continueButton.disabled = !acknowledgement.checked || acknowledgement.disabled;
  });
  continueButton.addEventListener('click', () => {
    if (continueButton.disabled) return;
    termsDialog.close();
    window.location.assign('/cantoken-client-preview/#contact');
  });
}
document.querySelector('#contact-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const status = document.getElementById('form-status');
  status.textContent = 'Your message has not been sent or saved. Contact form delivery is not connected yet.';
  status.hidden = false;
});
