(function() {
    // This script contains formatting logic for widget data.
    window.formatWidgetData = function(data) {
        return data.map(item => ({
            title: item.title.toUpperCase(),
            body: item.body + " (formatted by widget.js)"
        }));
    };
})();
