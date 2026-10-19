(function () {
  'use strict';
  window.addEventListener('flash:recap-ready', (e) => {
    const data = e.detail;
    if (!data || !data.text) return;

    // Create Modal
    const modal = document.createElement('div');
    modal.className = 'recap-overlay';
    modal.innerHTML = `
      <div class="recap-modal">
        <div class="recap-header">
          <div class="recap-icon">✨</div>
          <h2>AI Session Analysis</h2>
        </div>
        <div class="recap-body">
          <p>${data.text}</p>
        </div>
        <div class="recap-footer">
          <button id="recap-close" class="btn-primary">Continue</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('recap-close').onclick = () => {
      modal.remove();
    };
  });
})();