const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Navigation
    navigate: (url) => ipcRenderer.send('navigate-to', url),
    goBack: () => ipcRenderer.send('go-back'),
    goForward: () => ipcRenderer.send('go-forward'),
    reload: () => ipcRenderer.send('reload'),

    // UI orchestration
    updateViewBounds: (bounds) => ipcRenderer.send('update-view-bounds', bounds),

    // Data events
    onPageSummarized: (callback) => ipcRenderer.on('page-summarized', (_event, data) => callback(data)),
    onSummarizerProgress: (callback) => ipcRenderer.on('summarizer-progress', (_event, data) => callback(data)),
    onSummarizeComplete: (callback) => ipcRenderer.on('summarize-complete', (_event, data) => callback(data)),
    onSummarizeError: (callback) => ipcRenderer.on('summarize-error', (_event, error) => callback(error))
});
