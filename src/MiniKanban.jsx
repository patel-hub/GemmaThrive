// src/MiniKanban.jsx
import React, { useState } from "react";
import {
  Box, Typography, Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, List, ListItem
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function getDueStatus(dateStr) {
  if (!dateStr) return null;

  const today = new Date();
  const due = new Date(dateStr);

  // Normalize both to midnight local time
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = dueMidnight - todayMidnight;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // ✅ Add 1 for inclusive range

  if (diffDays > 1) return `${diffDays} days left`;
  if (diffDays === 1) return `1 day left`;
  if (diffDays === 0) return `Due today`;
  return `Overdue`;
}


// COLUMN STATUS CONFIG
const STATUSES = [
  { key: "todo", label: "📝 To Do", color: "#1976d2" },
  { key: "in progress", label: "⏳ In Progress", color: "#f57c00" },
  { key: "review", label: "🕵️‍♀️ Review", color: "#6a1b9a" },
  { key: "done", label: "✅ Done", color: "#2e7d32" }
];

export default function MiniKanban({
  tasks,
  onTasksChange,
  onEditTask,
  onDeleteTask,
}) {
  // --- Gemma modal for starter steps ---
  const [gemmaModalOpen, setGemmaModalOpen] = useState(false);
  const [gemmaSteps, setGemmaSteps] = useState([]);
  const [gemmaLoading, setGemmaLoading] = useState(false);
  const [gemmaError, setGemmaError] = useState("");
  const [gemmaSubtask, setGemmaSubtask] = useState(null);

  // Count tasks completed
  const total = (tasks || []).length;
  const done = (tasks || []).filter(t => t.status === "done").length;

  // Group tasks by status
  const grouped = {};
  STATUSES.forEach(s => (grouped[s.key] = []));
  (tasks || []).forEach(t => {
    const status = STATUSES.some(s => s.key === t.status) ? t.status : "todo";
    grouped[status] = grouped[status] || [];
    grouped[status].push(t);
  });

  // Drag and drop logic (same as previous)
  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    let updated = [...tasks];
    const srcTasks = grouped[source.droppableId] || [];
    const dstTasks = grouped[destination.droppableId] || [];
    const srcTaskId = srcTasks[source.index]?.id;
    if (!srcTaskId) return;
    let movingTask = updated.find(t => t.id === srcTaskId);
    if (!movingTask) return;

    updated = updated.filter(t => t.id !== srcTaskId);
    movingTask = { ...movingTask, status: destination.droppableId };

    const destTaskIds = dstTasks.map(t => t.id);
    const beforeId = destTaskIds[destination.index];
    const insertIdx = beforeId
      ? updated.findIndex(t => t.id === beforeId)
      : updated.length;
    updated.splice(insertIdx, 0, movingTask);
    onTasksChange(updated);
  };

  // --- Gemma Steps Modal logic ---
  const handleGemmaClick = async (subtask) => {
    setGemmaModalOpen(true);
    setGemmaSteps([]);
    setGemmaLoading(true);
    setGemmaError("");
    setGemmaSubtask(subtask);

    try {
      const res = await fetch("http://localhost:5003/gemma_steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: subtask.text })
      });
      const data = await res.json();
      if (data.steps && Array.isArray(data.steps)) {
        setGemmaSteps(data.steps);
      } else {
        setGemmaError("Gemma couldn't generate steps. Try again.");
      }
    } catch (err) {
      setGemmaError("Gemma couldn't generate steps. Try again.");
    }
    setGemmaLoading(false);
  };

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      {/* Progress Summary */}
      <Typography sx={{ mb: 2, fontWeight: 600, color: "#1a7b45", fontSize: 17 }}>
        ✅ {done} of {total} tasks complete
      </Typography>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 2,
        }}>
          {STATUSES.map(({ key, label, color }) => (
            <Droppable droppableId={key} key={key}>
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    p: 1.5,
                    minHeight: 320,
                    bgcolor: "#fcfcfc",
                    borderRadius: 2.5,
                    boxShadow: snapshot.isDraggingOver ? "0 0 0 3px #1976d230" : 1,
                    transition: "box-shadow 0.13s"
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 15,
                      color,
                      borderBottom: `2.5px solid ${color}`,
                      pb: 0.5,
                      mb: 1.5,
                      textAlign: "center"
                    }}
                  >
                    {label}
                  </Typography>
                  {(grouped[key] || []).map((task, idx) => (
                    <Draggable draggableId={String(task.id)} index={idx} key={task.id}>
                      {(provided, snapshot) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            mb: 1.5,
                            p: 1.2,
                            bgcolor: "#f7faff",
                            borderRadius: 2,
                            boxShadow: snapshot.isDragging
                              ? "0 8px 30px 0 #1976d238"
                              : "0 1px 7px #9ec8f113",
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            cursor: "grab",
                            transition: "transform 0.18s cubic-bezier(.35,1.43,.6,1.13), box-shadow 0.15s, border 0.13s",
                            border: snapshot.isDragging
                              ? "2.5px solid #69b7ff"
                              : "2.5px solid transparent",
                            "&:hover": {
                              transform: "scale(1.045)",
                              boxShadow: "0 10px 32px 0 rgba(31, 47, 70, 0.13)",
                              border: "2.5px solid #b7d6f7",
                              zIndex: 5,
                            },
                          }}
                        >
                          
                          <Box sx={{ pl: 1, pr: 1 }}>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                color: "#1666b1",
                                fontSize: 16,
                                mb: 0.5,
                                wordBreak: "break-word"
                              }}
                            >
                              {task.text}
                            </Typography>
                            {task.dueDate && (
                              <Tooltip title={`Due: ${task.dueDate}`} arrow>
                                <CalendarMonthIcon
                                  fontSize="small"
                                  sx={{
                                    color: "#949494",
                                    mt: 0.2,
                                    mr: 0.8,
                                    verticalAlign: "middle"
                                  }}
                                />
                              </Tooltip>
                            )}
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#a4a7ab",
                                fontWeight: 400,
                                mt: 0.5,
                                mb: -0.5
                              }}
                            >
                              {task.status
                                ? (task.status.charAt(0).toUpperCase() + task.status.slice(1))
                                : "Todo"}
                            </Typography>

                            {task.dueDate && (
                              <Typography
                                variant="caption"
                                sx={{
                                  mt: 0.5,
                                  fontWeight: 500,
                                  textAlign: "center",
                                  color: getDueStatus(task.dueDate) === "Overdue" ? "#c62828" : "#444"
                                }}
                              >
                                {getDueStatus(task.dueDate)}
                              </Typography>
                            )}

                          </Box>
                          {/* Bottom bar: Gemma, Edit, Delete */}
                          <Box sx={{
                            display: "flex",
                            gap: 0.5,
                            alignItems: "center",
                            mt: 1,
                            ml: 1,
                            mb: -1,
                            justifyContent: "flex-end",
                          }}>
                            <Tooltip title="Break this step down with Gemma" arrow>
                              <IconButton
                                size="small"
                                sx={{
                                  color: "#ffb300",
                                  background: "#fffbe6",
                                  "&:hover": {
                                    background: "#ffe082",
                                    color: "#fbc02d"
                                  }
                                }}
                                onClick={() => handleGemmaClick(task)}
                              >
                                <LightbulbIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit" arrow>
                              <IconButton
                                size="small"
                                sx={{
                                  color: "#1976d2",
                                  background: "#eaf4ff",
                                  "&:hover": {
                                    background: "#bbdefb",
                                    color: "#1254a4"
                                  }
                                }}
                                onClick={() => onEditTask(task)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete" arrow>
                              <IconButton
                                size="small"
                                sx={{
                                  color: "#c53d27",
                                  background: "#fff3f0",
                                  "&:hover": {
                                    background: "#ffe5e0",
                                    color: "#b31313"
                                  }
                                }}
                                onClick={() => onDeleteTask(task.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>
          ))}
        </Box>
      </DragDropContext>

      {/* Gemma Starter Steps Modal */}
      <Dialog open={gemmaModalOpen} onClose={() => setGemmaModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Gemma's Starter Steps</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 1 }}>
            Step: <b>{gemmaSubtask?.text || ""}</b>
          </Typography>
          {gemmaLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : gemmaError ? (
            <Typography color="error">{gemmaError}</Typography>
          ) : (
            <List dense>
              {gemmaSteps.map((step, idx) => (
                <ListItem key={idx} sx={{ px: 0, alignItems: "flex-start" }}>
                  <Typography sx={{ fontSize: "1.13em", pr: 1, lineHeight: "1.7em", color: "#1976d2" }}>•</Typography>
                  <Typography variant="body2">{step}</Typography>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGemmaModalOpen(false)} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
