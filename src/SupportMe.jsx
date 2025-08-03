import React, { useState } from "react";
import Confetti from "react-confetti";
import useWindowSize from 'react-use/lib/useWindowSize';

import {
  Box, Card, Typography, Button, Chip, CardActionArea,
  TextField, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, CircularProgress, Snackbar, Alert
} from "@mui/material";
import CelebrationIcon from "@mui/icons-material/Celebration";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// horizontal step-up
import {
  Stepper, Step, StepLabel, useTheme
} from "@mui/material";


// Default built-in journals
const DEFAULT_JOURNALS = [
  {
    id: 1,
    title: "Gratitude Journal",
    description: "A daily practice to cultivate gratitude and appreciation.",
    frequency: "Daily",
    prompts: [
      "What made you feel grateful today?",
      "Who helped you recently and how?",
      "Describe a small joy from your day.",
      "What challenge taught you something positive?",
    ],
  },
  {
    id: 2,
    title: "Dream Journal",
    description: "Unlock insights from your dreams and interpret their meaning.",
    frequency: "Daily",
    prompts: [
      "Describe a recent dream in detail.",
      "What emotions did you feel in your dream?",
      "Do you notice any recurring themes or symbols?",
      "What could your dream be telling you about your waking life?",
    ],
  },
  {
    id: 3,
    title: "Relationship Check-in",
    description: "Strengthen bonds with important people in your life.",
    frequency: "Weekly",
    prompts: [
      "Who made a positive impact on you this week?",
      "What's one thing you appreciate about someone close to you?",
      "How can you support a loved one this week?",
      "Reflect on a recent meaningful conversation.",
    ],
  },
];

const PROMPT_COLORS = ["#FFE0EC", "#E1F5FE", "#FFF9C4", "#E8F5E9", "#F3E5F5", "#FFECB3"];


const JOURNAL_STEPS = ["Pick Journal", "Choose Prompt", "Write & Reflect", "Done"];

function getStepIndex(stage) {
  switch (stage) {
    case "pick": return 0;
    case "choosePrompt": return 1;
    case "prompt": return 2;
    case "result": return 3;
    default: return 0;
  }
}


export default function SupportMe({ goBack }) {
  const { width, height } = useWindowSize();

  const [journals, setJournals] = useState(() => {
    const saved = localStorage.getItem("customJournals");
    return saved ? JSON.parse(saved) : DEFAULT_JOURNALS;
  });


  const [stage, setStage] = useState("pick"); // pick, prompt, result
  const [pickedJournal, setPickedJournal] = useState(null);
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [entry, setEntry] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followUpPrompt, setFollowUpPrompt] = useState(null);
  const [gemmaGuide, setGemmaGuide] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newJournalTitle, setNewJournalTitle] = useState("");
  const [newJournalDesc, setNewJournalDesc] = useState("");
  const [newJournalFreq, setNewJournalFreq] = useState("Daily");
  const [creating, setCreating] = useState(false);
  const [createdJournal, setCreatedJournal] = useState(null);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [lastUserResponseIndex, setLastUserResponseIndex] = useState(-1);

  // Helper to reset journaling session state
