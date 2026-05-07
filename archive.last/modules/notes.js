(function() {
    const content = document.getElementById('content');
    
    // Module State
    let notes = [];
    const MODULE_ID = "notes_module";

    const saved = localStorage.getItem('user_notes');
    if (saved) notes = JSON.parse(saved);

    function render() {
        content.innerHTML = `
            <div class="card">
                <h1>✍️ Notepad</h1>
                <p>Add a note to your native widget.</p>
                
                <input type="text" id="note-title" placeholder="Title">
                <textarea id="note-body" placeholder="Your message..."></textarea>
                
                <button onclick="addUserNote()" style="width: 100%;">Save to Widget</button>
            </div>

            <div class="card">
                <h3>Saved Notes</h3>
                ${notes.length === 0 ? '<p style="color: #888;">No notes yet.</p>' : ''}
                ${notes.map((n, i) => `
                    <div class="list-item">
                        <b>${n.title}</b><br>${n.body}
                        <button onclick="deleteUserNote(${i})" style="position: absolute; right: 5px; top: 5px; background: none; color: #dc3545; padding: 0;">✕</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    window.addUserNote = function() {
        const titleInput = document.getElementById('note-title');
        const bodyInput = document.getElementById('note-body');
        if (!titleInput.value || !bodyInput.value) return;

        const newNote = { title: titleInput.value, body: bodyInput.value, timestamp: Date.now() };
        notes.unshift(newNote);
        saveAndSync();
        render();
    };

    window.deleteUserNote = function(index) {
        notes.splice(index, 1);
        saveAndSync();
        render();
    };

    function saveAndSync() {
        localStorage.setItem('user_notes', JSON.stringify(notes));
        
        if (window.Android && window.Android.registerWidgetData) {
            window.Android.registerWidgetData(MODULE_ID, JSON.stringify(notes));
            
            // 💡 NEW: Register native settings for EACH note
            const schema = notes.map(n => ({
                id: "note_visible_" + n.timestamp,
                type: "toggle",
                label: "Show: " + n.title
            }));
            window.Android.registerSettingsSchema(MODULE_ID, JSON.stringify(schema));
        }
    }

    render();
    // Register settings on load
    saveAndSync();
})();
