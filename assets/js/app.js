(function () {
    const App = window.App;
    let posts = [];
    let phones = [];
    let editingIndex = -1;
    let editingPhoneIndex = -1;

    function isAdmin() {
        return localStorage.getItem("isAdminLoggedIn") === "true";
    }

    function setVisible(element, visible) {
        element.hidden = !visible;
    }

    function toggleAdminMode(show) {
        const postForm = document.getElementById("post-form");
        const phoneSection = document.getElementById("phone-registration");
        const loginBtn = document.getElementById("loginBtn");
        const logoutBtn = document.getElementById("logoutBtn");

        setVisible(postForm, show);
        setVisible(phoneSection, show);
        setVisible(logoutBtn, show);
        setVisible(loginBtn, !show);
        renderPosts();
        renderPhones();
    }

    function renderPosts() {
        const postsList = document.getElementById("postsList");
        postsList.innerHTML = "";

        posts.forEach((post, index) => {
            const postEl = document.createElement("div");
            postEl.className = `post ${post.type}`;
            const actions = isAdmin() ? `
                <div class="post-actions">
                    <button class="edit-post-btn" data-edit-post="${index}">✏️ Edit</button>
                    <button class="delete-btn" data-delete-post="${index}">🗑️ Delete</button>
                </div>` : "";
            const dateTimeHtml = post.datetime ? `<div class="date">📅 ${post.datetime}</div>` : "";

            postEl.innerHTML = `
                <h3>${post.title}</h3>
                <div class="type">${post.type.toUpperCase()}</div>
                ${dateTimeHtml}
                <p class="description">${post.description}</p>
                ${actions}
            `;
            postsList.appendChild(postEl);
        });
    }

    function renderPhones() {
        const list = document.getElementById("phoneList");
        const select = document.getElementById("recipientPhone");
        if (!list || !select) return;

        list.innerHTML = "";
        phones.forEach((phone, index) => {
            const div = document.createElement("div");
            div.className = "phone-item";
            div.innerHTML = `
                <span><strong>${phone.number}</strong></span>
                <div class="phone-actions">
                    <button data-edit-phone="${index}" class="edit-btn-sm">✏️ Edit</button>
                    <button data-delete-phone="${index}" class="delete-btn-sm">🗑️ Delete</button>
                </div>
            `;
            list.appendChild(div);
        });

        select.innerHTML = '<option value="" disabled selected>Select Recipient Number</option>';
        const allOpt = document.createElement("option");
        allOpt.value = "ALL";
        allOpt.textContent = "📢 Select All (Broadcast)";
        select.appendChild(allOpt);

        phones.forEach((phone) => {
            const opt = document.createElement("option");
            opt.value = phone.number;
            opt.textContent = phone.number;
            select.appendChild(opt);
        });
    }

    async function refreshData() {
        posts = await App.db.listAnnouncements();
        phones = await App.db.listPhones();
        renderPosts();
        renderPhones();
    }

    function startEditPost(index) {
        const post = posts[index];
        document.getElementById("title").value = post.title;
        document.getElementById("description").value = post.description;
        document.getElementById("type").value = post.type;
        document.getElementById("datetime").value = post.datetime || "";

        editingIndex = index;
        const submitBtn = document.querySelector("#helpForm button");
        if (submitBtn) submitBtn.textContent = "🔄 Update & Send SMS";

        document.getElementById("post-form").scrollIntoView({ behavior: "smooth" });
    }

    function startEditPhone(index) {
        document.getElementById("pNumber").value = phones[index].number;
        editingPhoneIndex = index;
        const btn = document.querySelector("#phoneForm button");
        if (btn) btn.textContent = "Update";
    }

    async function sendSMS(targetPhone, message, showToast = true) {
        if (!targetPhone) return;

        try {
            let formattedNum = targetPhone.replace(/[\s-]/g, "");
            if (formattedNum.startsWith("09")) {
                formattedNum = `+63${formattedNum.substring(1)}`;
            }

            const { accountSid, authToken, fromNumber } = App.config.twilio;
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
                method: "POST",
                headers: {
                    Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({ To: formattedNum, From: fromNumber, Body: message })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || response.statusText);
            }
        } catch (error) {
            console.error("SMS Error:", error);
            App.ui.showNotification("❌ SMS Failed! Check Console.", "error");
            return;
        }

        if (showToast) App.ui.showNotification(`📨 SMS sent to ${targetPhone}`, "info");
    }

    async function broadcastSms(targetPhone, message) {
        if (targetPhone === "ALL") {
            await Promise.all(phones.map((phone) => sendSMS(phone.number, message, false)));
            return phones.length;
        }

        await sendSMS(targetPhone, message);
        return 1;
    }

    async function deletePost(index) {
        if (!isAdmin()) {
            App.ui.showNotification("🔐 Admin login required!", "warning");
            return;
        }

        App.ui.createConfirmModal({
            title: "DELETE?",
            onConfirm: async () => {
                const idOrIndex = posts[index].id || index;
                await App.db.deleteAnnouncement(idOrIndex);
                if (editingIndex === index) {
                    editingIndex = -1;
                    document.getElementById("helpForm").reset();
                    document.querySelector("#helpForm button").textContent = "Send SMS";
                }
                await refreshData();
                App.ui.showNotification("🗑️ Announcement deleted!", "success");
            }
        });
    }

    async function deletePhone(index) {
        App.ui.createConfirmModal({
            title: "DELETE NUMBER?",
            message: "Are you sure you want to delete?",
            onConfirm: async () => {
                const idOrIndex = phones[index].id || index;
                await App.db.deletePhone(idOrIndex);
                editingPhoneIndex = -1;
                document.getElementById("phoneForm").reset();
                document.querySelector("#phoneForm button").textContent = "Add Phone Number";
                await refreshData();
                App.ui.showNotification("🗑️ Phone number removed", "success");
            }
        });
    }

    function handleLogin() {
        const submitBtn = document.getElementById("submitLogin");
        if (submitBtn.disabled) return;

        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner"></div>';

        setTimeout(() => {
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;

            if (username === App.config.admin.username && password === App.config.admin.password) {
                localStorage.setItem("isAdminLoggedIn", "true");
                document.querySelector("main").classList.remove("locked");
                document.getElementById("auth-buttons").hidden = false;
                toggleAdminMode(true);
                document.getElementById("loginModal").classList.remove("is-open");
                document.getElementById("username").value = "";
                document.getElementById("password").value = "";
                App.ui.showNotification("🎉 Admin logged in!", "success");
            } else {
                App.ui.showNotification("❌ Wrong credentials", "error");
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        }, 800);
    }

    function bindEvents() {
        document.getElementById("loginBtn").addEventListener("click", (event) => {
            App.ui.createRipple(event);
            document.getElementById("loginModal").classList.add("is-open");
        });

        document.getElementById("submitLogin").addEventListener("click", handleLogin);
        document.getElementById("username").addEventListener("keypress", (event) => {
            if (event.key === "Enter") handleLogin();
        });
        document.getElementById("password").addEventListener("keypress", (event) => {
            if (event.key === "Enter") handleLogin();
        });

        document.getElementById("closeLogin").addEventListener("click", () => {
            if (!isAdmin()) {
                App.ui.showNotification("🔐 Please login to access the system", "warning");
                return;
            }

            document.getElementById("loginModal").classList.remove("is-open");
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
        });

        document.getElementById("logoutBtn").addEventListener("click", () => {
            App.ui.createConfirmModal({
                title: "LOGOUT?",
                onConfirm: async () => {
                    localStorage.removeItem("isAdminLoggedIn");
                    document.querySelector("main").classList.remove("locked");
                    document.getElementById("loginModal").classList.remove("is-open");
                    document.getElementById("auth-buttons").hidden = false;
                    toggleAdminMode(false);
                    editingIndex = -1;
                    editingPhoneIndex = -1;
                    document.getElementById("helpForm").reset();
                    document.getElementById("phoneForm").reset();
                    App.ui.showNotification("👋 Logged out - Public view", "info");
                }
            });
        });

        document.getElementById("postsList").addEventListener("click", async (event) => {
            const editIndex = event.target.dataset.editPost;
            const deleteIndex = event.target.dataset.deletePost;
            if (editIndex !== undefined) startEditPost(Number(editIndex));
            if (deleteIndex !== undefined) await deletePost(Number(deleteIndex));
        });

        document.getElementById("phoneList").addEventListener("click", async (event) => {
            const editIndex = event.target.dataset.editPhone;
            const deleteIndex = event.target.dataset.deletePhone;
            if (editIndex !== undefined) startEditPhone(Number(editIndex));
            if (deleteIndex !== undefined) await deletePhone(Number(deleteIndex));
        });

        document.getElementById("helpForm").addEventListener("submit", async function (event) {
            event.preventDefault();
            if (!isAdmin()) {
                App.ui.showNotification("🔐 Admin login required!", "warning");
                return;
            }

            const submitBtn = this.querySelector("button");
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = "Sending... ⏳";

            try {
                const post = {
                    title: document.getElementById("title").value,
                    description: document.getElementById("description").value,
                    type: document.getElementById("type").value,
                    datetime: document.getElementById("datetime").value
                };
                const targetPhone = document.getElementById("recipientPhone").value;

                if (editingIndex > -1) {
                    const idOrIndex = posts[editingIndex].id || editingIndex;
                    await App.db.updateAnnouncement(idOrIndex, post);
                    await broadcastSms(targetPhone, `[UPDATE] ${post.title}: ${post.description}`);
                    editingIndex = -1;
                    App.ui.showNotification("✅ Announcement updated & SMS Sent!", "success");
                } else {
                    await App.db.saveAnnouncement(post);
                    const sentCount = await broadcastSms(targetPhone, `[${post.type}] ${post.title}: ${post.description}`);
                    App.ui.showNotification(`✅ Post added & SMS sent to ${sentCount} number(s)!`, "success");
                }

                await refreshData();
                this.reset();
                submitBtn.textContent = "Send SMS";
            } catch (error) {
                console.error(error);
                App.ui.showNotification("❌ Saving failed. Check Console.", "error");
                submitBtn.textContent = originalText;
            } finally {
                submitBtn.disabled = false;
            }
        });

        document.getElementById("phoneForm").addEventListener("submit", async function (event) {
            event.preventDefault();
            const number = document.getElementById("pNumber").value;
            const cleanNum = number.replace(/[\s-]/g, "");

            if (!/^(09|\+639)\d{9}$/.test(cleanNum)) {
                App.ui.showNotification("❌ Invalid PH Number! Use 09... or +639...", "error");
                return;
            }

            try {
                if (editingPhoneIndex > -1) {
                    const idOrIndex = phones[editingPhoneIndex].id || editingPhoneIndex;
                    await App.db.updatePhone(idOrIndex, { number });
                    editingPhoneIndex = -1;
                    this.querySelector("button").textContent = "Add Phone Number";
                    App.ui.showNotification("📞 Phone Updated!", "success");
                } else {
                    await App.db.savePhone({ number });
                    App.ui.showNotification("📞 Phone Registered!", "success");
                }

                await refreshData();
                this.reset();
            } catch (error) {
                console.error(error);
                App.ui.showNotification("❌ Phone save failed. Check Console.", "error");
            }
        });
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const mainEl = document.querySelector("main");
        const loginModal = document.getElementById("loginModal");
        const authButtons = document.getElementById("auth-buttons");

        bindEvents();
        await refreshData();

        if (!isAdmin()) {
            mainEl.classList.add("locked");
            loginModal.classList.add("is-open");
            authButtons.hidden = true;
        } else {
            mainEl.classList.remove("locked");
            loginModal.classList.remove("is-open");
            authButtons.hidden = false;
            toggleAdminMode(true);
        }

        if (!App.db.isSupabaseEnabled) {
            console.info("Supabase is not configured yet. The app is using localStorage fallback.");
        }
    });
})();
