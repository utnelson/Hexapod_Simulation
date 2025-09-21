const L1 = 26,
  L2 = 40,
  L3 = 135;

function bezierPoint(t, P0, P1, P2, P3) {
  const x =
    Math.pow(1 - t, 3) * P0[0] +
    3 * Math.pow(1 - t, 2) * t * P1[0] +
    3 * (1 - t) * Math.pow(t, 2) * P2[0] +
    Math.pow(t, 3) * P3[0];
  const y =
    Math.pow(1 - t, 3) * P0[1] +
    3 * Math.pow(1 - t, 2) * t * P1[1] +
    3 * (1 - t) * Math.pow(t, 2) * P2[1] +
    Math.pow(t, 3) * P3[1];
  const z =
    Math.pow(1 - t, 3) * P0[2] +
    3 * Math.pow(1 - t, 2) * t * P1[2] +
    3 * (1 - t) * Math.pow(t, 2) * P2[2] +
    Math.pow(t, 3) * P3[2];
  return [x, y, z];
}

function solveIKbez(x, y, z) {
  const phi1 = Math.atan2(y, x);
  const P1_x = L1 * Math.cos(phi1);
  const P1_y = L1 * Math.sin(phi1);
  const P1_z = 0;
  const x_rel = Math.sqrt((x - P1_x) ** 2 + (y - P1_y) ** 2);
  const z_rel = z - P1_z;

  let D = (x_rel ** 2 + z_rel ** 2 - L2 ** 2 - L3 ** 2) / (2 * L2 * L3);
  D = Math.min(1, Math.max(-1, D));
  const phi3 = -Math.acos(D);
  const phi2 =
    Math.atan2(z_rel, x_rel) -
    Math.atan2(L3 * Math.sin(phi3), L2 + L3 * Math.cos(phi3));

  const phi1Offset = rad2deg(phi1);
  const phi2Offset = OFFSET_SERVO - rad2deg(-phi2);
  const phi3Offset = OFFSET_SERVO2 - rad2deg(phi3);

  const reachable =
    phi1Offset >= 0 &&
    phi1Offset <= 180 &&
    phi2Offset >= 0 &&
    phi2Offset <= 180 &&
    phi3Offset >= 0 &&
    phi3Offset <= 180;

  return {
    phi1Raw: rad2deg(phi1),
    phi2Raw: rad2deg(-phi2),
    phi3Raw: rad2deg(phi3),
    phi1Offset: phi1Offset,
    phi2Offset: phi2Offset,
    phi3Offset: phi3Offset,
    reachable,
  };
}

