import React from 'react';

const InputSection = ({
  description,
  setDescription,
  resumeFile,
  handleFileChange,
  isAnalyzing,
  handleAnalyze
}) => (
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
);

export default InputSection; 