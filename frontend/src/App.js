import React, { useState } from 'react';
import './App.css';

function App() {
  const [description, setDescription] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setResumeFile(file);
  };

  const handleAnalyze = () => {
    if (!description.trim() || !resumeFile) {
      alert('Please provide both a job description and upload a resume.');
      return;
    }
    
    setIsAnalyzing(true);
    // TODO: Implement analysis logic here
    console.log('Analyzing:', { description, resumeFile });
    
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      alert('Analysis complete! (This is a placeholder)');
    }, 2000);
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
              onChange={(e) => setDescription(e.target.value)}
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
      </div>
    </div>
  );
}

export default App;