function drawAndCheckCurve() {
  const P0 = [
    parseFloat(document.getElementById("x0").value),
    parseFloat(document.getElementById("y0").value),
    parseFloat(document.getElementById("z0").value),
  ];
  const P1 = [
    parseFloat(document.getElementById("x1").value),
    parseFloat(document.getElementById("y1").value),
    parseFloat(document.getElementById("z1").value),
  ];
  const P2 = [
    parseFloat(document.getElementById("x2").value),
    parseFloat(document.getElementById("y2").value),
    parseFloat(document.getElementById("z2").value),
  ];
  const P3 = [
    parseFloat(document.getElementById("x3").value),
    parseFloat(document.getElementById("y3").value),
    parseFloat(document.getElementById("z3").value),
  ];

  const curveX = [], curveY = [], curveZ = [], colors = [];
  const nPoints = 100;

  const tbody = document.querySelector("#debugTable tbody");
  tbody.innerHTML = "";

  // Bézier-Kurve
  for (let i = 0; i <= nPoints; i += 10) {
    const t = i / nPoints;
    const [x, y, z] = bezierPoint(t, P0, P1, P2, P3);
    const ik = solveIKbez(x, y, z);
    curveX.push(x);
    curveY.push(y);
    curveZ.push(z);
    colors.push(ik.reachable ? "green" : "red");

    const row = tbody.insertRow();
    row.insertCell(0).innerText = `B${i}`;
    row.insertCell(1).innerText = x.toFixed(2);
    row.insertCell(2).innerText = y.toFixed(2);
    row.insertCell(3).innerText = z.toFixed(2);
    row.insertCell(4).innerText = ik.phi1Raw.toFixed(2);
    row.insertCell(5).innerText = ik.phi2Raw.toFixed(2);
    row.insertCell(6).innerText = ik.phi3Raw.toFixed(2);
    row.insertCell(7).innerText = ik.phi1Offset.toFixed(2);
    row.insertCell(8).innerText = ik.phi2Offset.toFixed(2);
    row.insertCell(9).innerText = ik.phi3Offset.toFixed(2);
    row.insertCell(10).innerText = ik.reachable ? "ja" : "nein";
  }

  // Vektor P3 -> P0
  const vecX = [], vecY = [], vecZ = [], vecColors = [];
  const nVecPoints = 100;
  for (let i = 0; i <= nVecPoints; i += 10) {
    const t = i / nVecPoints;
    const x = P3[0] + t * (P0[0] - P3[0]);
    const y = P3[1] + t * (P0[1] - P3[1]);
    const z = P3[2] + t * (P0[2] - P3[2]);

    const ik = solveIKbez(x, y, z);
    vecX.push(x);
    vecY.push(y);
    vecZ.push(z);
    vecColors.push(ik.reachable ? "green" : "red");

    const row = tbody.insertRow();
    row.insertCell(0).innerText = `V${i}`;
    row.insertCell(1).innerText = x.toFixed(2);
    row.insertCell(2).innerText = y.toFixed(2);
    row.insertCell(3).innerText = z.toFixed(2);
    row.insertCell(4).innerText = ik.phi1Raw.toFixed(2);
    row.insertCell(5).innerText = ik.phi2Raw.toFixed(2);
    row.insertCell(6).innerText = ik.phi3Raw.toFixed(2);
    row.insertCell(7).innerText = ik.phi1Offset.toFixed(2);
    row.insertCell(8).innerText = ik.phi2Offset.toFixed(2);
    row.insertCell(9).innerText = ik.phi3Offset.toFixed(2);
    row.insertCell(10).innerText = ik.reachable ? "ja" : "nein";
  }

  const curveTrace = {
    x: curveX,
    y: curveY,
    z: curveZ,
    mode: "markers+lines",
    marker: { color: colors, size: 6 },
    line: { color: "blue", width: 5 },
    type: "scatter3d",
    name: "Bézier-Kurve",
  };

  const pointsTrace = {
    x: [P0[0], P1[0], P2[0], P3[0]],
    y: [P0[1], P1[1], P2[1], P3[1]],
    z: [P0[2], P1[2], P2[2], P3[2]],
    mode: "markers+text",
    marker: { color: "yellow", size: 1 },
    text: ["P0", "P1", "P2", "P3"],
    textposition: "top center",
    type: "scatter3d",
    name: "Kontrollpunkte",
  };

  const originTrace = {
    x: [0],
    y: [0],
    z: [0],
    mode: "markers+text",
    marker: { color: "green", size: 6 },
    text: ["Origin"],
    textposition: "top center",
    type: "scatter3d",
    name: "Ursprung",
  };

  const vectorTrace = {
    type: "scatter3d",
    mode: "lines+markers",
    x: vecX,
    y: vecY,
    z: vecZ,
    line: { color: "blue", width: 5 },
    marker: { size: 4, color: vecColors },
    name: "Vektor P3→P0",
  };

  Plotly.newPlot("plot", [curveTrace, pointsTrace, originTrace, vectorTrace], {
    paper_bgcolor: "lightgray",
    showlegend: false,
    margin: { l: 0, r: 0, b: 0, t: 0 },
    scene: {
      bgcolor: "lightgray",
      xaxis: { range: [-100, 100] },
      yaxis: { range: [-100, 150] },
      zaxis: { range: [-150, 0] },
      aspectmode: "data",
    },
  });
}
