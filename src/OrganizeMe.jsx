// src/OrganizeMe.jsx
import React, { useState, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, Button, IconButton,
  MenuItem, Select, Chip, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, List, ListItem, Tooltip, Fade
} from "@mui/material";

import Projects from "./Projects";
import Planner from "./Planner";
import MindMap from "./MindMap";


import ListAltIcon from "@mui/icons-material/ListAlt";
import FolderIcon from "@mui/icons-material/Folder";
import ScheduleIcon from "@mui/icons-material/Schedule";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Close";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import LowPriorityIcon from "@mui/icons-material/LowPriority";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";


import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";

// ------ CONSTANTS ------
const TABS = [
  { label: "Tasks", icon: <ListAltIcon /> },
  { label: "Projects", icon: <FolderIcon /> },
  { label: "Planner", icon: <ScheduleIcon /> },
  { label: "MindMap", icon: <LightbulbIcon /> }
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", icon: <LowPriorityIcon fontSize="small" /> },
  { value: "medium", label: "Medium", icon: <ArrowDropDownIcon fontSize="small" /> },
  { value: "high", label: "High", icon: <PriorityHighIcon fontSize="small" /> }
];

const STORAGE_KEY = "organizeMeTasks";
const KANBAN_STATUSES = ["todo", "in progress", "review", "done"];

function getDueStatus(dateStr) {
  if (!dateStr) return null;

  const today = new Date();
  const due = new Date(dateStr);

  // Normalize both to midnight local time
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = dueMidnight - todayMidnight;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; //  Add 1 for inclusive range

  if (diffDays > 1) return `${diffDays} days left`;
  if (diffDays === 1) return `1 day left`;
  if (diffDays === 0) return `Due today`;
  return `Overdue`;
}





function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

function prioritySort(a, b) {
  const prio = { high: 0, medium: 1, low: 2 };
  if (prio[a.priority] !== prio[b.priority]) {
    return prio[a.priority] - prio[b.priority];
  }
  // If priorities are equal, sort by dueDate (earlier first, empty last)
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  return 0;
}

