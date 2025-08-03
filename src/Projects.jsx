// src/Projects.jsx
import React, { useState } from "react";
import {
  Box, Paper, TextField, Button, IconButton, Typography, List, ListItem, ListItemIcon, ListItemText, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import MiniKanban from "./MiniKanban";
import ProjectTree from "./ProjectTree";

const FOLDER_COLORS = [
  "#5C9DFF", "#FF96CF", "#FFD36E", "#73FAC5",
  "#AFB3FF", "#FFC78E", "#00E5FF", "#8AFFC1"
];

export default function Projects({ projects, setProjects }) {
  const [newProject, setNewProject] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [gemmaLoading, setGemmaLoading] = useState(false);
  const [gemmaError, setGemmaError] = useState("");
  const [openProjectId, setOpenProjectId] = useState(null);
  const [editDesc, setEditDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  // Dialog state for project name edit
  const [projectEditDialog, setProjectEditDialog] = useState({ open: false, id: null, name: "" });

  // For manual adding tasks inside modal
  const [drawerTask, setDrawerTask] = useState("");
  const [drawerTaskDue, setDrawerTaskDue] = useState("");

  // Subtask edit dialog state
  const [subtaskEditDialog, setSubtaskEditDialog] = useState({
    open: false,
    taskId: null,
    text: "",
    dueDate: ""
  });

  // ----- ADD PROJECT MANUALLY -----
  const handleAddProject = () => {
    if (!newProject.trim() || projects === undefined) return;
    setProjects([
      ...projects,
      {
        id: Date.now(),
        name: newProject.trim(),
        color: FOLDER_COLORS[projects.length % FOLDER_COLORS.length],
        tasks: [],
        desc: newGoal || "",
        dueDate: newDueDate || ""
      }
    ]);
    setNewProject("");
    setNewGoal("");
    setNewDueDate("");
    setGemmaError("");
  };

  // ----- ADD PROJECT VIA GEMMA -----
  const handleGemmaPlan = async () => {
    setGemmaError("");
    if (!newProject.trim() || projects === undefined) return;
    if (!newDueDate) {
      setGemmaError("Please set a due date for the project before using Gemma Plan.");
      return;
    }
    setGemmaLoading(true);

    const getTodayYMD = () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const startDateStr = getTodayYMD();
    const endDateStr = newDueDate;

    const gemmaPrompt = `
Break down the project "${newProject.trim()}" into 4-8 practical, beginner-friendly subtasks.
- The project starts on ${startDateStr} and must be finished by ${endDateStr}.
- Distribute subtask due dates evenly or logically between these dates (format: YYYY-MM-DD).
- Each subtask should have a "text" and a "dueDate" field. The last subtask must be due on or before the project deadline.
- Respond only as a JSON array: [{"text": "...", "dueDate": "YYYY-MM-DD", "status": "todo"}].
Project Description: ${newGoal || "(none provided)"}.
    `.trim();

    try {
      const res = await fetch("http://localhost:5003/gemma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: gemmaPrompt })
      });
      const data = await res.json();

      let taskList = [];
      if (Array.isArray(data)) {
        taskList = data;
      }
      else if (data && Array.isArray(data.subtasks)) {
        taskList = data.subtasks;
      }
      else if (data && data.response) {
        if (Array.isArray(data.response)) {
          taskList = data.response;
        } else if (Array.isArray(data.response.subtasks)) {
          taskList = data.response.subtasks;
        } else if (typeof data.response === "string") {
          try {
            const parsed = JSON.parse(data.response);
            if (Array.isArray(parsed)) {
              taskList = parsed;
            } else if (parsed && Array.isArray(parsed.subtasks)) {
              taskList = parsed.subtasks;
            }
          } catch {
            setGemmaError("Gemma returned an invalid response. Try again or rephrase.");
            setGemmaLoading(false);
            return;
          }
        }
      }
      if (Array.isArray(taskList) && taskList.length === 1 && Array.isArray(taskList[0])) {
        taskList = taskList[0];
      }
      if (!Array.isArray(taskList) || !taskList.length ||
        !taskList.every(
          t => typeof t.text === "string" && t.text.trim() && typeof t.dueDate === "string" && t.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)
        )
      ) {
        setGemmaError("Gemma did not return valid subtasks with due dates.");
        setGemmaLoading(false);
        return;
      }
      setProjects([
        ...projects,
        {
          id: Date.now(),
          name: newProject.trim(),
          color: FOLDER_COLORS[projects.length % FOLDER_COLORS.length],
          tasks: taskList.map((t, i) => ({
            id: Date.now() + i,
            text: t.text,
            dueDate: t.dueDate,
            status: t.status || "todo",
            done: false
          })),
          desc: newGoal || "",
          dueDate: newDueDate
        }
      ]);
      setNewProject("");
      setNewGoal("");
      setNewDueDate("");
      setGemmaError("");
    } catch (err) {
      setGemmaError("Gemma could not generate steps. " + (err.message || ""));
    } finally {
      setGemmaLoading(false);
    }
  };

  // Project name edit dialog
  const handleProjectEditOpen = (proj) => {
    setProjectEditDialog({ open: true, id: proj.id, name: proj.name });
  };
  const handleProjectEditSave = () => {
    setProjects(projects.map(p =>
      p.id === projectEditDialog.id ? { ...p, name: projectEditDialog.name } : p
    ));
    setProjectEditDialog({ open: false, id: null, name: "" });
  };
  const handleProjectEditClose = () => {
    setProjectEditDialog({ open: false, id: null, name: "" });
  };

  // Delete project
  const handleDeleteProject = (id) => {
    setProjects(projects.filter(p => p.id !== id));
    if (openProjectId === id) setOpenProjectId(null);
  };

  // Open drawer/modal and sync desc
  const handleOpenModal = (id) => {
    setOpenProjectId(id);
    const proj = projects.find(p => p.id === id);
    setEditDesc(proj?.desc || "");
    setDrawerTask("");
    setDrawerTaskDue("");
  };

  // -- SUBTASKS inside MODAL (MiniKanban) --
  const openProject = projects && projects.find(p => p.id === openProjectId);

  // Manual subtask add
  const handleDrawerAddTask = () => {
    if (!drawerTask.trim() || !openProjectId) return;
    setProjects(prev =>
      prev.map(p =>
        p.id === openProjectId
          ? { ...p, tasks: [...(p.tasks || []), { id: Date.now(), text: drawerTask.trim(), done: false, dueDate: drawerTaskDue || "", status: "todo" }] }
          : p
      )
    );
    setDrawerTask("");
    setDrawerTaskDue("");
  };

  // Subtask Kanban board change
  const handleMiniKanbanChange = (newTasks) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === openProjectId
          ? { ...p, tasks: newTasks }
          : p
      )
    );
  };

  // Mark subtask done/undone
  const handleMiniKanbanToggle = (taskId) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === openProjectId
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === taskId ? { ...t, done: !t.done } : t
              )
            }
          : p
      )
    );
  };

  // Delete subtask
  const handleMiniKanbanDelete = (taskId) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === openProjectId
          ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
          : p
      )
    );
  };

  // Start subtask edit
  const handleEditTaskStart = (task) => {
    setSubtaskEditDialog({
      open: true,
      taskId: task.id,
      text: task.text,
      dueDate: task.dueDate || ""
    });
  };
  // Save subtask edit
  const handleEditTaskSave = () => {
    setProjects(prev =>
      prev.map(p =>
        p.id === openProjectId
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === subtaskEditDialog.taskId
                  ? { ...t, text: subtaskEditDialog.text, dueDate: subtaskEditDialog.dueDate }
                  : t
              )
            }
          : p
      )
    );
    setSubtaskEditDialog({ open: false, taskId: null, text: "", dueDate: "" });
  };
  // Cancel subtask edit
  const handleEditTaskCancel = () => {
    setSubtaskEditDialog({ open: false, taskId: null, text: "", dueDate: "" });
  };

  // Count incomplete subtasks
  const getPendingCount = (proj) =>
    (proj.tasks || []).filter(t => !t.done).length;

  if (projects === undefined)
    return (
      <Paper sx={{ p: 3, bgcolor: "#f8fbfd", borderRadius: 4 }}>
        <Typography variant="h6">Loading projects...</Typography>
      </Paper>
    );

  return (
    <>
      <Paper sx={{ p: 3, bgcolor: "#f8fbfd", borderRadius: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Projects</Typography>
        <Typography sx={{ mb: 2, color: "text.secondary" }}>
          Organize your big goals or multi-step tasks as projects.<br />
          Try <b>Let Gemma Plan It</b> for instant step-by-step planning!
        </Typography>


        {/* Distinct Add Project Section */}
        {/* Add Project Bar + Tree */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 4,
            mb: 3,
            flexWrap: { xs: "wrap", sm: "nowrap" }
          }}
        >
          <Box
            sx={{
              bgcolor: "#f8fafc",
              borderRadius: 3,
              boxShadow: "0 2px 12px 0 rgba(31, 47, 70, 0.05)",
              border: "1px solid #e0e6ef",
              p: { xs: 2, sm: 3 },
              flex: 1,
              minWidth: 330,
              maxWidth: 430,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "#1976d2" }}>
              Add a Project
            </Typography>
            {/* ...your TextFields & buttons go here (same as before)... */}
            <TextField
              size="small"
              label="Project Name"
              placeholder="Enter a project name"
              value={newProject}
              onChange={e => setNewProject(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddProject(); }}
              InputProps={{
                startAdornment: (
                  <FolderIcon sx={{ color: "#b0bec5", mr: 1 }} />
                )
              }}
              disabled={gemmaLoading}
              fullWidth
              sx={{ mb: 1.3 }}
            />
            <TextField
              size="small"
              label="Goal / Description"
              placeholder="What is the project about?"
              value={newGoal}
              onChange={e => setNewGoal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddProject(); }}
              disabled={gemmaLoading}
              fullWidth
              sx={{ mb: 1.3 }}
            />
            <TextField
              size="small"
              label="Due Date"
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={gemmaLoading}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="contained"
                onClick={handleAddProject}
                disabled={!newProject.trim() || gemmaLoading}
                sx={{
                  bgcolor: "#0e6cfb",
                  color: "#fff",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#1976d2" },
                  flex: 1
                }}
              >
                Add
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={gemmaLoading ? <CircularProgress size={18} /> : <AutoAwesomeIcon />}
                onClick={handleGemmaPlan}
                disabled={!newProject.trim() || gemmaLoading}
                sx={{ fontWeight: 600, minWidth: 140, flex: 1 }}
              >
                {gemmaLoading ? "Planning..." : "Let Gemma Plan It"}
              </Button>
            </Box>
          </Box>

          {/* --- PROJECT TREE --- */}
          <Box sx={{
            display: { xs: "none", sm: "block" },
            minWidth: 180,
            mt: 2
          }}>
            <ProjectTree numProjects={projects.length} />
          </Box>
        </Box>




        {gemmaError && (
          <Typography sx={{ color: "#b71c1c", mb: 1, fontWeight: 500 }}>
            {gemmaError}
          </Typography>
        )}

        {/* Projects List */}
        <List sx={{ mt: 1 }}>
          {projects.map((proj) => (
            <ListItem
              key={proj.id}
              sx={{
                bgcolor: "#fff",
                mb: 1,
                borderRadius: 3,
                boxShadow: 1,
                "&:hover": { bgcolor: "#f4f8ff", cursor: "pointer" }
              }}
              onClick={e => {
                if (
                  e.target.closest(".edit-btn") ||
                  e.target.closest(".delete-btn")
                ) return;
                handleOpenModal(proj.id);
              }}
              secondaryAction={
                <>
                  <IconButton
                    className="edit-btn"
                    onClick={e => {
                      e.stopPropagation();
                      handleProjectEditOpen(proj);
                    }}
                    size="small"
                  ><EditIcon /></IconButton>
                  <IconButton
                    className="delete-btn"
                    onClick={e => { e.stopPropagation(); handleDeleteProject(proj.id); }}
                    size="small"
                  ><DeleteIcon /></IconButton>
                </>
              }
            >
              <ListItemIcon>
                <FolderIcon
                  sx={{
                    color: proj.color,
                    bgcolor: proj.color + "22",
                    borderRadius: 1.5,
                    fontSize: 36,
                    p: 0.5,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 18, color: "#132144" }}>
                      {proj.name}
                    </Typography>
                    {proj.dueDate && (
                      <Chip
                        label={`Due: ${proj.dueDate}`}
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: "#ffe082",
                          color: "#7b5e00",
                          fontWeight: 500,
                          fontSize: 12
                        }}
                      />
                    )}
                    <Chip
                      label={getPendingCount(proj)}
                      color={getPendingCount(proj) > 0 ? "primary" : "success"}
                      size="small"
                      sx={{
                        ml: 2,
                        fontWeight: 600,
                        bgcolor: getPendingCount(proj) > 0 ? "#dbeafe" : "#e6f4ea",
                        color: getPendingCount(proj) > 0 ? "#1656c0" : "#12763a"
                      }}
                    />
                  </Box>
                }
                sx={{ ml: 1 }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* --- Project Name Edit Dialog --- */}
      <Dialog open={projectEditDialog.open} onClose={handleProjectEditClose}>
        <DialogTitle>Edit Project Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={projectEditDialog.name}
            onChange={e => setProjectEditDialog(dialog => ({ ...dialog, name: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProjectEditClose} startIcon={<CloseIcon />}>Cancel</Button>
          <Button onClick={handleProjectEditSave} variant="contained" startIcon={<SaveIcon />} disabled={!projectEditDialog.name.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Main Project MODAL (Kanban) --- */}
      <Dialog
        open={!!openProjectId}
        onClose={() => setOpenProjectId(null)}
        maxWidth="md"
        fullWidth
        scroll="body"
        PaperProps={{
          sx: {
            borderRadius: 4,
            minHeight: { xs: "98vh", sm: 600 },
            maxHeight: "98vh",
            p: 3,
            background: "#fafcff",
            boxShadow: "0 6px 48px 0 rgba(32,60,120,0.13)",
            overflowY: "auto",
            position: "relative"
          }
        }}
      >
        {openProject && (
          <Box>
            <IconButton sx={{ position: "absolute", right: 14, top: 10 }} onClick={() => setOpenProjectId(null)}>
              <CloseIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700, color: openProject.color, mb: 2, pl: 1 }}>
              <FolderIcon sx={{
                color: openProject.color,
                bgcolor: openProject.color + "22",
                borderRadius: 1.5,
                fontSize: 36,
                mr: 1,
                verticalAlign: "middle"
              }} />
              {openProject.name}
            </Typography>
            <TextField
              label="Description"
              multiline
              minRows={2}
              maxRows={5}
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              onBlur={() => setProjects(prev =>
                prev.map(p =>
                  p.id === openProjectId ? { ...p, desc: editDesc } : p
                )
              )}
              placeholder="Add a short description or goal for this project..."
            />

            {/* Manual Add Subtask */}
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                size="small"
                value={drawerTask}
                onChange={e => setDrawerTask(e.target.value)}
                placeholder="Add a project task"
                fullWidth
                onKeyDown={e => { if (e.key === "Enter") handleDrawerAddTask(); }}
              />
              <TextField
                size="small"
                type="date"
                value={drawerTaskDue}
                onChange={e => setDrawerTaskDue(e.target.value)}
                sx={{ minWidth: 120 }}
              />
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                sx={{
                  bgcolor: "#0e6cfb", color: "#fff", fontWeight: 600,
                  "&:hover": { bgcolor: "#1976d2" }
                }}
                onClick={handleDrawerAddTask}
                disabled={!drawerTask.trim()}
              >Add</Button>
            </Box>

            {/* --- MINI KANBAN --- */}
            <MiniKanban
              tasks={openProject.tasks}
              onTasksChange={handleMiniKanbanChange}
              onEditTask={handleEditTaskStart}
              onDeleteTask={handleMiniKanbanDelete}
              onToggleTask={handleMiniKanbanToggle}
            />
          </Box>
        )}
      </Dialog>

      {/* --- Subtask Edit Dialog --- */}
      <Dialog open={subtaskEditDialog.open} onClose={handleEditTaskCancel}>
        <DialogTitle>Edit Subtask</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Name"
            fullWidth
            value={subtaskEditDialog.text}
            onChange={e =>
              setSubtaskEditDialog(d => ({ ...d, text: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Due Date"
            type="date"
            fullWidth
            value={subtaskEditDialog.dueDate}
            onChange={e =>
              setSubtaskEditDialog(d => ({ ...d, dueDate: e.target.value }))
            }
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditTaskCancel} startIcon={<CloseIcon />}>Cancel</Button>
          <Button
            onClick={handleEditTaskSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!subtaskEditDialog.text.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
