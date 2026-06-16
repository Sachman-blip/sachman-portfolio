import { revealUp, splitReveal } from '../lib/scrollFx';
import { scrollTo } from '../lib/smoothScroll';

const CONTACT = {
  email: 'sachman.singh.saund@gmail.com',
  instagram: 'sachman.singh',
};

export function initContact(): void {
  const emailLink = document.getElementById('linkEmail') as HTMLAnchorElement | null;
  const instaLink = document.getElementById('linkInsta') as HTMLAnchorElement | null;

  if (emailLink && CONTACT.email) {
    emailLink.href = `mailto:${CONTACT.email}`;
    const v = emailLink.querySelector('.c-v');
    if (v) v.textContent = CONTACT.email;
    emailLink.removeAttribute('data-todo');
  }
  if (instaLink && CONTACT.instagram) {
    instaLink.href = `https://instagram.com/${CONTACT.instagram}`;
    const v = instaLink.querySelector('.c-v');
    if (v) v.textContent = '@' + CONTACT.instagram;
    instaLink.removeAttribute('data-todo');
  }

  document.getElementById('toTop')?.addEventListener('click', () => scrollTo(0));

  const tag = document.querySelector('.contact .tag');
  const statement = document.querySelectorAll<HTMLElement>('.contact-statement span');
  const sub = document.querySelector('.contact-sub');
  const links = document.querySelector('.contact-links');

  if (tag) revealUp(tag);
  statement.forEach((s) => splitReveal(s, 'top 88%'));
  if (sub) revealUp(sub, { y: 24 });
  if (links) revealUp(links, { stagger: true, y: 30 });
}
