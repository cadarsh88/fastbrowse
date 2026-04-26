const { app, BrowserWindow, ipcMain, BrowserView } = require('electron');
const path = require('path');
let summarizer = null;

async function getTransformers() {
    const transformers = await import('@xenova/transformers');
    transformers.env.allowLocalModels = true;
    return transformers;
}

async function getSummarizer(progressCallback) {
    if (!summarizer) {
        const { pipeline } = await getTransformers();
        summarizer = await pipeline('summarization', 'Xenova/bart-large-cnn', {
            progress_callback: progressCallback
        });
    }
    return summarizer;
}

let mainWindow;
let activeView;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Depending on env, load localhost or the built index.html
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers for BrowserView ---
ipcMain.on('navigate-to', (event, url) => {
    if (!activeView) {
        activeView = new BrowserView();
        mainWindow.addBrowserView(activeView);
        activeView.setBackgroundColor('#ffffff');

        // Extract content when page finishes loading
        activeView.webContents.on('did-finish-load', async () => {
            try {
                const extractScript = `
                  (() => {
                    let container = document.querySelector('article') || 
                                  document.querySelector('main') || 
                                  document.body;
                    let text = container ? container.innerText : document.body.innerText;
                    return {
                      title: document.title,
                      length: text.length,
                      excerpt: text.substring(0, 250) + '...',
                      textContent: text
                    };
                  })()
                `;
                const article = await activeView.webContents.executeJavaScript(extractScript);

                if (article) {
                    mainWindow.webContents.send('page-summarized', {
                        title: article.title,
                        length: article.length,
                        excerpt: article.excerpt,
                        textContent: article.textContent
                    });

                    // Run local AI summary
                    try {
                        const wordCount = article.textContent.trim().split(/\s+/).length;
                        if (wordCount < 350) {
                            mainWindow.webContents.send('summarize-complete', {
                                summary: `Page content is not text-heavy enough to require a summary (${wordCount} words).`
                            });
                            return;
                        }

                        const textToSummarize = article.textContent.slice(0, 4000); // model token limits
                        const summarizerFunc = await getSummarizer((progress) => {
                            mainWindow.webContents.send('summarizer-progress', progress);
                        });

                        mainWindow.webContents.send('summarizer-progress', { status: 'generating' });
                        const result = await summarizerFunc(textToSummarize, {
                            max_new_tokens: 150,
                            min_length: 30
                        });

                        mainWindow.webContents.send('summarize-complete', {
                            summary: result[0].summary_text
                        });
                    } catch (sumErr) {
                        console.error('Local Summary Error:', sumErr);
                        mainWindow.webContents.send('summarize-error', sumErr.message);
                    }
                }
            } catch (err) {
                console.error('Error extracting content:', err);
            }
        });
    }

    // ensure it has a protocol
    let finalUrl = url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
    }

    activeView.webContents.loadURL(finalUrl).catch(err => {
        console.error('Failed to load URL:', err);
    });
});

ipcMain.on('update-view-bounds', (event, bounds) => {
    if (activeView && mainWindow) {
        activeView.setBounds({
            x: Math.round(bounds.x),
            y: Math.round(bounds.y),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height)
        });
    }
});

ipcMain.on('go-back', () => {
    if (activeView && activeView.webContents.canGoBack()) {
        activeView.webContents.goBack();
    }
});

ipcMain.on('go-forward', () => {
    if (activeView && activeView.webContents.canGoForward()) {
        activeView.webContents.goForward();
    }
});

ipcMain.on('reload', () => {
    if (activeView) {
        activeView.webContents.reload();
    }
});
