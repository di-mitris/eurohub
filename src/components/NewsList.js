// src/components/NewsList.js
import React from 'react';

export default function NewsList({ articlesByDate }) {
  return (
    <div>
      {articlesByDate.map(({ date, articles }, index) => (
        <div key={index} className="mb-6">
          {/* Display the date for each section */}
          <h2 className="text-xl font-bold mb-2">Headlines, {date}</h2>
          <ul>
            {articles.map((article, i) => (
              <li key={i} className="mb-2">
                <a
                  href={article.link}
                  className="text-red-600 font-semibold hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {article.title}
                </a>
                <span className="text-gray-500 ml-2">({article.author})</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}