// src/App.jsx
import SupportMe from "./SupportMe";
import OrganizeMe from "./OrganizeMe";
import React, { useState } from "react";
import {
  Box, Typography, Button, Paper, Fade
} from "@mui/material";
import ListAltIcon from '@mui/icons-material/ListAlt';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';

// Pastel palette
const MODES = [
  {
    key: "organize",
    label: "Organize Me",
    icon: <ListAltIcon sx={{ fontSize: 30 }} />,
    color: "#b4d4f6",
    textColor: "#205072"
  },
  {
    key: "support",
    label: "Support Me",
    icon: <SelfImprovementIcon sx={{ fontSize: 30 }} />,
    color: "#ffe6a7",
    textColor: "#866800"
  }
];

export default function App() {
  const [mode, setMode] = useState(null);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        overflowX: "hidden",
        bgcolor: "background.default",
        background: "linear-gradient(135deg, #f6faf8 0%, #eaf4ef 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start"
      }}
    >
      {/* Glassy Floating Header */}
      <Box
        sx={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", zIndex: 30,
          backdropFilter: "blur(8px)",
          background: "rgba(255,255,255,0.72)",
          boxShadow: "0 2px 16px 0 rgba(60,90,80,0.06)",
          height: 68,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1.5,
        }}>
          <span role="img" aria-label="leaf"
            style={{
              fontSize: 34,
              filter: "drop-shadow(0 2px 7px #c9e5c3)",
              marginRight: 5
            }}
          >🌱</span>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              fontSize: 30,
              letterSpacing: 1,
              color: "#222",
              textShadow: "0 2px 8px #c8eedb70",
              fontFamily: "Inter, Segoe UI, Arial"
            }}
          >
            GemmaThrive
          </Typography>
        </Box>
      </Box>

      {/* Home Content */}
      <Box
        sx={{
          flex: "1 0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        {/* Spacer for glass header */}
        <Box sx={{ height: 85 }} />
        {!mode && (
          <Fade in timeout={400}>
            <Paper elevation={3} sx={{
              p: { xs: 2.5, sm: 6 },
              minWidth: 320,
              maxWidth: 500,
              borderRadius: 4,
              textAlign: "center",
              mt: 6,
              mb: 2,
              boxShadow: "0 8px 36px 0 rgba(60,90,80,0.10)"
            }}>
              <Typography
                variant="h3"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1,
                  mb: 3,
                  fontSize: { xs: 28, sm: 36 },
                  mt: 2,
                }}
              >
                Welcome to <span style={{ color: "#222" }}>GemmaThrive</span>
              </Typography>
              <Typography sx={{
                mb: 4,
                color: "#666",
                fontSize: 20,
                fontWeight: 400
              }}>
                Your offline AI-powered daily wellness companion.<br />
                <span style={{ fontSize: 18, fontWeight: 400 }}>
                  Choose an area to get started:
                </span>
              </Typography>
              <Box sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                width: "100%"
              }}>
                {MODES.map(m =>
                  <Button
                    key={m.key}
                    variant="contained"
                    onClick={() => setMode(m.key)}
                    startIcon={m.icon}
                    sx={{
                      fontSize: 26,
                      fontWeight: 600,
                      borderRadius: 3.5,
                      background: m.color,
                      color: m.textColor,
                      px: 4,
                      py: 2,
                      minWidth: 300,
                      boxShadow: "0 2px 12px 0 rgba(60,60,60,0.06)",
                      transition: "all 0.18s cubic-bezier(.4,1,.7,1.3)",
                      "&:hover": {
                        background: m.color,
                        opacity: 0.93,
                        boxShadow: "0 6px 24px 0 rgba(32,80,114,0.10)"
                      }
                    }}
                  >
                    {m.label}
                  </Button>
                )}
              </Box>
              <Typography sx={{ mt: 5, fontSize: 14, color: "#b0b0b0" }}>
                All responses are private and generated <b>entirely on your device</b>.
              </Typography>
            </Paper>
          </Fade>
        )}
        {mode === "organize" && <OrganizeMe goBack={() => setMode(null)} />}
        {mode === "support" && <SupportMe goBack={() => setMode(null)} />}
      </Box>
    </Box>
  );
}
