(function() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <h1>Section X Module</h1>
            <p>This is a secondary module illustrating modular navigation.</p>
            <p>You can sync new content via the manifest bridge.</p>
            <button onclick="syncNewVersion()">Sync Version 1.1.0</button>
        </div>
    `;

    window.syncNewVersion = function() {
        const newManifest = {
            version: "1.1.0",
            files: ["index.html", "home.js", "sectionX.js", "widget.js"],
            widgetData: [
                { title: "Sync Test", body: "Data updated via new manifest sync." }
            ]
        };
        if (window.Android) {
            window.Android.sync(JSON.stringify(newManifest));
        } else {
            console.log("Sync requested", newManifest);
        }
    };
})();
