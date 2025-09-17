let plotsInitialized = false;
let workspaceTrace;

// Achsen für Koordinatensysteme -> Input T
function makeAxes(T, length = 20) {
  const origin = getPos(T);
  const xAxis = [T[0][0], T[1][0], T[2][0]];
  const yAxis = [T[0][1], T[1][1], T[2][1]];
  const zAxis = [T[0][2], T[1][2], T[2][2]];
  const axisLine = (dir, color) => ({
    type: "scatter3d",
    mode: "lines",
    x: [origin[0], origin[0] + dir[0] * length],
    y: [origin[1], origin[1] + dir[1] * length],
    z: [origin[2], origin[2] + dir[2] * length],
    line: { width: 5, color: color },
    showlegend: false,
  });
  return [
    axisLine(xAxis, "green"),
    axisLine(yAxis, "blue"),
    axisLine(zAxis, "red"),
  ];
}

// Punktwolke für Bewegungsbereich
function computeWorkspace(stepDeg = 15) {
  const points = { x: [], y: [], z: [] };
  const L1 = parseFloat(lengthInputL1.value);
  const L2 = parseFloat(lengthInput.value);
  const L3 = parseFloat(lengthInput2.value);

  for (let phi1 = 0; phi1 <= 360; phi1 += stepDeg) {
    for (let phi2 = 0; phi2 <= 360; phi2 += stepDeg) {
      for (let phi3 = 0; phi3 <= 360; phi3 += stepDeg) {
        const T1 = dhMatrix(phi1, 0, L1, 90);
        const T2 = dhMatrix(phi2, 0, L2, 0);
        const T3 = dhMatrix(phi3, 0, L3, 0);
        const T02 = matMul(T1, T2);
        const T03 = matMul(T02, T3);
        const J3 = getPos(T03);
        points.x.push(J3[0]);
        points.y.push(J3[1]);
        points.z.push(J3[2]);
      }
    }
  }
  return {
    type: "scatter3d",
    mode: "markers",
    x: points.x,
    y: points.y,
    z: points.z,
    marker: { size: 2, color: "red", opacity: 0.3 },
    name: "Workspace",
  };
}

