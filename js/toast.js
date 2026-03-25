const Toast = {
  container: null,

  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.innerHTML = `
      <style>
        #toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .toast {
          padding: 14px 20px;
          border-radius: 8px;
          color: white;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: toast-slide-in 0.3s ease-out;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 350px;
        }
        .toast.success { background: #10b981; }
        .toast.error { background: #ef4444; }
        .toast.info { background: #3b82f6; }
        .toast.warning { background: #f59e0b; }
        .toast-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
        .toast-message {
          flex: 1;
        }
        .toast-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0;
          font-size: 18px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .toast-close:hover { opacity: 1; }
        @keyframes toast-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toast-slide-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      </style>
    `;
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 4000) {
    this.init();
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    this.container.appendChild(toast);
    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'toast-slide-out 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  },

  success(message, duration) {
    this.show(message, 'success', duration);
  },

  error(message, duration) {
    this.show(message, 'error', duration);
  },

  info(message, duration) {
    this.show(message, 'info', duration);
  },

  warning(message, duration) {
    this.show(message, 'warning', duration);
  }
};

window.Toast = Toast;
export default Toast;
