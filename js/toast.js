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
          pointer-events: none;
        }
        .toast {
          padding: 14px 20px;
          border-radius: 8px;
          color: white;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1);
          animation: toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 380px;
          pointer-events: auto;
          overflow: hidden;
          position: relative;
        }
        .toast::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          width: 100%;
          animation: toast-progress 4s linear forwards;
          background: rgba(255,255,255,0.3);
        }
        .toast.success { background: linear-gradient(135deg, #10b981, #059669); }
        .toast.error { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .toast.info { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .toast.warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .toast-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        .toast-message {
          flex: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .toast-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 14px;
          border-radius: 4px;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .toast-close:hover { background: rgba(255,255,255,0.3); }
        @keyframes toast-slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toast-slide-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(120%); opacity: 0; }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
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

  success(message, duration = 4000) {
    this.show(message, 'success', duration);
  },

  error(message, duration = 6000) {
    this.show(message, 'error', duration);
  },

  info(message, duration = 4000) {
    this.show(message, 'info', duration);
  },

  warning(message, duration = 5000) {
    this.show(message, 'warning', duration);
  }
};

window.Toast = Toast;
export default Toast;
