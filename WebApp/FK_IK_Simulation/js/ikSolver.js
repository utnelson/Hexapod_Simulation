function solveIKDebug() {
  const L1 = parseFloat(lengthInputL1.value);
  const L2 = parseFloat(lengthInput.value);
  const L3 = parseFloat(lengthInput2.value);

  const x = parseFloat(ikX.value);
  const y = parseFloat(ikY.value);
  const z = parseFloat(ikZ.value);

  // Basiswinkel um Z Achse
  const phi1 = Math.atan2(y, x);

  //Verschobene Ebene definieren
  const J1_x = L1 * Math.cos(phi1);
  const J1_y = L1 * Math.sin(phi1);
  const J1_z = 0; // falls L1 entlang Z-Achse addiert werden muss, sonst 0

  // Relative Koordinaten für Arm-Ebene (2D)
  const x_rel = Math.sqrt((x - J1_x) ** 2 + (y - J1_y) ** 2);
  const z_rel = z - J1_z; // Höhe relativ zu J1

  let D = (x_rel ** 2 + z_rel ** 2 - L2 ** 2 - L3 ** 2) / (2 * L2 * L3);
  D = Math.min(1, Math.max(-1, D)); // Clamp
  // Es gibt 2 Lösungen je nachdem ob Phi3 -/+ 
  const phi3 = -Math.acos(D);

  const phi2 =
    Math.atan2(z_rel, x_rel) -
    Math.atan2(L3 * Math.sin(phi3), L2 + L3 * Math.cos(phi3));

  phi1IK.textContent = rad2deg(phi1).toFixed(2);
  phi2IK.textContent = rad2deg(phi2).toFixed(2);
  phi3IK.textContent = rad2deg(phi3).toFixed(2);
}

function updateP3FromAngles() {
  const L1 = parseFloat(lengthInputL1.value);
  const L2 = parseFloat(lengthInput.value);
  const L3 = parseFloat(lengthInput2.value);

  const phi1 = parseFloat(angleSliderL1.value);
  const phi2 = parseFloat(angleSlider.value);
  const phi3 = parseFloat(angleSlider2.value);

  const T1 = dhMatrix(phi1, 0, L1, 90);
  const T2 = dhMatrix(phi2, 0, L2, 0);
  const T3 = dhMatrix(phi3, 0, L3, 0);

  const T03 = matMul(matMul(T1, T2), T3);
  const J3 = getPos(T03);

  solveIKDebug();
}
