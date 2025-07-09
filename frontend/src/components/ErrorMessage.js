import React from 'react';

const ErrorMessage = ({ error }) => (
  error ? (
    <div className="error-message">
      <div className="error-icon">⚠️</div>
      <div className="error-text">{error}</div>
    </div>
  ) : null
);

export default ErrorMessage; 