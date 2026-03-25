(function() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <h1>Welcome to the Shell</h1>
            <p>This is the <b>home.js</b> module.</p>
            <p>Use the button below to update the native widget content.</p>
            <button onclick="updateWidgetData()">Update Widget</button>
        </div>
    `;

    window.updateWidgetData = function() {
        const newData = [
            { title: "Home Update", body: "Widget updated at " + new Date().toLocaleTimeString() },
            { title: "Dynamic Logic", body: "JS can push any JSON array to the StackView." }
        ];
        if (window.Android) {
            window.Android.updateWidget(JSON.stringify(newData));
            window.Android.notifyRefresh();
            alert("Widget data sent!");
        } else {
            console.log("Android bridge not available", newData);
        }
    };
})();
