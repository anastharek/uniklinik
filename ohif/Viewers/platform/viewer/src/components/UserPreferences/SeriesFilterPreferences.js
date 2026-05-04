import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  getBlockedSeries,
  addBlockedSeries,
  removeBlockedSeries,
  clearBlockedSeries,
  suggestedPatterns,
} from '../../../../ui/src/components/studyBrowser/SeriesFilterService';

import './SeriesFilterPreferences.styl';

function SeriesFilterPreferences({ onClose }) {
  const [blockedSeries, setBlocked] = useState([]);
  const [newPattern, setNewPattern] = useState('');

  useEffect(() => {
    setBlocked(getBlockedSeries());
  }, []);

  const handleAdd = () => {
    if (newPattern.trim()) {
      addBlockedSeries(newPattern.trim());
      setBlocked(getBlockedSeries());
      setNewPattern('');
    }
  };

  const handleRemove = (pattern) => {
    removeBlockedSeries(pattern);
    setBlocked(getBlockedSeries());
  };

  const handleAddSuggested = (pattern) => {
    addBlockedSeries(pattern);
    setBlocked(getBlockedSeries());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleReset = () => {
    clearBlockedSeries();
    setBlocked([]);
  };

  return (
    <React.Fragment>
      <div className="SeriesFilterPreferences">
        <div className="filter-description">
          <p>
            Block sequences from appearing in the study browser. Use * as a
            wildcard (e.g., "PR *" blocks all presentation state series).
          </p>
        </div>

        <div className="add-pattern-section">
          <label htmlFor="series-filter-input">Block Sequence</label>
          <div className="input-group">
            <input
              id="series-filter-input"
              type="text"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., DWI_og or SCOUT"
              className="form-control"
            />
            <button
              onClick={handleAdd}
              className="btn btn-primary add-btn"
              disabled={!newPattern.trim()}
            >
              Add
            </button>
          </div>
        </div>

        {suggestedPatterns.length > 0 && (
          <div className="suggested-patterns">
            <label>Suggested</label>
            <div className="suggested-list">
              {suggestedPatterns.map((pattern) => (
                <button
                  key={pattern}
                  onClick={() => handleAddSuggested(pattern)}
                  className="suggested-btn"
                  disabled={blockedSeries.includes(pattern.toLowerCase())}
                >
                  {blockedSeries.includes(pattern.toLowerCase())
                    ? '✓ ' + pattern
                    : '+ ' + pattern}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="blocked-list-section">
          <label>Blocked ({blockedSeries.length})</label>
          {blockedSeries.length === 0 ? (
            <p className="no-blocked">No sequences blocked.</p>
          ) : (
            <ul className="blocked-list">
              {blockedSeries.map((pattern) => (
                <li key={pattern} className="blocked-item">
                  <span className="pattern-text">{pattern}</span>
                  <button
                    onClick={() => handleRemove(pattern)}
                    className="remove-btn"
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="TabFooter">
        <button onClick={handleReset} className="btn btn-danger">
          Reset
        </button>
        <div className="right-buttons">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={onClose} className="btn btn-primary">
            Save
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}

SeriesFilterPreferences.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export { SeriesFilterPreferences };
export default SeriesFilterPreferences;