const resetPromptState = () => {
  setCurrentPromptIdx(0);
  setChatHistory([]);
  setEntry("");
  setAiResult(null);
  setFollowUpPrompt(null);
  setLastUserResponseIndex(-1);
  setGemmaGuide(null);
};


  // --- JOURNAL PICKER SCREEN ---
  if (stage === "pick") {
    return (
      <Paper sx={{ p: 4, maxWidth: 540, mx: "auto", mt: 6 }}>
        <Stepper activeStep={getStepIndex(stage)} alternativeLabel sx={{ mb: 3,
    '& .MuiStepLabel-label': { fontWeight: 600 },
    '& .MuiStepIcon-root.Mui-active': { color: '#1976d2' },
    '& .MuiStepIcon-root.Mui-completed': { color: '#2e7d32' } }}>
          {JOURNAL_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
          <span role="img" aria-label="journal">📒</span> Choose Your Journal
        </Typography>
        {journals.map((journal, idx) => (
          <Card
              key={journal.id}
              sx={{
                mb: 2,
                bgcolor: PROMPT_COLORS[idx % PROMPT_COLORS.length],
                borderRadius: 2,
                boxShadow: "none",
                '&:hover': { boxShadow: 3 },
                transition: "all 0.2s ease-in-out"
              }}
            >
            <CardActionArea onClick={() => {
              setPickedJournal(journal);
              setStage("choosePrompt");
              resetPromptState();
            }}>
              <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
                <span style={{ fontSize: 32, marginRight: 14 }}>{journal.icon || "📒"}</span>
                <Box>
                  <Typography variant="h6" fontWeight={700} fontSize={18} gutterBottom>
                    <span style={{ marginRight: 6 }}>{journal.icon}</span>{journal.title}
                  </Typography>
                  <Typography fontSize={14} sx={{ opacity: 0.9 }}>
                    {journal.description}
                  </Typography>
                  <Chip label={journal.frequency} size="small" sx={{ mt: 1 }} />
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        ))}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => setCreateOpen(true)}
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              bgcolor: "#f9f9f9",
              borderColor: "#ccc",
              '&:hover': {
                bgcolor: "#ececec",
                borderColor: "#999"
              }
            }}
          >
            + Create Journal With Gemma
          </Button>

          <Button
            onClick={goBack}
            sx={{
              fontWeight: 500,
              color: "#333",
              textTransform: "none",
              '&:hover': { textDecoration: "underline" }
            }}
          >
            ← Back to Home
          </Button>
        </Box>


        {/* -- CREATE JOURNAL MODAL -- */}
        <Dialog open={createOpen} onClose={() => {
          setCreateOpen(false);
          setCreatedJournal(null);
          setNewJournalTitle("");
          setNewJournalDesc("");
        }} maxWidth="xs" fullWidth>
          <DialogTitle>Create a New Journal</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Journal Title"
              required
              value={newJournalTitle}
              onChange={e => setNewJournalTitle(e.target.value)}
              autoFocus
            />
            <TextField
              label="Description"
              value={newJournalDesc}
              onChange={e => setNewJournalDesc(e.target.value)}
              multiline
              minRows={2}
            />
            <TextField
              label="Frequency"
              select
              value={newJournalFreq}
              onChange={e => setNewJournalFreq(e.target.value)}
            >
              <MenuItem value="Daily">Daily</MenuItem>
              <MenuItem value="Weekly">Weekly</MenuItem>
              <MenuItem value="Monthly">Monthly</MenuItem>
            </TextField>
            {creating && <Box sx={{ textAlign: "center" }}><CircularProgress /></Box>}
            {createdJournal && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "#f8f8f8", borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>{createdJournal.title}</Typography>
                <Typography fontSize={14}>{createdJournal.description}</Typography>
                <Typography fontSize={13} color="text.secondary" sx={{ mt: 1 }}>{createdJournal.frequency}</Typography>
                <Typography fontWeight={600} sx={{ mt: 1 }}>Prompts:</Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {createdJournal.prompts.map((p, i) => (
                    <li key={i} style={{ fontSize: 14 }}>{p}</li>
                  ))}
                </ul>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCreateOpen(false);
              setCreatedJournal(null);
              setNewJournalTitle("");
              setNewJournalDesc("");
            }}>Cancel</Button>
            {!createdJournal ? (
              <Button
                variant="contained"
                color="primary"
                disabled={!newJournalTitle.trim() || creating}
                onClick={async () => {
                  setCreating(true);
                  setCreatedJournal(null);
                  try {
                    const res = await fetch("http://localhost:5003/create_journal", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: newJournalTitle,
                        description: newJournalDesc,
                        frequency: newJournalFreq,
                      }),
                    });
                    const data = await res.json();
                    setCreatedJournal(data);
                  } catch (err) {
                    setCreatedJournal({ title: "Error", description: "Could not create journal.", prompts: [] });
                  }
                  setCreating(false);
                }}
              >
                Create
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  setJournals(prev => {
                    const updated = [...prev, { ...createdJournal, id: Date.now() }];
                    localStorage.setItem("customJournals", JSON.stringify(updated));
                    return updated;
                  });
                  setCreateOpen(false);
                  setCreatedJournal(null);
                  setNewJournalTitle("");
                  setNewJournalDesc("");
                }}
              >
                Add to Journals
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Paper>
    );
  }

  if (stage === "choosePrompt") {
    return (
      <Paper sx={{ p: 4, maxWidth: 540, mx: "auto", mt: 6 }}>
        <Stepper activeStep={getStepIndex(stage)} alternativeLabel sx={{ mb: 3,
    '& .MuiStepLabel-label': { fontWeight: 600 },
    '& .MuiStepIcon-root.Mui-active': { color: '#1976d2' },
    '& .MuiStepIcon-root.Mui-completed': { color: '#2e7d32' } }}>
        {JOURNAL_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
        </Stepper>
        
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          size="small"
          color="primary"
          sx={{
            mb: 2,
            fontWeight: 600,
            borderRadius: 2,
            px: 2.5,
            textTransform: "none",
            bgcolor: "#f0f4ff",
            '&:hover': {
              bgcolor: "#dbe9ff",
              borderColor: "#90caf9"
            }
          }}
          onClick={() => {
            setStage("pick");
            resetPromptState();
          }}
        >
          Back to Journals
        </Button>

        
  
        <Typography variant="h5" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 26, marginRight: 10 }}>{pickedJournal.icon}</span>
          {pickedJournal.title}
        </Typography>

  
        <Typography mb={2} color="text.secondary">
          Select a prompt to begin your journal entry:
        </Typography>
  
        {pickedJournal.prompts.map((prompt, idx) => (
          <Card
            key={idx}
            sx={{
              mb: 2,
              bgcolor: PROMPT_COLORS[idx % PROMPT_COLORS.length],
              borderRadius: 2,
              boxShadow: "none",
              '&:hover': { boxShadow: 3 },
            }}
          >
            <CardActionArea
              onClick={() => {
                setCurrentPromptIdx(idx);
                setStage("prompt");
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography sx={{ fontSize: 16, fontStyle: "italic", fontWeight: 500 }}>
                  {prompt}
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Paper>
    );
  }
  

  if (stage === "prompt") {
  const promptList = pickedJournal.prompts;
  const initialPrompt = promptList[currentPromptIdx];

  const handleSend = () => {
    if (!entry.trim()) return;

    setChatHistory(prev => [
      ...prev,
      { from: "user", text: entry.trim() }
    ]);
    setEntry("");
    setLastUserResponseIndex(chatHistory.length);
  };

  const handleAskGemma = async () => {
  const userMessages = chatHistory.filter((m) => m.from === "user");
  const gemmaMessages = chatHistory.filter((m) => m.from === "gemma");

  if (userMessages.length === 0) return;

  const fullUserHistory = userMessages
    .map((m) => `User: ${m.text}`)
    .join("\n");

  const fullGemmaHistory = gemmaMessages
    .map((m) => `Gemma: ${m.text}`)
    .join("\n");

  const fullContext = `${fullUserHistory}\n${fullGemmaHistory}`.trim();

  setLoading(true);
  setChatHistory((prev) => [...prev, { from: "gemma", text: "..." }]);

  try {
    const payload = {
      mode: "journal_followup",
      input: JSON.stringify({
        entry: fullContext,
        last_prompt: initialPrompt,
        mood: "",
      }),
    };

    const res = await fetch("http://localhost:5003/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    const parsed =
      typeof data.response === "string"
        ? JSON.parse(data.response)
        : data.response;

    const cleanFollowUp = parsed?.next_prompt?.trim() || "";
    const isValid = cleanFollowUp.length > 10 && /[.?!]$/.test(cleanFollowUp);
    const finalFollowUp = isValid
      ? cleanFollowUp
      : "Would you like to keep reflecting on that?";

    setChatHistory((prev) => [
      ...prev.filter((m) => m.text !== "..."),
      { from: "gemma", text: parsed.response },
      { from: "prompt", text: finalFollowUp },
    ]);
    setLastUserResponseIndex(-1);
  } catch (e) {
    setChatHistory((prev) => prev.filter((m) => m.text !== "..."));
    setSnackMsg("Gemma couldn't generate a follow-up. Please try again.");
    setSnackOpen(true);
  }

  setLoading(false);
};


  const handleFinish = async () => {
    setLoading(true);

    const payload = {
      mode: "journal_reflect",
      input: JSON.stringify({
        prompt: initialPrompt,
        entry: chatHistory.map(m => `${m.from === "user" ? "User" : "Gemma"}: ${m.text}`).join("\n"),
        mood: "",
      }),
    };

    try {
      const res = await fetch("http://localhost:5003/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const result = typeof data.response === "string" ? JSON.parse(data.response) : data.response;

      setAiResult(result);
      setStage("result");
    } catch (e) {
      setSnackMsg("Couldn't get a meaningful reflection from Gemma. Try again.");
      setSnackOpen(true);
    }

    setLoading(false);
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 6 }}>
      <Stepper
        activeStep={getStepIndex(stage)}
        alternativeLabel
        sx={{
          mb: 3,
          '& .MuiStepLabel-label': { fontWeight: 600 },
          '& .MuiStepIcon-root.Mui-active': { color: '#1976d2' },
          '& .MuiStepIcon-root.Mui-completed': { color: '#2e7d32' }
        }}
      >
        {JOURNAL_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Button
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        size="small"
        color="primary"
        sx={{ mb: 2, fontWeight: 600 }}
        onClick={() => {
          setStage("choosePrompt");
          resetPromptState();
        }}
      >
        Back to Prompts
      </Button>

      <Typography variant="h5" fontWeight={700} mb={2}>
        {pickedJournal.icon} {pickedJournal.title}
      </Typography>

      <Box sx={{ maxHeight: "55vh", overflowY: "auto", p: 1, mb: 2 }}>
        <Box sx={{ mb: 1, bgcolor: "#fff4d3", p: 2, borderRadius: 2 }}>
          🧠 <strong>Prompt:</strong> {initialPrompt}
        </Box>

        {chatHistory.map((m, i) => (
          <Box
            key={i}
            sx={{
              bgcolor:
                m.from === "user" ? "#dcf8c6" :
                m.from === "gemma" ? "#f0e9ff" :
                "#fff4d3",
              p: 2,
              my: 1,
              borderRadius: 2,
              whiteSpace: "pre-wrap"
            }}
          >
            <strong>
              {m.from === "user" ? "You" :
              m.from === "gemma" ? "💬 Gemma" :
              "🧠 Prompt"}:
            </strong>{" "}
            {m.text}
          </Box>
        ))}
      </Box>

      <TextField
        multiline minRows={2}
        fullWidth
        value={entry}
        onChange={e => setEntry(e.target.value)}
        placeholder="Type your response here…"
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          color="success"
          disabled={loading || !entry.trim()}
          onClick={handleSend}
        >
          Send
        </Button>

        <Button
          variant="outlined"
          onClick={handleAskGemma}
          disabled={
            loading ||
            lastUserResponseIndex < chatHistory.length - 1 ||
            !chatHistory.some((m) => m.from === "user")
          }
        >
          Guide Me
        </Button>

        <Button
          variant="contained"
          color="primary"
          disabled={loading || chatHistory.length === 0}
          onClick={handleFinish}
        >
          Finish Entry
        </Button>
      </Box>

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" sx={{ fontWeight: 600 }}>{snackMsg}</Alert>
      </Snackbar>
    </Paper>
  );
}


  if (stage === "result" && aiResult) {
    return (
      <>
        <Confetti width={width} height={height} numberOfPieces={300} recycle={false} />
  
        <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 6, textAlign: "center", position: "relative" }}>
          <CelebrationIcon sx={{ color: "#faaf00", fontSize: 48, mb: 1 }} />
          <Stepper activeStep={getStepIndex(stage)} alternativeLabel sx={{ mb: 3,
            '& .MuiStepLabel-label': { fontWeight: 600 },
            '& .MuiStepIcon-root.Mui-active': { color: '#1976d2' },
            '& .MuiStepIcon-root.Mui-completed': { color: '#2e7d32' } }}>
            {JOURNAL_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
  
          <Typography variant="h4" fontWeight={700} mb={2}>
            Reflection Complete
          </Typography>
          <Typography fontStyle="italic" sx={{ mb: 3 }}>
            {aiResult.reflection}
          </Typography>
  
          {aiResult.insight && (
            <Box sx={{ mb: 2 }}>
              <Typography fontWeight={600} color="primary" gutterBottom>Insight:</Typography>
              <Typography fontStyle="italic" color="primary.main">{aiResult.insight}</Typography>
            </Box>
          )}
  
          {aiResult.tags?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {aiResult.tags.map(tag => (
                <Chip key={tag} label={tag} sx={{ mx: 0.5, bgcolor: "#e3f2fd", color: "#1565c0" }} />
              ))}
            </Box>
          )}
  
          {aiResult.quote?.text && (
            <Box sx={{ bgcolor: "#fff9e0", p: 2, mb: 2, borderRadius: 2 }}>
              <Typography fontStyle="italic" color="text.secondary">
                "{aiResult.quote.text}"
              </Typography>
              <Typography fontSize={14} color="text.secondary" sx={{ mt: 0.5 }}>
                — {aiResult.quote.author}
              </Typography>
            </Box>
          )}
  
          {aiResult.encouragement && (
            <Typography sx={{ color: "green", fontWeight: 600, mb: 3 }}>
              {aiResult.encouragement}
            </Typography>
          )}
  
          <Button variant="contained" color="primary" onClick={() => {
            setStage("pick");
            resetPromptState();
          }}>
            New Entry
          </Button>
        </Paper>
      </>
    );
  }
  

  return null;
}