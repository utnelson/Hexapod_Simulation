// Event-Listener für Slider & Eingaben
lengthInputL1.addEventListener("input", plotAll);
angleSliderL1.addEventListener("input", plotAll);
lengthInput.addEventListener("input", plotAll);
angleSlider.addEventListener("input", plotAll);
lengthInput2.addEventListener("input", plotAll);
angleSlider2.addEventListener("input", plotAll);

toggleWorkspace.addEventListener("change", (e) => {
  showWorkspace = e.target.checked;
  plotAll();
});

toggleAxes.addEventListener("change", (e) => {
  showAxes = e.target.checked;
  plotAll();
});

ikX.addEventListener("input", solveIKDebug);
ikY.addEventListener("input", solveIKDebug);
ikZ.addEventListener("input", solveIKDebug);

angleSliderL1.addEventListener("input", updateP3FromAngles);
angleSlider.addEventListener("input", updateP3FromAngles);
angleSlider2.addEventListener("input", updateP3FromAngles);

lengthInputL1.addEventListener("input", updateP3FromAngles);
lengthInput.addEventListener("input", updateP3FromAngles);
lengthInput2.addEventListener("input", updateP3FromAngles);

// Start
solveIKDebug();
plotAll();
