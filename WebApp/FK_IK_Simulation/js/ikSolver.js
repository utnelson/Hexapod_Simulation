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
  const P1_x = L1 * Math.cos(phi1);
  const P1_y = L1 * Math.sin(phi1);
  const P1_z = 0; // falls L1 entlang Z-Achse addiert werden muss, sonst 0

  // Relative Koordinaten für Arm-Ebene (2D)
  const x_rel = Math.sqrt((x - P1_x) ** 2 + (y - P1_y) ** 2);
  const z_rel = z - P1_z; // Höhe relativ zu J1

  let D = (x_rel ** 2 + z_rel ** 2 - L2 ** 2 - L3 ** 2) / (2 * L2 * L3);
  D = Math.min(1, Math.max(-1, D)); // Clamp

  // Es gibt 2 Lösungen je nachdem ob Phi3 -/+ 
  const phi3 = - Math.acos(D);

  const phi2 =
    (Math.atan2(z_rel, x_rel) -
      Math.atan2(L3 * Math.sin(phi3), L2 + L3 * Math.cos(phi3)));


  phi1IK.textContent = rad2deg(phi1).toFixed(2);
  phi2IK.textContent = rad2deg(-phi2).toFixed(2);
  phi3IK.textContent = rad2deg(phi3).toFixed(2);

  const phi1Offset = rad2deg(phi1);
  const phi2Offset = OFFSET_SERVO - rad2deg(-phi2);
  const phi3Offset = OFFSET_SERVO2 - rad2deg(phi3);

  phi1Servo.textContent = rad2deg(phi1).toFixed(2);
  phi2Servo.textContent = phi2Offset.toFixed(2);
  phi3Servo.textContent = phi3Offset.toFixed(2);
  ["phi1Servo", "phi2Servo", "phi3Servo"].forEach(checkValue);
  return {phi1Offset, phi2Offset, phi3Offset}
}

function checkValue(id) {
  const el = document.getElementById(id);
  const value = parseFloat(el.textContent);

  if (value < 0 || value > 180) {
    el.style.color = "red";   // rot markieren
  } else {
    el.style.color = "black"; // Standardfarbe
  }
}


function updateP3() {
  const L1 = parseFloat(lengthInputL1.value);
  const L2 = parseFloat(lengthInput.value);
  const L3 = parseFloat(lengthInput2.value);

  const phi1 = parseFloat(angleSliderL1.value);
  const phi2 = parseFloat(angleSlider.value);
  const phi3 = parseFloat(angleSlider2.value);

  const T1 = dhMatrix(phi1, 0, L1, 90);
  const T2 = dhMatrix(-phi2, 0, L2, 0);
  const T3 = dhMatrix(phi3, 0, L3, 0);

  const T03 = matMul(matMul(T1, T2), T3);
  const P3 = getPos(T03);

  ikX.value = P3[0].toFixed(2);
  ikY.value = P3[1].toFixed(2);
  ikZ.value = P3[2].toFixed(2);

  solveIKDebug();
}
