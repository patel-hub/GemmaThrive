import React, { useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from "@xyflow/react";
import { Box, Button, Tooltip, IconButton, Typography, Paper } from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";

// Layout generator (unchanged)
function layoutTree(root, x = 0, y = 0, xSpacing = 240, ySpacing = 150) {
  const nodes = [];
  const edges = [];
  let globalX = 0;

  function traverse(node, depth = 0, parentId = null, path = "0") {
    const id = path;
    const nodeX = globalX * xSpacing;
    const nodeY = depth * ySpacing;

    const isLeaf = !node.children || node.children.length === 0;

    nodes.push({
      id,
      data: { label: node.title, isLeaf },
      position: { x: nodeX, y: nodeY },
      draggable: true,
      style: {
        padding: 10,
        borderRadius: 12,
        fontWeight: 600,
        minWidth: 140,
        textAlign: "center",
        background: depth === 0 ? "#845ec2" : depth === 1 ? "#faae2b" : "#fff4bd",
        color: depth === 0 ? "#fff" : "#333",
        border: `2px solid ${depth === 0 ? "#6a45af" : "#ccc"}`,
        boxShadow: "0 3px 14px rgba(0,0,0,0.08)",
      }
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        animated: false,
        style: { stroke: "#a37bd0", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "#a37bd0"
        }
      });
    }

    if (node.children && node.children.length) {
      node.children.forEach((child, idx) => {
        traverse(child, depth + 1, id, `${id}-${idx}`);
      });
    } else {
      globalX++;
    }
  }

  traverse(root);
  return { nodes, edges };
}

export default function MindMapVisual({ response, onBack }) {
  const [explanation, setExplanation] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");

  const tree = useMemo(() => {
    if (!response) return null;
    const sections = response.sections || [];
    return {
      title: response.title || "Mind Map",
      children: sections.map(section => ({
        title: section.title,
        children: (section.items || []).map(item => ({
          title: typeof item === "string" ? item : JSON.stringify(item)
        }))
      }))
    };
  }, [response]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => (tree ? layoutTree(tree) : { nodes: [], edges: [] }),
    [tree]
  );

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

  const handleExplain = async (idea) => {
    setSelectedTitle(idea);
    setExplanation("Loading...");
    try {
      const res = await fetch("http://localhost:5003/explain_idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          context: response.title || "Mind Map"
        })
      });
      const data = await res.json();
      if (data.explanation) {
        setExplanation(data.explanation);
      } else {
        setExplanation("No explanation available.");
      }
    } catch (err) {
      setExplanation("Error fetching explanation.");
    }
  };

  const NodeOverlay = ({ label, id, isLeaf }) => (
    <Box sx={{ position: "relative", textAlign: "center" }}>
      <Typography variant="body2" fontWeight={600}>
        {label}
      </Typography>
      {isLeaf && (
        <Tooltip title="Gemma explains..." placement="top">
          <IconButton
            size="small"
            sx={{
              position: "absolute",
              top: -12,
              right: -12,
              backgroundColor: "#f0e4ff",
              "&:hover": { backgroundColor: "#dfc9ff" },
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
            }}
            onClick={() => handleExplain(label)}
          >
            <PsychologyIcon fontSize="small" sx={{ color: "#6a45af" }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  if (!response) return null;

  return (
    <Box sx={{ p: 2, borderRadius: 5, background: "#f8f4fe", width: "100%" }}>
      <Button
        onClick={onBack}
        sx={{ mb: 2, fontWeight: 600, background: "#e3dbfa", color: "#5636b7" }}
      >
        Back to Card View
      </Button>
      <Box sx={{ display: "flex", gap: 3 }}>
        <Box
          sx={{
            flex: 1,
            height: "80vh",
            background: "#f3eaff",
            borderRadius: 4,
            border: "1.5px solid #e5dbfb",
            boxShadow: "0 6px 28px rgba(200, 180, 250, 0.35)"
          }}
        >
          <ReactFlow
            nodes={nodes.map(n => ({
              ...n,
              data: {
                ...n.data,
                label: (
                  <NodeOverlay label={n.data.label} id={n.id} isLeaf={n.data.isLeaf} />
                )
              }
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            panOnDrag
            zoomOnScroll
            style={{ width: "100%", height: "100%", borderRadius: 8 }}
          >
            <Controls />
            <Background gap={30} color="#e4d6fb" />
          </ReactFlow>
        </Box>

        {explanation && (
          <Paper
            elevation={3}
            sx={{
              width: 320,
              background: "#fff9ff",
              borderRadius: 3,
              p: 2,
              border: "1.5px solid #e6d3fa"
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle1" fontWeight={700} color="#6a45af">
                🧠 {selectedTitle}
              </Typography>
              <Button size="small" onClick={() => setExplanation(null)}>
                Clear
              </Button>
            </Box>
            <Typography variant="body2" mt={1} whiteSpace="pre-wrap">
              {explanation}
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
