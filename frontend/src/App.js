import React, { useState } from 'react';
import './App.css';

function App() {
  const [description, setDescription] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setResumeFile(file);
    setError(null);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!description.trim() || !resumeFile) {
      setError('Please provide both a job description and upload a resume.');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('jobDescription', description);
      formData.append('resume', resumeFile);

      const response = await fetch('http://localhost:5001/api/analyze-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume');
      }

      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResults = () => {
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Resume Analyzer</h1>
          <p>Upload your resume and job description to get personalized insights</p>
        </header>
        
        <div className="input-section">
          <div className="input-group">
            <label htmlFor="description">Job Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError(null);
                setAnalysis(null);
              }}
              placeholder="Paste the job description here..."
              rows="8"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="resume">Upload Resume</label>
            <div className="file-upload">
              <input
                type="file"
                id="resume"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="resume" className="file-label">
                <div className="upload-icon">📄</div>
                <div className="upload-text">
                  {resumeFile ? resumeFile.name : 'Choose a file or drag it here'}
                </div>
                <div className="upload-hint">PDF, DOC, DOCX, or TXT</div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="button-section">
          <button 
            className={`analyze-button ${isAnalyzing ? 'analyzing' : ''}`}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <div className="error-text">{error}</div>
          </div>
        )}

        {analysis && (
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
                  <span className="score-number">{analysis.matchScore}/10</span>
                </div>
              </div>

              <div className="result-card">
                <h3>Missing Keywords</h3>
                <div className="keywords-list">
                  {analysis.missingKeywords && analysis.missingKeywords.length > 0 ? (
                    analysis.missingKeywords.map((keyword, index) => (
                      <span key={index} className="keyword missing">{keyword}</span>
                    ))
                  ) : (
                    <span className="no-keywords">No missing keywords found!</span>
                  )}
                </div>
              </div>

              <div className="result-card">
                <h3>Present Keywords</h3>
                <div className="keywords-list">
                  {analysis.presentKeywords && analysis.presentKeywords.length > 0 ? (
                    analysis.presentKeywords.map((keyword, index) => (
                      <span key={index} className="keyword present">{keyword}</span>
                    ))
                  ) : (
                    <span className="no-keywords">No matching keywords found</span>
                  )}
                </div>
              </div>

              <div className="result-card full-width">
                <h3>Recommendations</h3>
                <div className="recommendations-list">
                  {analysis.recommendations && analysis.recommendations.length > 0 ? (
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
        )}
      </div>
    </div>
  );
}

export default App;
