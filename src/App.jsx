import React, { useState, useEffect, useRef } from 'react';

function App() {
    const [url, setUrl] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const containerRef = useRef(null);

    const [articleData, setArticleData] = useState(null);
    const [summaryProgress, setSummaryProgress] = useState(null);
    const [summary, setSummary] = useState(null);

    const handleNavigate = (e) => {
        e.preventDefault();
        if (window.electronAPI) {
            setArticleData(null);
            setSummaryProgress(null);
            setSummary(null);
            window.electronAPI.navigate(url);
            setCurrentUrl(url);
        } else {
            console.log('Mock navigate:', url);
        }
    };

    useEffect(() => {
        if (!window.electronAPI) return;

        window.electronAPI.onPageSummarized((data) => {
            console.log('Received article data:', data);
            setArticleData(data);
        });

        window.electronAPI.onSummarizerProgress((data) => {
            setSummaryProgress(data);
        });

        window.electronAPI.onSummarizeComplete((data) => {
            console.log('Summary Complete:', data);
            setSummaryProgress(null);
            setSummary(data.summary);
        });

        window.electronAPI.onSummarizeError((err) => {
            console.error('Summary Error:', err);
            setSummaryProgress({ status: 'error', message: err });
        });
    }, []);

    useEffect(() => {
        if (!window.electronAPI || !containerRef.current) return;

        const updateBounds = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                window.electronAPI.updateViewBounds({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        // Initial positioning
        updateBounds();

        // Re-position on resize
        const observer = new ResizeObserver(updateBounds);
        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [currentUrl]);

    return (
        <div className="h-screen flex flex-col bg-gray-100 font-sans text-gray-800">
            {/* Draggable Title Bar Area for macOS */}
            <div className="h-8 bg-gray-200 border-b border-gray-300 app-region-drag"></div>

            {/* Navigation Header */}
            <header className="flex p-2 bg-white shadow-sm border-b items-center gap-3">
                <div className="flex gap-1">
                    <button
                        onClick={() => window.electronAPI?.goBack()}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                        onClick={() => window.electronAPI?.goForward()}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <button
                        onClick={() => window.electronAPI?.reload()}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>

                <form onSubmit={handleNavigate} className="flex-1 flex max-w-3xl">
                    <div className="relative w-full flex items-center">
                        <div className="absolute left-3 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        </div>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-gray-100 border border-gray-200 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700"
                            placeholder="Search or enter web address"
                        />
                    </div>
                </form>
            </header>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main Web View Placeholder - BrowserView will be positioned over this */}
                <div ref={containerRef} className="flex-[0.7] bg-white relative">
                    {!currentUrl && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                            <p>Web Content will load here</p>
                        </div>
                    )}
                </div>

                {/* Summarization Panel */}
                <div className="flex-[0.3] bg-white border-l border-gray-200 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 hidden sm:flex">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Quick Read
                        </h2>
                    </div>
                    <div className="p-5 flex-1 overflow-y-auto">
                        {!articleData ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 rounded"></div>
                                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                                </div>
                                <p className="text-xs text-gray-400 mt-6 block">Waiting for webpage to load...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h1 className="text-xl font-bold text-gray-900 leading-tight">{articleData.title}</h1>

                                {/* Summary Box */}
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        AI Summary
                                    </h3>

                                    {summary ? (
                                        <p className="mt-2 text-sm text-gray-800 leading-relaxed font-medium">
                                            {summary}
                                        </p>
                                    ) : summaryProgress ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="text-sm text-blue-900 leading-relaxed italic animate-pulse">
                                                {summaryProgress.status === 'generating' ? 'Generating summary...' : 'Loading AI Model (' + (summaryProgress.progress ? Math.round(summaryProgress.progress) + '%' : summaryProgress.status) + ')'}
                                            </div>
                                            {summaryProgress.progress && (
                                                <div className="w-full bg-blue-200 rounded-full h-1.5">
                                                    <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${summaryProgress.progress}%` }}></div>
                                                </div>
                                            )}
                                            {summaryProgress.status === 'error' && (
                                                <div className="text-red-500 text-xs">Error: {summaryProgress.message}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-blue-900 leading-relaxed italic animate-pulse">
                                            Preparing local summarize engine...
                                        </div>
                                    )}
                                </div>

                                <div className="text-xs text-gray-500 mt-4 border-t pt-2 border-gray-100">
                                    <p>Word count: {articleData.length} characters extracted.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
