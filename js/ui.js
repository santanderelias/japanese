/**
 * UI Utilities — Custom Toast Notifications and Modal Confirmation Dialogs.
 * Replaces native alert() and confirm().
 */

let toastContainer = null;

function getOrCreateToastContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Show a floating non-blocking toast notification.
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} [type='info']
 * @param {number} [duration=3200]
 */
export function showToast(message, type = 'info', duration = 3200) {
  const container = getOrCreateToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast-item toast-item--${type}`;

  const iconMap = {
    info: 'ℹ️',
    success: '✨',
    error: '❌',
    warning: '⚠️'
  };

  toast.innerHTML = `
    <span class="toast-item__icon">${iconMap[type] || 'ℹ️'}</span>
    <span class="toast-item__msg">${message}</span>
    <button type="button" class="toast-item__close" aria-label="Close">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-item__close');
  const dismiss = () => {
    toast.classList.add('is-leaving');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  };

  closeBtn?.addEventListener('click', dismiss);

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}

/**
 * Show a promise-based confirmation modal dialog.
 * @param {Object} options
 * @param {string} [options.title='Confirm']
 * @param {string} options.message
 * @param {string} [options.confirmText='OK']
 * @param {string} [options.cancelText='Cancel']
 * @param {boolean} [options.danger=false]
 * @returns {Promise<boolean>}
 */
export function showModal({
  title = 'Confirmation',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false
}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    backdrop.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <h3 id="modal-title">${title}</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          ${cancelText ? `<button type="button" class="btn btn--secondary btn-cancel">${cancelText}</button>` : ''}
          <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'} btn-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    const close = (result) => {
      document.removeEventListener('keydown', keyHandler);
      backdrop.classList.add('is-closing');
      setTimeout(() => {
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
        resolve(result);
      }, 150);
    };

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        close(false);
      } else if (e.key === 'Enter') {
        close(true);
      }
    };

    backdrop.querySelector('.btn-confirm')?.addEventListener('click', () => close(true));
    backdrop.querySelector('.btn-cancel')?.addEventListener('click', () => close(false));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close(false);
    });

    document.addEventListener('keydown', keyHandler);
    document.body.appendChild(backdrop);
  });
}
