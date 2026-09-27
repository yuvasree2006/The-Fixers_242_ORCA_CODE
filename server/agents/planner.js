/**
 * AGENT 2: Planner Agent
 * Decomposes parsed user query intent into an executable workflow DAG (Directed Acyclic Graph)
 */
export function buildExecutionPlan(intentResult) {
  const { detectedIntent, langCode } = intentResult;

  const planSteps = [
    {
      id: "agent-1",
      agentName: "Intent & Language Agent",
      role: "NLU & Script Analysis",
      status: "COMPLETED",
      description: `Detected language: [${langCode.toUpperCase()}] | Classified Intent: [${detectedIntent}]`
    },
    {
      id: "agent-2",
      agentName: "Planner Agent",
      role: "Workflow Orchestration",
      status: "COMPLETED",
      description: `Generated execution DAG with 7 downstream sub-agent tasks`
    },
    {
      id: "agent-3",
      agentName: "Marine Data Agent",
      role: "ISRO / INCOIS Remote Sensing",
      status: "PENDING",
      description: "Fetching chlorophyll-a, SST & PFZ favourability vectors"
    },
    {
      id: "agent-4",
      agentName: "Weather Intelligence Agent",
      role: "IMD Marine Weather Sync",
      status: "PENDING",
      description: "Evaluating wave height, swell period, wind velocity & cyclone flags"
    },
    {
      id: "agent-5",
      agentName: "Geospatial Reasoning Agent",
      role: "Boundary & Distance Engine",
      status: "PENDING",
      description: "Calculating Haversine nearest PFZ distance & IMBL/MPA intersection"
    },
    {
      id: "agent-6",
      agentName: "Risk Assessment Agent",
      role: "Ecosystem Safety Fusion",
      status: "PENDING",
      description: "Computing composite 0-100 venture safety score via threshold rules"
    },
    {
      id: "agent-7",
      agentName: "Route Optimization Agent",
      role: "Grid A* Pathfinder",
      status: "PENDING",
      description: "Generating safe waypoint navigation vector avoiding MPA polygons"
    },
    {
      id: "agent-8",
      agentName: "Explainability Agent",
      role: "Multilingual NLG Engine",
      status: "PENDING",
      description: "Synthesizing structured reasoning card & voice-ready response string"
    },
    {
      id: "agent-9",
      agentName: "Visualization Agent",
      role: "GeoJSON & Map Renderer",
      status: "PENDING",
      description: "Packaging map layers, PFZ pins, polyline route & danger zones"
    }
  ];

  return planSteps;
}
