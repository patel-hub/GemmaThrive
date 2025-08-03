// src/ProjectTree.jsx
import React from "react";

// You can enhance these colors or shapes as you like!
const APPLE_COLORS = ["#ff5050", "#ffa940", "#62c370", "#b481d9", "#ffd700"];

function ProjectTree({ numProjects = 0 }) {
  // Limit apples to a max, so the tree doesn't get too crowded visually
  const maxApples = 7;
  const apples = Array.from({ length: Math.min(numProjects, maxApples) });

  // Pre-set apple positions (percentages for x/y in SVG)
  const APPLE_POSITIONS = [
    { x: 38, y: 32 },
    { x: 56, y: 37 },
    { x: 46, y: 22 },
    { x: 60, y: 27 },
    { x: 29, y: 40 },
    { x: 50, y: 47 },
    { x: 41, y: 28 },
  ];

  return (
    <div style={{ width: 170, minHeight: 180, position: "relative" }}>
      {/* SVG Tree */}
      <svg viewBox="0 0 100 110" width="160" height="160">
        {/* Tree trunk */}
        <rect x="43" y="65" width="14" height="35" rx="6" fill="#a3825a" />
        {/* Tree top (big circle) */}
        <ellipse cx="50" cy="40" rx="35" ry="28" fill="#6fcf97" />
        {/* Shadow oval */}
        <ellipse cx="50" cy="105" rx="28" ry="5" fill="#b7e2c1" opacity="0.4" />
        {/* Apples */}
        {apples.map((_, i) => (
          <circle
            key={i}
            cx={APPLE_POSITIONS[i % APPLE_POSITIONS.length].x}
            cy={APPLE_POSITIONS[i % APPLE_POSITIONS.length].y}
            r="3.5"
            fill={APPLE_COLORS[i % APPLE_COLORS.length]}
            stroke="#cc3333"
            strokeWidth="0.8"
          />
        ))}
      </svg>
      {/* Optional: Text below the tree */}
      <div style={{ textAlign: "center", marginTop: -16, color: "#57806c", fontWeight: 600 }}>
        {numProjects === 0
          ? "No active projects"
          : `${numProjects} active project${numProjects > 1 ? "s" : ""}`}
      </div>
    </div>
  );
}

export default ProjectTree;
