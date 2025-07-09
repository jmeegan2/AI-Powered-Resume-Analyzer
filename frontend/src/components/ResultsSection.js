import React from 'react';
import ErrorBoundary from './ErrorBoundary';

const ResultsSection = ({ analysis, clearResults }) => (
  <ErrorBoundary>
    <div className="results-section">
      <div className="results-header">
        <h2>Analysis Results</h2>
        <button className="clear-button" onClick={clearResults}>
          Clear Results
        </button>
      </div>
      <div className="results-grid">
        <div className="result-card">
          <h3>Match Score</h3>
          <div className="score-display">
            <span className="score-number">{analysis.matchScore || 0}/100</span>
          </div>
        </div>
        <div className="result-card">
          <h3>Missing Keywords</h3>
          <div className="keywords-list">
            {analysis.missingKeywords && Array.isArray(analysis.missingKeywords) && analysis.missingKeywords.length > 0 ? (
              analysis.missingKeywords.map((keyword, index) => (
                <span key={index} className="keyword missing">
                  {typeof keyword === 'string' ? keyword : JSON.stringify(keyword)}
                </span>
              ))
            ) : (
              <span className="no-keywords">No missing keywords found!</span>
            )}
          </div>
        </div>
        <div className="result-card">
          <h3>Present Keywords</h3>
          <div className="keywords-list">
            {analysis.presentKeywords && Array.isArray(analysis.presentKeywords) && analysis.presentKeywords.length > 0 ? (
              analysis.presentKeywords.map((keywordObj, index) => {
                if (typeof keywordObj === 'string') {
                  return (
                    <span key={index} className="keyword present">{keywordObj}</span>
                  );
                }
                if (keywordObj && typeof keywordObj === 'object') {
                  return (
                    <div key={index} className="keyword-item present">
                      <span className="keyword-text">{keywordObj.keyword || 'Unknown keyword'}</span>
                      <span className="keyword-details">
                        Found as: {keywordObj.found_in_resume || 'N/A'} (in {keywordObj.section || 'Unknown section'})
                      </span>
                    </div>
                  );
                }
                return (
                  <span key={index} className="keyword present">
                    {JSON.stringify(keywordObj)}
                  </span>
                );
              })
            ) : (
              <span className="no-keywords">No matching keywords found</span>
            )}
          </div>
        </div>
        <div className="result-card full-width">
          <h3>Recommendations</h3>
          <div className="recommendations-list">
            {analysis.recommendations && Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0 ? (
              <ul>
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            ) : (
              <span className="no-recommendations">No specific recommendations available</span>
            )}
          </div>
        </div>
        {analysis.analysis && (
          <div className="result-card full-width">
            <h3>Summary</h3>
            <p className="analysis-summary">{analysis.analysis}</p>
          </div>
        )}
      </div>
    </div>
  </ErrorBoundary>
);

export default ResultsSection; 