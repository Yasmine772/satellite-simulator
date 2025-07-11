// physics/OrbitMath.ts

export function radius(a: number, e: number, nu: number): number {
  return (a * (1 - e * e)) / (1 + e * Math.cos(nu));
}

export function orbitalVelocity(
  a: number,
  e: number,
  nu: number,
  G: number,
  earthMass: number
): number {
  const r = radius(a, e, nu);
  return Math.sqrt(G * earthMass * (2 / r - 1 / a));
}

export function meanMotion(a: number, G: number, earthMass: number): number {
  return Math.sqrt((G * earthMass) / Math.pow(a, 3));
}

export function trueAnomalyToEccentricAnomaly(nu: number, e: number): number {
  const cosE = (e + Math.cos(nu)) / (1 + e * Math.cos(nu));
  const sinE = (Math.sqrt(1 - e * e) * Math.sin(nu)) / (1 + e * Math.cos(nu));
  let E = Math.atan2(sinE, cosE);
  if (E < 0) E += 2 * Math.PI;
  return E;
}

export function eccentricAnomalyToMeanAnomaly(E: number, e: number): number {
  return E - e * Math.sin(E);
}

export function meanAnomalyToEccentricAnomaly(
  M: number,
  e: number,
  tolerance = 1e-6,
  maxIter = 100
): number {
  let E = M;
  for (let i = 0; i < maxIter; i++) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    const delta = f / fPrime;
    E -= delta;
    if (Math.abs(delta) < tolerance) break;
  }
  if (E < 0) E += 2 * Math.PI;
  return E;
}

export function eccentricAnomalyToTrueAnomaly(E: number, e: number): number {
  const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  let nu = Math.atan2(sinNu, cosNu);
  if (nu < 0) nu += 2 * Math.PI;
  return nu;
}
