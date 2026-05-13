(function () {
    window.App = window.App || {};

    window.App.config = {
        admin: {
            username: "admin",
            password: "bisu123"
        },
        supabase: {
            url: "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE",
            anonKey: "PASTE_YOUR_SUPABASE_ANON_KEY_HERE"
        },
        twilio: JSON.parse(localStorage.getItem("twilioConfig")) || {
            accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            authToken: "your_auth_token",
            fromNumber: "+15555555555"
        }
    };

    window.setTwilioConfig = function (sid, token, number) {
        window.App.config.twilio = { accountSid: sid, authToken: token, fromNumber: number };
        localStorage.setItem("twilioConfig", JSON.stringify(window.App.config.twilio));
        console.log("Twilio configuration saved.");
    };
})();
