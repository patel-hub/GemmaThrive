import React from "react";
import {
  Box,
  Button,
  Typography,
  Divider,
  Fade,
  CircularProgress,
  Avatar,
} from "@mui/material";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

// You can use your own avatar image here!
const GEMMA_AVATAR =
  "https://api.dicebear.com/7.x/bottts/svg?seed=Gemma";

export default function GemmaExplanationBox({
  idea,
  explanation,
  loading,
  onClear,
}) {
  let parsed = {};
  // Try to parse explanation as JSON, fallback to string if not.
  try {
    if (explanation && explanation.trim().startsWith("{")) {
      parsed = JSON.parse(
        explanation
          .replace(/'/g, '"')
          .replace(/None/g, "null")
      );
    }
  } catch {
    parsed = {};
  }

  return (
    <Fade in={!!idea || loading}>
      <Box
        sx={{
          mt: 5,
          mx: "auto",
          maxWidth: 700,
          p: 3,
          background: "linear-gradient(135deg, #ede9fe 60%, #f7f5ff 100%)",
          borderRadius: 6,
          boxShadow: "0 2px 32px 0 #d2c2fa",
          border: "2.5px solid #ebe8fa",
          minHeight: 140,
          position: "relative",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              alt="Gemma"
              src={GEMMA_AVATAR}
              sx={{
                width: 46,
                height: 46,
                bgcolor: "#f3e8ff",
                border: "2.5px solid #a78bfa",
                boxShadow: "0 2px 8px #ede9fe",
              }}
            />
            <Box>
              <Typography
                fontWeight={700}
                fontSize={23}
                sx={{ color: "#7c3aed", textShadow: "0 1px 6px #e4dcfa" }}
              >
                {idea}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <LightbulbIcon sx={{ color: "#a78bfa", fontSize: 22 }} />
                <Typography
                  fontSize={15}
                  fontWeight={500}
                  sx={{ color: "#a78bfa", opacity: 0.85 }}
                >
                  Gemma explains...
                </Typography>
              </Box>
            </Box>
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={onClear}
            sx={{
              borderRadius: 5,
              color: "#8b5cf6",
              borderColor: "#cabcfb",
              "&:hover": { borderColor: "#7c3aed", background: "#f6edff" },
              px: 2.5,
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: 1,
            }}
          >
            CLEAR
          </Button>
        </Box>

        <Divider sx={{ mb: 2, bgcolor: "#c3b5f7" }} />

        {loading ? (
          <Box display="flex" alignItems="center" gap={2} mt={3}>
            <CircularProgress size={26} color="secondary" />
            <Typography color="text.secondary" fontSize={18}>
              Gemma is thinking...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Main explanation text */}
            <Typography fontSize={18} sx={{ color: "#38234a", mb: 2, mt: 1.5 }}>
              {parsed.explanation || explanation}
            </Typography>
            {/* Show actionable steps if present */}
            {Array.isArray(parsed.actionable_steps) && (
              <Box mt={2}>
                <Typography
                  fontWeight={600}
                  sx={{
                    color: "#a855f7",
                    mb: 1,
                    letterSpacing: 0.5,
                    fontSize: 17,
                  }}
                >
                  Next Steps:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1.2}>
                  {parsed.actionable_steps.map((step, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        px: 2.3,
                        py: 1,
                        borderRadius: 12,
                        background:
                          idx % 2
                            ? "linear-gradient(90deg, #f7e6ff, #ede9fe 80%)"
                            : "linear-gradient(90deg, #f3e8ff, #fdf6fb 80%)",
                        fontWeight: 500,
                        color: "#9333ea",
                        boxShadow: "0 2px 8px #ece8fd",
                        fontSize: 15,
                        mb: 0.5,
                        border: "1.5px solid #ece7fe",
                      }}
                    >
                      {step}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Fade>
  );
}
