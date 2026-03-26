export function initHamburger(root = document) {  
  const hamburger = root.getElementById('hamburger');
  const navMenu = root.getElementById('navMenu');

  if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
          const isOpen = navMenu.classList.toggle('active');
          hamburger.setAttribute('aria-expanded', isOpen.toString());
      });
  }
}

export default { initHamburger }
