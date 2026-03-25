(function() {
    const content = document.getElementById('content');
    
    // Default settings if none exist
    let settings = {
        "show_home": "true",
        "show_sectionX": "true",
        "widget_bg_color": "#FFFFE0",
        "widget_text_size": "14"
    };

    // Try to load from Android bridge
    if (window.Android && window.Android.getAllSettings) {
        try {
            const raw = JSON.parse(window.Android.getAllSettings());
            settings = { ...settings, ...raw };
        } catch (e) { console.error("Error loading settings", e); }
    }

    content.innerHTML = `
        <div class="card">
            <h1>Settings</h1>
            
            <div style="margin-bottom: 20px;">
                <h3>Module Visibility</h3>
                <label><input type="checkbox" id="toggle-home" ${settings.show_home === 'true' ? 'checked' : ''}> Show Home</label><br>
                <label><input type="checkbox" id="toggle-sectionX" ${settings.show_sectionX === 'true' ? 'checked' : ''}> Show Section X</label>
            </div>

            <div style="margin-bottom: 20px;">
                <h3>Widget Properties</h3>
                <label>Background Color: <input type="color" id="widget-bg" value="${settings.widget_bg_color}"></label><br><br>
                <label>Text Size (SP): <input type="number" id="widget-size" value="${settings.widget_text_size}" min="10" max="30"></label>
            </div>

            <button onclick="saveAppSettings()">Save Settings</button>
        </div>
    `;

    window.saveAppSettings = function() {
        const newSettings = {
            "show_home": document.getElementById('toggle-home').checked ? "true" : "false",
            "show_sectionX": document.getElementById('toggle-sectionX').checked ? "true" : "false",
            "widget_bg_color": document.getElementById('widget-bg').value,
            "widget_text_size": document.getElementById('widget-size').value
        };

        if (window.Android) {
            for (let key in newSettings) {
                window.Android.saveSetting(key, newSettings[key]);
            }
            window.Android.notifyRefresh();
            alert("Settings saved and widget updated!");
            // Re-render nav in index.html if needed
            if (window.updateNavigation) window.updateNavigation();
        } else {
            console.log("Saving mock settings", newSettings);
        }
    };
})();
