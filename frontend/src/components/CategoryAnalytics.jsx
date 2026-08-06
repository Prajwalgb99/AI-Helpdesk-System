import React from "react";

const ALL_CATEGORIES = ["hardware", "software", "network", "access", "billing", "other"];

const CATEGORY_NAMES = {
  hardware: "Hardware",
  software: "Software",
  network: "Network",
  access: "Access & Security",
  billing: "Billing & Finance",
  other: "Other"
};

export default function CategoryAnalytics({ tickets = [] }) {
  const total = tickets.length;

  // Initialize counts for all predefined categories
  const counts = {
    hardware: 0,
    software: 0,
    network: 0,
    access: 0,
    billing: 0,
    other: 0
  };

  // Populate counts from tickets
  tickets.forEach((t) => {
    const cat = (t.category || "other").toLowerCase();
    if (counts.hasOwnProperty(cat)) {
      counts[cat]++;
    } else {
      counts["other"]++;
    }
  });

  // Map to structured display data
  const categoriesData = ALL_CATEGORIES.map((cat) => {
    const count = counts[cat];
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      id: cat,
      name: CATEGORY_NAMES[cat],
      count,
      percentage
    };
  });

  // Sort by ticket count in descending order, fallback to name sorting
  categoriesData.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return (
    <div className="analytics-card">
      <h3 className="analytics-title">Category Breakdown</h3>
      <div className="analytics-list">
        {categoriesData.map((item) => (
          <div key={item.id} className="analytics-item" title={`${item.name}: ${item.count} tickets (${item.percentage}%)`}>
            <div className="analytics-item-header">
              <span className="analytics-item-label">
                <span className={`category-color-dot ${item.id}`} />
                {item.name}
              </span>
              <span className="analytics-item-value">
                <span className="analytics-count">
                  {item.count} {item.count === 1 ? "ticket" : "tickets"}
                </span>
                <span className="analytics-percentage">{item.percentage}%</span>
              </span>
            </div>
            <div className="analytics-progress-track">
              <div
                className={`analytics-progress-bar ${item.id}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
