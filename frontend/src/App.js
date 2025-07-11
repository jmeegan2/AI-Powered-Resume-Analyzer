import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultsSection from './components/ResultsSection';
import ErrorMessage from './components/ErrorMessage';
// import ErrorBoundary from './components/ErrorBoundary';
import Chatbot from './components/Chatbot';

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

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/';
      const response = await fetch(`${API_BASE_URL}api/analyze-resume`, {
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
        <Header />
        
        <InputSection
          description={description}
          setDescription={setDescription}
          resumeFile={resumeFile}
          setResumeFile={setResumeFile}
          handleFileChange={handleFileChange}
        />
        <div className="button-section">
          <button
            className={`analyze-button ${isAnalyzing ? 'analyzing' : ''}`}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </div>

        <ErrorMessage error={error} />

        {analysis && (
          <ResultsSection
            analysis={analysis}
            clearResults={clearResults}
          />
        )}
      </div>
      
      {/* Chatbot Component */}
      <Chatbot />
    </div>
  );
}
// hey
export default App;