function plotAll() {
  const { J0, J1, J2, J3, T01, T02, T03 } = updateVectorsDH();

  if (!plotsInitialized) {
    workspaceTrace = computeWorkspace(15);
    plotsInitialized = true;
  }

  // 3D Plot
  const traces3D = [
    {
      type: "scatter3d",
      mode: "markers+text",
      x: [J0[0], J1[0], J2[0], J3[0]],
      y: [J0[1], J1[1], J2[1], J3[1]],
      z: [J0[2], J1[2], J2[2], J3[2]],
      marker: { size: 6, color: "black" },
      text: ["P0", "P1", "P2", "P3"],
      textposition: "top center",
      name: "Points",
    },
    {
      type: "scatter3d",
      mode: "lines",
      x: [J0[0], J1[0]],
      y: [J0[1], J1[1]],
      z: [J0[2], J1[2]],
      line: { width: 4, color: "orange" },
      name: "L1",
    },
    {
      type: "scatter3d",
      mode: "lines",
      x: [J1[0], J2[0]],
      y: [J1[1], J2[1]],
      z: [J1[2], J2[2]],
      line: { width: 4, color: "purple" },
      name: "L2",
    },
    {
      type: "scatter3d",
      mode: "lines",
      x: [J2[0], J3[0]],
      y: [J2[1], J3[1]],
      z: [J2[2], J3[2]],
      line: { width: 4, color: "yellowgreen" },
      name: "L3",
    },
    // Neuer Vektor von J0 zu J3
    {
      type: "scatter3d",
      mode: "lines",
      x: [J0[0], J3[0]],
      y: [J0[1], J3[1]],
      z: [J0[2], J3[2]],
      line: { width: 3, color: "magenta", dash: "dot" },
      name: "Endpoint",
    },
  ];

  if (showWorkspace && workspaceTrace) traces3D.unshift(workspaceTrace);
  if (showAxes) {
    const T00 = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    traces3D.push(
      ...makeAxes(T00),
      ...makeAxes(T01),
      ...makeAxes(T02),
      ...makeAxes(T03)
    );
  }

  Plotly.react("plot3d", traces3D, {
    paper_bgcolor: "lightgray",
    scene: {
      bgcolor: "lightgray",
      xaxis: { showline: false, showticklabels: false, range: X_RANGE, showgrid: false },
      yaxis: { showline: false, showticklabels: false, range: Y_RANGE, showgrid: false },
      zaxis: { showline: false, showticklabels: false, range: Z_RANGE, showgrid: false },
    },
  });

  // 2D XY Workspace
  const workspaceXY = {
    x: workspaceTrace.x,
    y: workspaceTrace.y,
    type: "scatter",
    mode: "markers",
    marker: { size: 2, color: "red", opacity: 0.3 },
    name: "Workspace",
  };

  const xyTraces = [
    {
      type: "scatter",
      mode: "lines+markers",
      x: [J0[0], J1[0]],
      y: [J0[1], J1[1]],
      line: { width: 4, color: "orange" },
      name: "L1",
    },
    {
      type: "scatter",
      mode: "lines+markers",
      x: [J1[0], J2[0]],
      y: [J1[1], J2[1]],
      line: { width: 4, color: "purple" },
      name: "L2",
    },
    {
      type: "scatter",
      mode: "lines+markers",
      x: [J2[0], J3[0]],
      y: [J2[1], J3[1]],
      line: { width: 4, color: "yellowgreen" },
      name: "L3",
    },
    // Neuer Vektor J0 → J3
    {
      type: "scatter",
      mode: "lines",
      x: [J0[0], J3[0]],
      y: [J0[1], J3[1]],
      line: { width: 2, color: "magenta", dash: "dot" },
      name: "Endpoint",
    },
  ];

  Plotly.react(
    "plotXY",
    showWorkspace ? [workspaceXY, ...xyTraces] : xyTraces,
    {
      paper_bgcolor: "lightgray",
      plot_bgcolor: "lightgray",
      xaxis: { range: X_RANGE, title: "X-Achse" },
      yaxis: { range: Y_RANGE, title: "Y-Achse" },
    }
  );

  // 2D YZ Workspace
  const workspaceYZ = {
    x: workspaceTrace.y,
    y: workspaceTrace.z,
    type: "scatter",
    mode: "markers",
    marker: { size: 2, color: "red", opacity: 0.3 },
    name: "Workspace",
  };

  const yzTraces = [
    {
      type: "scatter",
      mode: "lines+markers",
      x: [J0[1], J1[1]],
      y: [J0[2], J1[2]],
      line: { width: 4, color: "orange" },
      name: "L1",
    },
    {
      type: "scatter",
      mode: "lines+markers",
      x: [J1[1], J2[1]],
      y: [J1[2], J2[2]],
      line: { width: 4, color: "purple" },
      name: "L2",
    },
    {
      type: "scatter",
      mode: "lines+markers",
      x: [J2[1], J3[1]],
      y: [J2[2], J3[2]],
      line: { width: 4, color: "yellowgreen" },
      name: "L3",
    },
    // Neuer Vektor J0 → J3
    {
      type: "scatter",
      mode: "lines",
      x: [J0[1], J3[1]],
      y: [J0[2], J3[2]],
      line: { width: 2, color: "magenta", dash: "dot" },
      name: "Endpoint",
    },
  ];

  Plotly.react(
    "plotYZ",
    showWorkspace ? [workspaceYZ, ...yzTraces] : yzTraces,
    {
      paper_bgcolor: "lightgray",
      plot_bgcolor: "lightgray",
      xaxis: { range: Y_RANGE, title: "Y-Achse" },
      yaxis: { range: Z_RANGE, title: "Z-Achse" },
    }
  );
}

