// src/app/page.js - Compact three-column layout
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import NewsList from '@/components/NewsList';
import Tooltip from '@/components/Tooltip';
import { getHeadlines } from '@/lib/contentful';
import { getTopGNewsHeadlines, clearNewsCache } from '@/lib/gnews';

const EuropeMap = dynamic(() => import('@/components/EuropeMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    </div>
  )
});

export default function HomePage() {
  const [tooltip, setTooltip] = useState({
    display: false,
    country: null,
    x: 0,
    y: 0
  });
  
  const [headlines, setHeadlines] = useState([]);
  const [topHeadlines, setTopHeadlines] = useState([]);
  const [articlesByDate, setArticlesByDate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastNewsUpdate, setLastNewsUpdate] = useState(null);
  const [newsFromCache, setNewsFromCache] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    loadNewsData();
  }, []);

  const loadNewsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [headlinesData, topHeadlinesData] = await Promise.allSettled([
        getHeadlines(),
        getTopGNewsHeadlines()
      ]);
      
      const headlines = headlinesData.status === 'fulfilled' ? headlinesData.value : [];
      let topHeadlines = [];
      let isFromCache = false;
      
      if (topHeadlinesData.status === 'fulfilled') {
        topHeadlines = topHeadlinesData.value;
        isFromCache = topHeadlines.length > 0 && topHeadlines[0].fromCache;
      }
      
      setHeadlines(headlines);
      setTopHeadlines(topHeadlines);
      setNewsFromCache(isFromCache);
      setLastNewsUpdate(new Date());
      
      // Group headlines by date (last 5 days for compact view)
      const groupedArticles = Array.from({ length: 5 }).map((_, i) => {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(
          "en-US",
          { weekday: "short", month: "short", day: "numeric" }
        );

        return {
          date,
          articles: headlines.filter(
            (article) =>
              new Date(article.date).toDateString() ===
              new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString()
          ),
        };
      });
      
      setArticlesByDate(groupedArticles);
      
    } catch (error) {
      console.error('Error loading news data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshNews = () => {
    clearNewsCache();
    loadNewsData();
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Compact Header */}
      <header className="text-center py-6 px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">European News & Elections Hub</h1>
        <p className="text-lg text-gray-600">Live European news and election tracking</p>
      </header>

      {/* Three-Column Layout */}
      <div className="container mx-auto px-4 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-center">
            <p className="text-red-800 text-sm">
              <strong>Error:</strong> {error}
              <button onClick={loadNewsData} className="ml-2 underline hover:no-underline">
                Try again
              </button>
            </p>
          </div>
        )}

        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
          {/* Left Column: Recent Headlines */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-4 h-full overflow-hidden flex flex-col">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                📰 Recent Headlines
              </h2>
              
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <CompactNewsList articlesByDate={articlesByDate} />
                </div>
              )}
            </div>
          </div>

          {/* Center Column: Election Map */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-6">
            <div className="bg-white rounded-xl shadow-lg p-4 h-full overflow-hidden flex flex-col">
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold text-gray-800">🗺️ Election Countdown Map</h2>
                <p className="text-sm text-gray-600">Hover over countries for election info</p>
              </div>
              
              <div className="flex-1 relative min-h-0">
                <div className="h-full w-full flex items-center justify-center p-2">
                  <div className="w-full h-full max-w-full max-h-full">
                    <EuropeMap setTooltip={setTooltip} />
                    <Tooltip tooltip={tooltip} />
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-1 text-center flex-shrink-0">
                <div className="inline-flex items-center space-x-4 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#e3f2fd', border: '1px solid #1976d2' }}></div>
                    <span>Election data</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded"></div>
                    <span>Other countries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: European Headlines */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-4 text-white h-full overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-400">
                <h2 className="text-lg font-bold flex items-center">
                  <span className="mr-2">🇪🇺</span>
                  European News
                </h2>
                <button 
                  onClick={handleRefreshNews}
                  className="text-blue-200 hover:text-white transition-colors text-xs p-1"
                  title="Refresh news"
                >
                  🔄
                </button>
              </div>
              
              {/* Status indicator */}
              {lastNewsUpdate && (
                <div className="text-xs text-blue-200 mb-3">
                  {newsFromCache ? '📰 Cached' : '🌐 Live'} • {lastNewsUpdate.toLocaleTimeString()}
                </div>
              )}
              
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {topHeadlines.length > 0 ? (
                    <div className="space-y-3">
                      {topHeadlines.slice(0, 8).map((article, index) => (
                        <div key={index} className="pb-3 border-b border-blue-400 last:border-b-0">
                          <div className="flex items-start space-x-2">
                            <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <a
                                href={article.link}
                                className="text-white font-medium hover:text-blue-200 transition-colors text-sm leading-tight block"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {article.title}
                              </a>
                              <div className="text-blue-200 text-xs mt-1">
                                {article.author && <span>{article.author}</span>}
                                {article.country && <span className="ml-1">🌍 {article.country}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-200 text-center text-sm">No headlines available</p>
                  )}
                </div>
              )}
              
              <div className="mt-3 pt-2 border-t border-blue-400 text-xs text-blue-200 text-center">
                Updates every 30 min
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact News List Component
function CompactNewsList({ articlesByDate }) {
  return (
    <div className="space-y-3">
      {articlesByDate.slice(0, 5).map(({ date, articles }, index) => (
        <div key={index}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{date}</h3>
          <div className="space-y-2">
            {articles.slice(0, 3).map((article, i) => (
              <div key={i} className="text-xs">
                <a
                  href={article.link}
                  className="text-red-600 font-medium hover:text-red-800 transition-colors leading-tight block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {article.title}
                </a>
                <span className="text-gray-500 text-xs">({article.author})</span>
              </div>
            ))}
            {articles.length > 3 && (
              <p className="text-xs text-gray-500">+{articles.length - 3} more</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}