// ------ MAIN COMPONENT ------
export default function OrganizeMe({ goBack }) {
  // Task & UI state
  const [tab, setTab] = useState(0);
  const [tasks, setTasks] = useState(undefined);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newStatus, setNewStatus] = useState("todo");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("todo");

  // --- GEMMA Modal State (just-in-time, not saved) ---
  const [gemmaModalOpen, setGemmaModalOpen] = useState(false);
  const [gemmaModalTaskId, setGemmaModalTaskId] = useState(null);
  const [gemmaSteps, setGemmaSteps] = useState([]);
  const [gemmaLoading, setGemmaLoading] = useState(false);
  const [gemmaError, setGemmaError] = useState("");

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("organizeMeProjects");
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem("organizeMeProjects", JSON.stringify(projects));
  }, [projects]);
  

  // ---- Load/save tasks in localStorage ----
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setTasks(JSON.parse(saved));
    else setTasks([]);
  }, []);

  useEffect(() => {
    if (tasks !== undefined) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  // ------ GEMMA: Fetch Steps ------
  const fetchGemmaSteps = async (taskText) => {
    setGemmaLoading(true);
    setGemmaError("");
    try {
      const res = await fetch("http://localhost:5003/gemma_steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskText })
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

  // ------ CRUD Handlers ------
  const handleAddTask = () => {
    if (!newTask.trim() || tasks === undefined) return;
    const newItem = {
      id: Date.now(),
      text: newTask.trim(),
      priority: newPriority,
      dueDate: newDueDate,
      status: newStatus,
      done: false
    };
    setTasks([...tasks, newItem]);
    setNewTask("");
    setNewPriority("medium");
    setNewDueDate("");
    setNewStatus("todo");
  };

  const handleEditStart = task => {
    setEditingId(task.id);
    setEditText(task.text);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate);
    setEditStatus(task.status);
  };

  const handleEditSave = id => {
    setTasks(tasks.map(t =>
      t.id === id
        ? { ...t, text: editText.trim(), priority: editPriority, dueDate: editDueDate, status: editStatus }
        : t
    ));
    setEditingId(null);
    setEditText("");
    setEditPriority("medium");
    setEditDueDate("");
    setEditStatus("todo");
  };

  const handleEditCancel = () => setEditingId(null);

  const handleDelete = id => setTasks(tasks.filter(t => t.id !== id));

  // --- DRAG & DROP ---
  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    let updated = Array.from(tasks);
    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;
    const srcTasks = updated.filter(t => t.status === sourceStatus).sort(prioritySort);
    const dstTasks = updated.filter(t => t.status === destStatus).sort(prioritySort);
    const sourceTaskIds = srcTasks.map(t => t.id);
    const taskId = sourceTaskIds[source.index];
    let movingTask = updated.find(t => t.id === taskId);
    updated = updated.filter(t => t.id !== taskId);
    movingTask = { ...movingTask, status: destStatus };
    const dstTaskIds = dstTasks.map(t => t.id);
    const beforeId = dstTaskIds[destination.index];
    const insertIdx = beforeId
      ? updated.findIndex(t => t.id === beforeId)
      : updated.length;
    updated.splice(insertIdx, 0, movingTask);
    setTasks(updated);
  };

  // ------ Render Task Card ------
  const renderTaskCard = (task, index) => {
    const isEditing = editingId === task.id;
    const priorityColorMap = {
      high: "#fff3f0",
      medium: "#eaf4ff",
      low: "#f4fbef"
    };
    const priorityTextColor = {
      high: "#c53d27",
      medium: "#1976d2",
      low: "#328236"
    };
    const background = isEditing ? priorityColorMap[editPriority] : priorityColorMap[task.priority];
    const textColor = isEditing ? priorityTextColor[editPriority] : priorityTextColor[task.priority];

    return (
      <Box
        key={task.id}
        sx={{
          mb: 2,
          p: 2,
          pt: 4,
          bgcolor: background,
          color: textColor,
          borderRadius: "12px",
          boxShadow: "4px 6px 15px rgba(0,0,0,0.12)",
          position: "relative",
          transition: "transform 0.18s cubic-bezier(.35,1.43,.6,1.13), box-shadow 0.15s",
          "&:hover": {
            transform: !isEditing && "scale(1.035)",
            boxShadow: !isEditing && "0 8px 32px 0 rgba(31, 47, 70, 0.13)"
          },
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        {/* Drag Handle Icon */}
        {!isEditing && (
          <DragIndicatorIcon
            fontSize="small"
            sx={{
              position: "absolute",
              top: 9,
              left: 12,
              color: "#b6bfc8",
              opacity: 0.72,
              cursor: "grab",
              transition: "color 0.2s",
              "&:hover": { color: "#1976d2" },
              zIndex: 2
            }}
            titleAccess="Drag to reorder"
          />
        )}

        <Box sx={{ flex: 1 }}>
          {/* Gemma Assist Button ONLY */}
          {!isEditing && (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 1 }}>
              <Tooltip title="Break this down with Gemma" arrow placement="top">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => {
                    setGemmaModalOpen(true);
                    setGemmaModalTaskId(task.id);
                    setGemmaSteps([]);
                    fetchGemmaSteps(task.text);
                  }}
                  sx={{
                    background: "#fffbe6",
                    boxShadow: "0 0 0 0 rgba(252, 230, 116, 0)",
                    transition: "transform 0.13s, box-shadow 0.13s",
                    "&:hover": {
                      background: "#ffe082",
                      transform: "scale(1.18)",
                      boxShadow: "0 0 18px 3px #ffe08255"
                    }
                  }}
                  title="Let Gemma break this task down!"
                >
                  <LightbulbIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {isEditing ? (
            <>
              {/* 📝 Edit Mode */}
              <TextField
                size="small"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                fullWidth
                sx={{ mb: 1, textTransform: "capitalize" }}
              />
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <Select
                  size="small"
                  value={editPriority}
                  onChange={e => setEditPriority(e.target.value)}
                  sx={{ minWidth: 100 }}
                >
                  {PRIORITY_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  size="small"
                  type="date"
                  value={editDueDate}
                  onChange={e => setEditDueDate(e.target.value)}
                  inputProps={{ min: new Date().toLocaleDateString("en-CA") }}
                  sx={{ minWidth: 120 }}
                />
                <Select
                  size="small"
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value="todo">TODO</MenuItem>
                  <MenuItem value="in progress">IN PROGRESS</MenuItem>
                  <MenuItem value="review">REVIEW</MenuItem>
                  <MenuItem value="done">DONE</MenuItem>
                </Select>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <IconButton onClick={() => handleEditSave(task.id)} size="small" color="success"
                  sx={{
                    transition: "box-shadow 0.15s, background 0.15s",
                    "&:hover": {
                      bgcolor: "#e0f7fa",
                      boxShadow: "0 0 0 2px #80deea"
                    }
                  }}>
                  <SaveIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={handleEditCancel} size="small" color="error"
                  sx={{
                    transition: "box-shadow 0.15s, background 0.15s",
                    "&:hover": {
                      bgcolor: "#ffebee",
                      boxShadow: "0 0 0 2px #ef9a9a"
                    }
                  }}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Box>
            </>
          ) : (
            <>
              <Typography sx={{
                fontWeight: 600,
                textAlign: "center",
                mb: 1,
                textTransform: "capitalize",
                letterSpacing: "0.01em"
              }}>
                {capitalizeWords(task.text)}
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  size="small"
                  sx={{
                    backgroundColor: "#ffffffaa",
                    color: textColor,
                    fontWeight: 500
                  }}
                />
                {task.dueDate && (
                  <Tooltip title={`Due: ${task.dueDate}`} arrow placement="top">
                    <IconButton
                      size="small"
                      sx={{
                        color: "#a7a7a7",
                        p: 0.5,
                        ml: 0.5,
                        verticalAlign: "middle",
                        '&:hover': { color: "#1976d2", background: "#eaf4ff" }
                      }}
                    >
                      <CalendarMonthIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>                 
                )}

                {task.dueDate && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      display: "block",
                      textAlign: "center",
                      fontWeight: 500,
                      color: getDueStatus(task.dueDate) === "Overdue" ? "#c62828" : "#4d4d4d"
                    }}
                  >
                    {getDueStatus(task.dueDate)}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  display: "flex",
                  gap: 0.5
                }}
              >
                <IconButton onClick={() => handleEditStart(task)} size="small" color="primary"
                  sx={{
                    transition: "box-shadow 0.15s, background 0.15s",
                    "&:hover": {
                      bgcolor: "#e3f0fd",
                      boxShadow: "0 0 0 2px #1976d2"
                    }
                  }}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={() => handleDelete(task.id)} size="small"
                  sx={{
                    transition: "box-shadow 0.15s, background 0.15s",
                    "&:hover": {
                      bgcolor: "#ffecec",
                      boxShadow: "0 0 0 2px #c62828"
                    }
                  }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </>
          )}
        </Box>
      </Box>
    );
  };

  // ------ Render loading state if not loaded ------
  if (tasks === undefined) {
    return (
      <Paper sx={{ p: 4, borderRadius: 4, maxWidth: 700, mx: "auto", mt: 8 }}>
        <Typography align="center">Loading your tasks...</Typography>
      </Paper>
    );
  }

  function generateSchedule(tasks, projects) {
  const map = {};
  const soloColor = "#009688"; // teal for solo tasks

  // Solo tasks
  for (const t of tasks || []) {
    if (t.dueDate && t.status !== "done") {
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push({
        text: t.text,
        type: "solo",
        priority: t.priority,
        color: soloColor
      });
    }
  }

  // Project subtasks
  for (const proj of projects || []) {
    for (const sub of proj.tasks || []) {
      if (sub.dueDate && sub.status !== "done") {
        if (!map[sub.dueDate]) map[sub.dueDate] = [];
        map[sub.dueDate].push({
          text: sub.text,
          type: "project",
          project: proj.name,
          color: proj.color || "#FFD36E"
        });
      }
    }
  }

  return map;
}



  // ------ RENDER ------
  return (
    <Paper sx={{ p: 4, borderRadius: 4, width: "95vw",
      maxWidth: "1400px", mx: "auto", mt: 6 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <ListAltIcon sx={{ fontSize: 34, mr: 1, color: "#222" }} />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            fontFamily: "Montserrat, sans-serif",
            color: "#222", // Pure black, or try "#222" for soft-black
            textShadow: "0 1px 4px #f2f2f2"
          }}
        >
          Organize Me
        </Typography>
      </Box>


      <Tabs
        value={tab}
        onChange={(_, val) => setTab(val)}
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            fontWeight: 700,
            borderRadius: 2,
            mx: 0.5,
            px: 3,
            py: 1,
            minHeight: 44,
            minWidth: 110,
            color: "#1976d2",
            fontSize: "1.07rem",
            background: "none",
            transition: "all 0.18s cubic-bezier(.59,1.33,.51,1.16)",
            boxShadow: "none",
            '&:hover': {
              background: "rgba(76, 155, 255, 0.07)",
              color: "#1565C0"
            }
          },
          '& .Mui-selected': {
            color: "#1976d2 !important",
            background: "linear-gradient(90deg, #eaf4ff 80%, #f4fcfa 100%)",
            boxShadow: "0 4px 24px 0 rgba(31,47,70,0.08)",
            border: "1.5px solid #b7d6f7",
          }
        }}
      >
        {TABS.map((t, i) => (
          <Tab
            key={t.label}
            label={t.label}
            icon={React.cloneElement(t.icon, {
              style: { fontSize: 26, verticalAlign: "middle" }
            })}
            iconPosition="start"
          />
        ))}
      </Tabs>



      {tab === 0 && (
        <>
          {/* Add Task Section */}
          <Paper sx={{ p: 3, bgcolor: "#f8fafc", borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Add a New Task</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="What do you want to get done?"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
              />
              <Select
                size="small"
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                size="small"
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                inputProps={{ min: new Date().toLocaleDateString("en-CA") }}
                sx={{ minWidth: 140 }}
              />
              <Select
                size="small"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="todo">TODO</MenuItem>
                <MenuItem value="in progress">IN PROGRESS</MenuItem>
                <MenuItem value="review">REVIEW</MenuItem>
                <MenuItem value="done">DONE</MenuItem>
              </Select>
              <Button variant="contained" color="inherit" onClick={handleAddTask} disabled={!newTask.trim()}>
                ADD
              </Button>
            </Box>
          </Paper>

          {/* Progress Header and Suggest Button */}
          <Box sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            px: 1
          }}>
            <Typography sx={{ fontWeight: 600 }}>
              ✅ {tasks.filter(t => t.status === "done").length} of {tasks.length} tasks complete
            </Typography>
            
          </Box>

          {/* Kanban Columns */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Box sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 3,
              mb: 4
            }}>
              {KANBAN_STATUSES.map((status) => {
                const columnTasks = tasks
                  .filter(t => t.status === status)
                  .sort(prioritySort);
                const pastel = "#f9f9f9";
                const statusColor = {
                  "todo": "#1976d2",
                  "in progress": "#f57c00",
                  "review": "#6a1b9a",
                  "done": "#2e7d32"
                }[status];

                return (
                  <Droppable droppableId={status} key={status}>
                    {(provided, snapshot) => (
                      <Paper
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        elevation={2}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: pastel,
                          minHeight: 300,
                          transition: "background 0.3s",
                          outline: snapshot.isDraggingOver ? "2px dashed #aaa" : "none"
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            color: statusColor,
                            borderBottom: `2.5px solid ${statusColor}`,
                            pb: 0.5,
                            mb: 2,
                            textAlign: "center",
                            letterSpacing: 0.5,
                            background: "linear-gradient(90deg, #fff, #f9f9f9 60%, #fff)",
                            borderRadius: 2
                          }}
                        >
                          {status === "todo"
                            ? "📝 To Do"
                            : status === "in progress"
                            ? "⏳ In Progress"
                            : status === "review"
                            ? "🕵️‍♀️ Review"
                            : "✅ Done"}
                        </Typography>

                        {columnTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                {renderTaskCard(task, index)}
                              </div>
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}
                      </Paper>
                    )}
                  </Droppable>
                );
              })}
            </Box>
          </DragDropContext>
        </>
      )}
      {tab === 1 && <Projects projects={projects} setProjects={setProjects} />}

      {tab === 2 && (
        <Planner
          tasks={tasks}
          projects={projects.filter((p) => p && p.name && Array.isArray(p.tasks))}
          schedule={generateSchedule(tasks, projects)}
        />
      )}

      {tab === 3 && (
        <MindMap />
      )}


      <Box sx={{ mt: 3, textAlign: "right" }}>
        <Button onClick={goBack} color="primary" variant="text">&larr; Back to Home</Button>
      </Box>

      {/* ------ GEMMA MODAL (Only for current session) ------ */}
      <Fade in={gemmaModalOpen}>
        <div>
        {gemmaModalOpen && (
          <Dialog open={gemmaModalOpen} onClose={() => setGemmaModalOpen(false)} maxWidth="xs" fullWidth
            TransitionComponent={Fade} transitionDuration={350}>
            <DialogTitle>Gemma's Starter Steps</DialogTitle>
            <DialogContent dividers>
              <Typography sx={{ mb: 1 }}>
                Task: <b>{tasks.find(t => t.id === gemmaModalTaskId)?.text || ""}</b>
              </Typography>
              {gemmaLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : gemmaError ? (
                <Typography color="error">{gemmaError}</Typography>
              ) : (
                <List dense>
                  {gemmaSteps.map((step, idx) => (
                    <ListItem key={idx} sx={{ px: 0, alignItems: "flex-start" }}>
                      <Typography sx={{ fontSize: "1.15em", pr: 1, lineHeight: "1.7em", color: "#1976d2" }}>•</Typography>
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
        )}
        </div>
      </Fade>
    </Paper>
  );
}
