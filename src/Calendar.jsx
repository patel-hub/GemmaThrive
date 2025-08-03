// src/Calendar.jsx
import React, { useState } from "react";
import { Box, Typography, IconButton, Dialog, DialogTitle, DialogContent, Chip, List, ListItem, ListItemIcon } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FolderIcon from "@mui/icons-material/Folder";
import ListAltIcon from "@mui/icons-material/ListAlt"; // Add to your imports
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthDays(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getMonthName(month, year) {
  return new Date(year, month, 1).toLocaleString('default', { month: 'long' });
}

export default function Calendar({ schedule = {} }) {
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDay, setSelectedDay] = useState(null);

  const { year, month } = view;
  const monthName = getMonthName(month, year);
  const daysInMonth = getMonthDays(year, month);

  const firstDay = new Date(year, month, 1).getDay();

  const handleMonthChange = (delta) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setView({ year: newYear, month: newMonth });
  };

  // === Helper for date key in 'YYYY-MM-DD' ===
  const dateKey = (day) =>
    day
      ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : null;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  const isToday = (day) =>
    day &&
    year === today.getFullYear() &&
    month === today.getMonth() &&
    day === today.getDate();

  // --- Modal for day details ---
  const open = !!selectedDay;
  const selectedTasks = selectedDay ? (schedule[selectedDay] || []) : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton onClick={() => handleMonthChange(-1)} size="small">
          <ArrowBackIosIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1, textAlign: "center" }}>
          {monthName} {year}
        </Typography>
        <IconButton onClick={() => handleMonthChange(1)} size="small">
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>
      {/* Weekdays */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        textAlign: "center",
        mb: 1,
      }}>
        {WEEKDAYS.map(w =>
          <Typography key={w} sx={{ color: "#1976d2", fontWeight: 600 }}>{w}</Typography>
        )}
      </Box>
      {/* Calendar grid */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 1,
      }}>
        {cells.map((day, i) => {
          const key = dateKey(day);
          const tasks = schedule[key] || [];
          return (
            <Box
              key={i}
              sx={{
                minHeight: 56,
                bgcolor: isToday(day) ? "#0e6cfb" : "#f5f9fd",
                color: isToday(day) ? "#fff" : "#223",
                border: isToday(day) ? "2px solid #0e6cfb" : "1px solid #dde3ed",
                borderRadius: 2,
                fontWeight: isToday(day) ? 700 : 500,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                fontSize: 20,
                cursor: day && tasks.length > 0 ? "pointer" : "default",
                p: 0.7,
                transition: "all .2s"
              }}
              onClick={() => day && tasks.length > 0 && setSelectedDay(key)}
            >
              <div>{day || ""}</div>
              {tasks.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.4, mt: 0.5, flexWrap: "wrap" }}>
                  {tasks.slice(0, 4).map((task, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        width: 10, height: 10, borderRadius: "50%",
                        bgcolor: task.color || "#FFD36E",  // fallback color
                        border: "1.5px solid #fff",
                      }}
                    />
                  ))}
                  {tasks.length > 4 && (
                    <Typography sx={{ fontSize: 12, color: "#888", ml: 0.5 }}>
                      +{tasks.length - 4}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
      {/* Details Dialog */}
      <Dialog open={open} onClose={() => setSelectedDay(null)}>
        <DialogTitle>
          Tasks due on {selectedDay}
        </DialogTitle>
        <DialogContent>
          {selectedTasks.length === 0 ? (
            <Typography>No tasks due.</Typography>
          ) : (
            

            <List>
              {selectedTasks.map((task, idx) => (
                <ListItem key={idx} disablePadding sx={{ alignItems: "flex-start" }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {/* Distinguish solo vs project task */}
                    {task.type === "solo" ? (
                      <ListAltIcon sx={{ color: "#FFD36E" }} />
                    ) : (
                      <FolderIcon sx={{ color: task.color || "#FFD36E" }} />
                    )}
                  </ListItemIcon>
                  <Box>
                    {task.type === "project" && (
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#223" }}>
                        {task.project}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      {task.text}
                      </Typography>
                      {/* Show priority for solo tasks */}
                      {task.type === "solo" && task.priority && (
                        <Chip
                          label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          size="small"
                          sx={{ ml: 1, bgcolor: "#ffe082", color: "#7b5e00", fontWeight: 500, fontSize: 12 }}
                        />
                      )}
                  </Box>
                </ListItem>
              ))}
            </List>

          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
