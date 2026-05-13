(function () {
    window.App = window.App || {};

    function showNotification(message, type = "error") {
        const existing = document.getElementById("customNotification");
        if (existing) existing.remove();

        const notification = document.createElement("div");
        notification.id = "customNotification";
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }

    function createConfirmModal({ title, message, confirmText = "YES", cancelText = "NO", onConfirm }) {
        const existing = document.getElementById("confirmModal");
        if (existing) existing.remove();

        const modal = document.createElement("div");
        modal.id = "confirmModal";
        modal.className = "modal is-open";
        modal.innerHTML = `
            <div class="confirm-card">
                <h2>${title}</h2>
                ${message ? `<p>${message}</p>` : ""}
                <div class="modal-actions">
                    <button id="confirmYes" class="confirm-btn danger-button">${confirmText}</button>
                    <button id="confirmNo" class="confirm-btn cancel-btn">${cancelText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.getElementById("confirmYes").addEventListener("click", async () => {
            await onConfirm();
            modal.remove();
        });
        document.getElementById("confirmNo").addEventListener("click", () => modal.remove());
    }

    function createRipple(event) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement("span");

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${(rect.width - size) / 2}px;
            top: ${(rect.height - size) / 2}px;
            border-radius: 50%;
            background: radial-gradient(circle closest-side, rgba(255,255,255,0.9) 0%, rgba(72,187,120,0.7) 20%, transparent 50%);
            transform: scale(0);
            animation: ripple-glow 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            box-shadow: 0 0 0 4px rgba(72,187,120,0.5), 0 0 20px rgba(72,187,120,0.6);
        `;

        button.appendChild(ripple);
        ripple.animate([
            { transform: "scale(0)", opacity: 1 },
            { transform: "scale(1.5)", opacity: 0 }
        ], {
            duration: 600,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)"
        });

        setTimeout(() => ripple.remove(), 600);
    }

    window.App.ui = {
        showNotification,
        createConfirmModal,
        createRipple
    };
})();
