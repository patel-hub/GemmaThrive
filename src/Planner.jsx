// src/Planner.jsx
import React, { useState } from "react";
import {
  Paper, Typography, Button, Box, Chip, Alert, CircularProgress
} from "@mui/material";
import SpaIcon from "@mui/icons-material/Spa";
import CelebrationIcon from "@mui/icons-material/Celebration";
import Calendar from "./Calendar";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

// Normalize a date string or Date object to YYYY-MM-DD
function toYMD(date) {
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

// Robust due status check (local time-safe)
function getDueStatus(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
  const dueMidnight = new Date(year, month - 1, day);

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = dueMidnight - todayMidnight;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return "Future";
  if (diffDays === 0) return "Due today";
  return "Overdue";
}

export default function Planner({ tasks = [], projects = [], schedule }) {
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));
  const [gemmaPlan, setGemmaPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gemmaError, setGemmaError] = useState("");
  const [showNoTasks, setShowNoTasks] = useState(false);
  const { width, height } = useWindowSize();

  const todayStr = selectedDate;
  const tasksDueToday = [];
  const overdueTasks = [];

  // Solo tasks
  for (const t of tasks || []) {
    if (!t.done && t.dueDate) {
      const status = getDueStatus(t.dueDate);
      if (status === "Due today") {
        tasksDueToday.push({ text: t.text, project: null });
      } else if (status === "Overdue") {
        overdueTasks.push(t.text);
      }
    }
  }

  // Project subtasks
  for (const proj of projects || []) {
    for (const sub of proj.tasks || []) {
      if (!sub.done && sub.dueDate) {
        const status = getDueStatus(sub.dueDate);
        if (status === "Due today") {
          tasksDueToday.push({ text: sub.text, project: proj.name });
        } else if (status === "Overdue") {
          overdueTasks.push(`[${proj.name}] ${sub.text}`);
        }
      }
    }
  }

  const handleGemmaPlanDay = async () => {
    setLoading(true);
    setGemmaError("");
    setGemmaPlan(null);

    if (tasksDueToday.length === 0 && overdueTasks.length === 0) {
      setShowNoTasks(true);
      setLoading(false);
      return;
    }

    setShowNoTasks(false);

    const payload = {
      mode: "planner_day",
      input: JSON.stringify({
        tasksDueToday,
        overdueTasks,
        today: todayStr
      })
    };

    try {
      const res = await fetch("http://localhost:5003/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      let plan = data.response;
      if (typeof plan === "string") {
        try {
          plan = JSON.parse(plan);
        } catch {
          // fallback: plain string
        }
      }
      setGemmaPlan(plan);
    } catch (err) {
      setGemmaError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  function renderGemmaPlan() {
    if (showNoTasks) {
      return (
        <Box sx={{
          mt: 3, mb: 3, bgcolor: "#eafff2", borderRadius: 4, p: { xs: 2, sm: 3 },
          boxShadow: "0 1px 4px #e3f6ea", border: "1px solid #bff5cb", maxWidth: 650,
          textAlign: "center", position: "relative", overflow: "hidden"
        }}>
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={260}
            gravity={0.20}
            initialVelocityY={13}
            run={showNoTasks}
          />
          <CelebrationIcon sx={{ fontSize: 40, color: "#24c97f", mb: 1 }} />
          <Typography variant="h5" sx={{ color: "#24c97f", fontWeight: 800, mb: 1, letterSpacing: 1 }}>
            🎉 No Tasks Due Today!
          </Typography>
          <Typography sx={{ color: "#2b8242", fontSize: 18, fontWeight: 600 }}>
            Enjoy your day off! Relax, recharge, or treat yourself—you’ve earned it!
          </Typography>
        </Box>
      );
    }

    if (!gemmaPlan) return null;

    return (
      <Box sx={{
        mt: 3,
        mb: 3,
        bgcolor: "#f5fff5",
        borderRadius: 4,
        p: { xs: 2, sm: 3 },
        boxShadow: "0 1px 4px #e3f6ea",
        border: "1px solid #e0f5e5",
        maxWidth: 650,
      }}>
        <Typography variant="subtitle1" sx={{
          display: "flex",
          alignItems: "center",
          color: "#309174",
          fontWeight: 700,
          mb: 1,
          letterSpacing: 0.5
        }}>
          <SpaIcon sx={{ mr: 1, color: "#83d6ad" }} />
          Wellness Suggestion
        </Typography>
        {gemmaPlan.wellness && (
          <Typography sx={{
            mb: 2,
            fontSize: 16,
            color: "#285E4B",
            fontWeight: 400,
          }}>
            {gemmaPlan.wellness}
          </Typography>
        )}
        {Array.isArray(gemmaPlan.plan) && gemmaPlan.plan.length > 0 && (
          <>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: "#304050",
                mb: 1,
                mt: 2,
                letterSpacing: 0.1
              }}
            >
              ✨ Today's Ideal Plan
            </Typography>
            <Box component="ol" sx={{
              pl: 3,
              mb: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1.5
            }}>
              {gemmaPlan.plan.map((step, idx) => (
                <Box key={idx} component="li" sx={{
                  fontSize: 17,
                  color: "#233",
                  lineHeight: 1.6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      component="span"
                      sx={{ fontWeight: 600, fontSize: 16, color: "#1b6858" }}
                    >
                      {step.task}
                    </Typography>
                    {step.project && (
                      <Chip
                        label={step.project + " project"}
                        size="small"
                        sx={{
                          bgcolor: "#e4f7ef",
                          color: "#278d6e",
                          fontWeight: 500,
                          fontSize: 12,
                          mx: 0.3,
                          borderRadius: 1.5
                        }}
                      />
                    )}
                  </Box>
                  {step.reason && (
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: "#769fa6",
                        ml: 0.5,
                        mt: 0.1,
                        fontStyle: "italic",
                        fontWeight: 400,
                        maxWidth: 450,
                        letterSpacing: 0.1
                      }}
                    >
                      {step.reason}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </>
        )}
        {gemmaPlan.overdue && gemmaPlan.overdue.length > 0 && (
          <Box sx={{ mt: 2, mb: 1.5 }}>
            <Alert
              severity="warning"
              sx={{
                fontSize: 15,
                bgcolor: "#fff6e5",
                color: "#b9672d",
                borderRadius: 2,
                mb: 1,
              }}
            >
              <b>⚠️ Overdue Tasks:</b>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {gemmaPlan.overdue.map((t, idx) => (
                  <li key={idx} style={{ fontWeight: 500, fontSize: 15 }}>
                    {t}
                  </li>
                ))}
              </ul>
              <Typography sx={{ fontStyle: "italic", color: "#bb4d1a" }}>
                {gemmaPlan.advice || "Consider rescheduling these to stay on track!"}
              </Typography>
            </Alert>
          </Box>
        )}
        {gemmaPlan.advice && (
          <Typography sx={{
            mt: 2,
            fontStyle: "italic",
            color: "#239b46",
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: 0.1
          }}>
            {gemmaPlan.advice}
          </Typography>
        )}
      </Box>
    );
  }

  const handleDateChange = (newDate) => {
    setSelectedDate(toYMD(newDate));
    setGemmaPlan(null);
    setShowNoTasks(false);
  };

  return (
    <Paper sx={{ p: 3, bgcolor: "#f8fbfd", borderRadius: 4, minHeight: 400 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Planner</Typography>
      <Typography sx={{ mb: 2, color: "text.secondary" }}>
        Visualize your project steps and individual tasks on a calendar!<br />
        Each day shows dots for due tasks—click a date for details.
      </Typography>
      <Button
        variant="outlined"
        onClick={handleGemmaPlanDay}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={18} /> : "LET GEMMA PLAN MY DAY"}
      </Button>
      {gemmaError && (
        <Alert severity="error" sx={{ mb: 2 }}>{gemmaError}</Alert>
      )}

      {renderGemmaPlan()}

      <Calendar
        schedule={schedule}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />
    </Paper>
  );
}
