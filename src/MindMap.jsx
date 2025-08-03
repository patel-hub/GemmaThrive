import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Fade,
  CircularProgress,
  Button,
  Tooltip,
  TextField,
  Alert
} from "@mui/material";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import MindMapVisual from "./MindMapVisual";
import GemmaExplanationBox from "./GemmaExplanationBox";

// Pastel palettes
const COLUMN_COLORS = ["#F5E8DD", "#E3F4F4", "#FFE6E6", "#F9FBE7", "#FFF7E6"];
const CARD_COLORS = ["#FFF6E0", "#E6FFFB", "#FFE1E1", "#F3FFE3", "#FFFAE6"];

// --- Live backend API call (expects Flask endpoint /explain_idea) ---
async function fetchGemmaExplanation(idea, context) {
  try {
    const res = await fetch("http://localhost:5003/explain_idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, context }),
    });
    const data = await res.json();
    // Handle both { explanation: "..."} and just "..." responses
    if (typeof data === "object" && data !== null) {
      if (data.explanation) return data.explanation;
      // Sometimes, LLMs may return a stringified dict—try to parse
      try {
        const parsed = JSON.parse(data);
        if (parsed.explanation) return parsed.explanation;
      } catch {}
      return JSON.stringify(data);
    }
    if (typeof data === "string") return data;
    return "Sorry, no explanation available.";
  } catch (err) {
    return "Sorry, failed to fetch Gemma's explanation.";
  }
}

export default function MindMap() {
  const [idea, setIdea] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // For Gemma explanation box
  const [selected, setSelected] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState("");

  const handleGenerate = async () => {
    setError("");
    setResponse(null);
    setLoading(true);
    setShowMap(false);
    setSelected(null);
    setExplanation("");
    setExplaining(false);
    try {
      const res = await fetch("http://localhost:5003/generate_mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: idea }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.error) {
        setError(data.error);
      } else {
        setResponse(data.response);
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to fetch from server.");
    }
  };

  // Handle click on any sticky note (sub-idea)
  const handleStickyClick = async (item, context) => {
    setSelected(item);
    setExplanation("");
    setExplaining(true);
    const text = await fetchGemmaExplanation(
      typeof item === "string" ? item : JSON.stringify(item),
      context
    );
    setExplanation(text);
    setExplaining(false);
  };

  const handleClear = () => {
    setSelected(null);
    setExplanation("");
    setExplaining(false);
  };

  // --------- Card/List View with Sticky Notes and Explain Box -------------
  function renderCardView(res) {
    if (!res || !res.sections) return null;
    return (
      <>
        <Grid container spacing={3} alignItems="flex-start" justifyContent="center">
          {res.sections.map((section, idx) => (
            <Grid key={idx} item xs={12} sm={10} md={7} lg={6} xl={5}>
              <Paper
                elevation={4}
                sx={{
                  background: COLUMN_COLORS[idx % COLUMN_COLORS.length],
                  borderRadius: 5,
                  p: 2.5,
                  minHeight: 200,
                  mb: 2,
                  mt: 3,
                  boxShadow: "0 2px 16px 0 #ececec",
                  border: "1.5px solid #ececec",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <Typography
                  fontWeight="bold"
                  fontSize={28}
                  sx={{ color: "#432974", mb: 1, textAlign: "center" }}
                >
                  {section.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "#7c7c7c", mb: 2, textAlign: "center" }}
                >
                  {section.description}
                </Typography>
                <Box width="100%" display="flex" flexDirection="column" gap={1}>
                  {(section.items || []).map((item, i) => (
                    <Tooltip
                      title="Click to let Gemma explain it further"
                      arrow
                      key={i}
                      placement="top"
                      enterDelay={200}
                    >
                      <Paper
                        elevation={2}
                        onClick={() => handleStickyClick(item, `${res.title}: ${section.title}`)}
                        sx={{
                          px: 2,
                          py: 1.2,
                          borderRadius: 3,
                          mb: 1,
                          fontWeight: 600,
                          fontSize: 20,
                          letterSpacing: "0.5px",
                          background: selected === item
                            ? "#ede5fd"
                            : CARD_COLORS[idx % CARD_COLORS.length],
                          color: "#432974",
                          cursor: "pointer",
                          boxShadow: selected === item
                            ? "0 3px 16px 0 #c6c1ed"
                            : "2px 4px 8px #e8e3e1",
                          transition: "all 0.15s cubic-bezier(.29,1.4,.37,1)",
                          "&:hover": {
                            background: "#f3f0fe",
                            transform: "translateY(-2px) scale(1.04)",
                            boxShadow: "0 6px 24px 0 #d1cdfa",
                            color: "#6a4eff",
                          },
                        }}
                      >
                        {typeof item === "string" ? item : JSON.stringify(item)}
                      </Paper>
                    </Tooltip>
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
        {/* Floating Gemma Explanation Box (fixed to lower right) */}
        <Fade in={!!selected || explaining}>
          <Box
            sx={{
              position: "fixed",
              right: 30,
              bottom: 30,
              zIndex: 1250,
              maxWidth: 560,
              minWidth: 340,
              boxShadow: "0 6px 44px 0 #d4c4f7",
              borderRadius: 6,
              background: "none",
              pointerEvents: selected || explaining ? "auto" : "none",
            }}
          >
            {(selected || explaining) && (
              <GemmaExplanationBox
                idea={selected}
                explanation={explanation}
                loading={explaining}
                onClear={handleClear}
              />
            )}
          </Box>
        </Fade>
      </>
    );
  }

  // --------------- Main render ------------------
  return (
    <Box p={4} sx={{ background: "#fff", minHeight: "100vh" }}>
      <Typography variant="h5" gutterBottom>
        <LightbulbIcon sx={{ verticalAlign: "middle", mr: 1 }} />
        Mind Map
      </Typography>
      <Typography variant="body1" gutterBottom>
        Let Gemma brainstorm a roadmap from your idea.
      </Typography>
      <Box display="flex" gap={2} mt={2} mb={3}>
        <Tooltip title="Tip: Be specific! e.g., 'Build an agenda for the budget cut meeting'" arrow placement="top">
          <TextField
            fullWidth
            label="What's your idea?"
            variant="outlined"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
        </Tooltip>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!idea.trim() || loading}
          sx={{ fontWeight: 600, fontSize: 17, px: 4, borderRadius: 4 }}
        >
          {loading ? "Mindmapping..." : "Generate"}
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}
      {response && !loading && (
        <>
          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="h5" sx={{ mr: 2, color: "#8848be", fontWeight: 700 }}>
              {response.title}
            </Typography>
            <Button
              variant="outlined"
              sx={{
                fontWeight: 600,
                color: "#7b4397",
                borderColor: "#b39ddb",
                ml: 1,
                px: 3,
                borderRadius: 4
              }}
              onClick={() => setShowMap((s) => !s)}
            >
              {showMap ? "Card View" : "Mind Map View"}
            </Button>
          </Box>
          <Typography variant="body1" mb={3} color="text.secondary" fontSize={20}>
            {response.summary}
          </Typography>
          {showMap
            ? <MindMapVisual response={response} onBack={() => setShowMap(false)} />
            : renderCardView(response)}
        </>
      )}
    </Box>
  );
}
