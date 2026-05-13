(function () {
    window.App = window.App || {};

    const STORAGE_KEYS = {
        posts: "communityPosts",
        phones: "communityPhones"
    };

    function hasSupabaseConfig() {
        const config = window.App.config.supabase;
        return Boolean(
            window.supabase &&
            config.url &&
            config.anonKey &&
            !config.url.includes("PASTE_") &&
            !config.anonKey.includes("PASTE_")
        );
    }

    const client = hasSupabaseConfig()
        ? window.supabase.createClient(window.App.config.supabase.url, window.App.config.supabase.anonKey)
        : null;

    function normalizeAnnouncement(row) {
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            type: row.type,
            datetime: row.scheduled_at || row.datetime || ""
        };
    }

    function normalizePhone(row) {
        return {
            id: row.id,
            number: row.phone_number || row.number
        };
    }

    async function listAnnouncements() {
        if (!client) {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.posts)) || [];
        }

        const { data, error } = await client
            .from("announcements")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data.map(normalizeAnnouncement);
    }

    async function saveAnnouncement(post) {
        if (!client) {
            const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.posts)) || [];
            posts.unshift(post);
            localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
            return post;
        }

        const { data, error } = await client
            .from("announcements")
            .insert({
                title: post.title,
                description: post.description,
                type: post.type,
                scheduled_at: post.datetime || null
            })
            .select()
            .single();

        if (error) throw error;
        return normalizeAnnouncement(data);
    }

    async function updateAnnouncement(idOrIndex, post) {
        if (!client) {
            const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.posts)) || [];
            posts[idOrIndex] = post;
            localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
            return post;
        }

        const { data, error } = await client
            .from("announcements")
            .update({
                title: post.title,
                description: post.description,
                type: post.type,
                scheduled_at: post.datetime || null
            })
            .eq("id", idOrIndex)
            .select()
            .single();

        if (error) throw error;
        return normalizeAnnouncement(data);
    }

    async function deleteAnnouncement(idOrIndex) {
        if (!client) {
            const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.posts)) || [];
            posts.splice(idOrIndex, 1);
            localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
            return;
        }

        const { error } = await client.from("announcements").delete().eq("id", idOrIndex);
        if (error) throw error;
    }

    async function listPhones() {
        if (!client) {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.phones)) || [];
        }

        const { data, error } = await client
            .from("phone_numbers")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data.map(normalizePhone);
    }

    async function savePhone(phone) {
        if (!client) {
            const phones = JSON.parse(localStorage.getItem(STORAGE_KEYS.phones)) || [];
            phones.push(phone);
            localStorage.setItem(STORAGE_KEYS.phones, JSON.stringify(phones));
            return phone;
        }

        const { data, error } = await client
            .from("phone_numbers")
            .insert({ phone_number: phone.number })
            .select()
            .single();

        if (error) throw error;
        return normalizePhone(data);
    }

    async function updatePhone(idOrIndex, phone) {
        if (!client) {
            const phones = JSON.parse(localStorage.getItem(STORAGE_KEYS.phones)) || [];
            phones[idOrIndex] = phone;
            localStorage.setItem(STORAGE_KEYS.phones, JSON.stringify(phones));
            return phone;
        }

        const { data, error } = await client
            .from("phone_numbers")
            .update({ phone_number: phone.number })
            .eq("id", idOrIndex)
            .select()
            .single();

        if (error) throw error;
        return normalizePhone(data);
    }

    async function deletePhone(idOrIndex) {
        if (!client) {
            const phones = JSON.parse(localStorage.getItem(STORAGE_KEYS.phones)) || [];
            phones.splice(idOrIndex, 1);
            localStorage.setItem(STORAGE_KEYS.phones, JSON.stringify(phones));
            return;
        }

        const { error } = await client.from("phone_numbers").delete().eq("id", idOrIndex);
        if (error) throw error;
    }

    window.App.db = {
        isSupabaseEnabled: Boolean(client),
        listAnnouncements,
        saveAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        listPhones,
        savePhone,
        updatePhone,
        deletePhone
    };
})();
