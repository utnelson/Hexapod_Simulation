function updateVectorsDH() {
  const L1 = parseFloat(lengthInputL1.value),
    phi1 = parseFloat(angleSliderL1.value);
  angleValueL1.textContent = phi1 + "°";

  const L2 = parseFloat(lengthInput.value),
    phi2 = parseFloat(angleSlider.value);
  angleValue.textContent = phi2 + "°";

  const L3 = parseFloat(lengthInput2.value),
    phi3 = parseFloat(angleSlider2.value);
  angleValue2.textContent = phi3 + "°";

  const T1 = dhMatrix(phi1, 0, L1, 90);
  const T01 = T1;
  const T2 = dhMatrix(phi2, 0, L2, 0);
  const T02 = matMul(T01, T2);
  const T3 = dhMatrix(phi3, 0, L3, 0);
  const T03 = matMul(T02, T3);

  const J0 = [0, 0, 0],
    J1 = getPos(T01),
    J2 = getPos(T02),
    J3 = getPos(T03);
  return { J0, J1, J2, J3, T01, T02, T03 };
}
