function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

function rad2deg(rad){
    return (rad * 180 / Math.PI);
}

function dhMatrix(theta, d, a, alpha) {
  const ct = Math.cos(deg2rad(theta)),
    st = Math.sin(deg2rad(theta));
  const ca = Math.cos(deg2rad(alpha)),
    sa = Math.sin(deg2rad(alpha));
  return [
    [ct, -st * ca, st * sa, a * ct],
    [st, ct * ca, -ct * sa, a * st],
    [0, sa, ca, d],
    [0, 0, 0, 1],
  ];
}

function matMul(A, B) {
  const res = Array(4)
    .fill(0)
    .map(() => Array(4).fill(0));
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      for (let k = 0; k < 4; k++) res[i][j] += A[i][k] * B[k][j];
  return res;
}

function getPos(T) {
  return [T[0][3], T[1][3], T[2][3]];
}
