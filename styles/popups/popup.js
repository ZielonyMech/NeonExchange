const NXPopup = (() => {

  const ICONS = {
    success: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    check:   `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    logout:  `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    x:       `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  };

  function getContainer() {
    let c = document.getElementById('nx-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'nx-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function toast({ type = 'info', title = '', message = '', duration = 4000 } = {}) {
    const container = getContainer();

    const el = document.createElement('div');
    el.className = `nx-toast nx-toast--${type}`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <span class="nx-toast__icon" aria-hidden="true">${ICONS[type] || ICONS.info}</span>
      <div class="nx-toast__body">
        ${title   ? `<div class="nx-toast__title">${title}</div>` : ''}
        ${message ? `<div class="nx-toast__message">${message}</div>` : ''}
      </div>
      <button class="nx-toast__close" aria-label="Zamknij">&#x2715;</button>
    `;

    el.querySelector('.nx-toast__close').addEventListener('click', () => removeToast(el));
    container.appendChild(el);

    if (duration > 0) {
      setTimeout(() => removeToast(el), duration);
    }

    return el;
  }

  function removeToast(el) {
    if (!el || !el.parentNode) return;
    el.classList.add('nx-hiding');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function lowerOpenDialogs() {
    document.querySelectorAll('dialog[open]').forEach((dialog) => {
      dialog.style.zIndex = '0';
      dialog.style.position = 'relative';
    });
  }

  function modal({ type = 'info', icon, title = '', message = '', buttons = [] } = {}) {
    return new Promise((resolve) => {
      const iconKey = icon || (type === 'success' ? 'check' : type === 'warning' ? 'logout' : type);

      const overlay = document.createElement('div');
      overlay.className = 'nx-overlay';
      overlay.style.zIndex = '2147483650';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', title);

      document.body.classList.add('nx-modal-open');
      lowerOpenDialogs();

      const buttonsHTML = buttons.length
        ? buttons.map((b, i) =>
            `<button class="nx-modal-btn nx-modal-btn--${b.style || 'info'}" data-idx="${i}">${b.label}</button>`
          ).join('')
        : `<button class="nx-modal-btn nx-modal-btn--${type}" data-idx="0">OK</button>`;

      overlay.innerHTML = `
        <div class="nx-modal nx-modal--${type}">
          <div class="nx-modal__icon-wrap">${ICONS[iconKey] || ICONS[type]}</div>
          <div class="nx-modal__title">${title}</div>
          ${message ? `<div class="nx-modal__message">${message}</div>` : ''}
          <div class="nx-modal__actions">${buttonsHTML}</div>
        </div>
      `;

      overlay.querySelector('.nx-modal__actions').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-idx]');
        if (!btn) return;
        const idx = Number(btn.dataset.idx);
        closeModalEl(overlay);
        if (buttons[idx]?.onClick) buttons[idx].onClick();
        resolve(idx);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModalEl(overlay);
          resolve(null);
        }
      });

      document.body.appendChild(overlay);
      document.addEventListener('keydown', escHandler);

      function escHandler(e) {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', escHandler);
          closeModalEl(overlay);
          resolve(null);
        }
      }
    });
  }

  function closeModalEl(overlay) {
    overlay.classList.add('nx-hiding');
    overlay.addEventListener('animationend', () => {
      overlay.remove();
      document.body.classList.remove('nx-modal-open');
    }, { once: true });
  }

  function closeModal() {
    const overlay = document.querySelector('.nx-overlay');
    if (overlay) closeModalEl(overlay);
  }

  return { toast, modal, closeModal };

})();

function nxLoginSuccess(username = '') {
  NXPopup.toast({
    type: 'success',
    title: 'Zalogowano pomyślnie',
    message: username ? `Witaj z powrotem, ${username}!` : 'Witaj z powrotem!',
  });
}

function nxLoginError() {
  NXPopup.toast({
    type: 'error',
    title: 'Błąd logowania',
    message: 'Nieprawidłowy e-mail lub hasło. Spróbuj ponownie.',
  });
}

function nxRegisterSuccess() {
  NXPopup.toast({
    type: 'success',
    title: 'Konto utworzone',
    message: 'Możesz się teraz zalogować.',
  });
}

function nxSessionExpired() {
  return NXPopup.modal({
    type: 'warning',
    icon: 'logout',
    title: 'Sesja wygasła',
    message: 'Twoja sesja wygasła. Zaloguj się ponownie, aby kontynuować.',
    buttons: [
      { label: 'Zaloguj się', style: 'warning' },
    ],
  });
}

async function nxConfirmLogout() {
  const result = await NXPopup.modal({
    type: 'warning',
    icon: 'logout',
    title: 'Wyloguj się?',
    message: 'Twoja sesja zostanie zakończona.',
    buttons: [
      { label: 'Wyloguj', style: 'warning' },
      { label: 'Anuluj',  style: 'ghost'   },
    ],
  });
  return result === 0;
}

function nxTransactionSuccess(amount, currency) {
  NXPopup.toast({
    type: 'success',
    title: 'Transakcja zrealizowana',
    message: amount && currency ? `Wymieniono ${amount} ${currency} pomyślnie.` : 'Transakcja przebiegła pomyślnie.',
  });
}

function nxTransactionError() {
  return NXPopup.modal({
    type: 'error',
    icon: 'x',
    title: 'Transakcja odrzucona',
    message: 'Nie udało się przetworzyć transakcji. Sprawdź saldo i spróbuj ponownie.',
    buttons: [
      { label: 'Spróbuj ponownie', style: 'error' },
      { label: 'Zamknij',          style: 'ghost' },
    ],
  });
}

function nxNetworkError() {
  NXPopup.toast({
    type: 'error',
    title: 'Błąd połączenia',
    message: 'Nie udało się połączyć z serwerem. Sprawdź internet.',
    duration: 6000,
  });
}
