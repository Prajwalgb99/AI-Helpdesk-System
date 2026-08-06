import React from "react";

const STATUS_OPTIONS = [
  { value: "open", label: "Open", class: "open" },
  { value: "in-progress", label: "In Progress", class: "in-progress" },
  { value: "resolved", label: "Resolved", class: "resolved" }
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", class: "low" },
  { value: "medium", label: "Medium", class: "medium" },
  { value: "high", label: "High", class: "high" },
  { value: "urgent", label: "Urgent", class: "urgent" }
];

export default function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  selectedStatuses,
  setSelectedStatuses,
  selectedPriorities,
  setSelectedPriorities
}) {
  const toggleStatus = (status) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const togglePriority = (priority) => {
    if (selectedPriorities.includes(priority)) {
      setSelectedPriorities(selectedPriorities.filter((p) => p !== priority));
    } else {
      setSelectedPriorities([...selectedPriorities, priority]);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedStatuses([]);
    setSelectedPriorities([]);
  };

  const isFiltered = searchQuery || selectedStatuses.length > 0 || selectedPriorities.length > 0;

  return (
    <div className="search-filter-bar">
      {/* Search Input Container */}
      <div className="search-input-wrapper">
        <svg
          className="search-icon-svg"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search title, description, or requester..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear-btn" onClick={() => setSearchQuery("")} title="Clear search">
            &times;
          </button>
        )}
      </div>

      {/* Filters Container */}
      <div className="filter-group">
        {/* Status Multi-Select */}
        <div className="filter-section">
          <span className="filter-section-label">Status</span>
          <div className="filter-chips">
            {STATUS_OPTIONS.map((opt) => {
              const active = selectedStatuses.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`filter-chip badge-status-${opt.class} ${active ? "active" : ""}`}
                  onClick={() => toggleStatus(opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Multi-Select */}
        <div className="filter-section">
          <span className="filter-section-label">Priority</span>
          <div className="filter-chips">
            {PRIORITY_OPTIONS.map((opt) => {
              const active = selectedPriorities.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`filter-chip badge-priority-${opt.class} ${active ? "active" : ""}`}
                  onClick={() => togglePriority(opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset Button */}
        {isFiltered && (
          <button className="btn btn-ghost btn-small reset-filters-btn" onClick={clearAllFilters}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
