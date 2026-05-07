(function() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <h1>Welcome to the Shell</h1>
            <p>This is the <b>home.js</b> module using mother-app styles.</p>
            <p>You no longer need to style buttons or inputs individually.</p>
            <button onclick="Android.checkForUpdate()">Check for Server Updates</button>
        </div>
    `;
})();
