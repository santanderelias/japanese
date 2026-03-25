(function() {
    const content = document.getElementById('content');
    
    // Module State
    let notes = [];
    const MODULE_ID = "notes_module";

    // Load existing notes from local storage if any
    const saved = localStorage.getItem('user_notes');
    if (saved) notes = JSON.parse(saved);

    function render() {
        content.innerHTML = `
            <div class="card">
                <h1>✍️ Notepad Module</h1>
                <p>Write a message below to add it as a native widget card.</p>
                
                <div style="margin-bottom: 15px;">
                    <input type="text" id="note-title" placeholder="Title" style="width: 100%; padding: 8px; margin-bottom: 5px; border: 1px solid #ccc; border-radius: 4px;">
                    <textarea id="note-body" placeholder="Your message..." style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
                </div>
                
                <button onclick="addUserNote()" style="width: 100%; margin-bottom: 20px;">Save to Widget</button>

                <h3>Current Notes</h3>
                <div id="notes-list">
                    ${notes.length === 0 ? '<p style="color: #888;">No notes yet.</p>' : ''}
                    ${notes.map((n, i) => `
                        <div style="background: #fdfdfd; border-left: 4px solid #6200ee; padding: 10px; margin-bottom: 10px; position: relative;">
                            <b>${n.title}</b><br>${n.body}
                            <button onclick="deleteUserNote(${i})" style="position: absolute; right: 5px; top: 5px; background: none; color: red; padding: 0;">✕</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    window.addUserNote = function() {
        const titleInput = document.getElementById('note-title');
        const bodyInput = document.getElementById('note-body');
        
        if (!titleInput.value || !bodyInput.value) {
            alert("Please enter both title and body");
            return;
        }

        const newNote = { title: titleInput.value, body: bodyInput.value };
        notes.unshift(newNote);
        
        saveAndSync();
        titleInput.value = '';
        bodyInput.value = '';
        render();
    };

    window.deleteUserNote = function(index) {
        notes.splice(index, 1);
        saveAndSync();
        render();
    };

    function saveAndSync() {
        // 1. Save to local web storage
        localStorage.setItem('user_notes', JSON.stringify(notes));
        
        // 2. Push to Native Widget Bridge
        if (window.Android && window.Android.registerWidgetData) {
            window.Android.registerWidgetData(MODULE_ID, JSON.stringify(notes));
            console.log("Notes synced to widget bridge.");
        }
    }

    render();
})();
