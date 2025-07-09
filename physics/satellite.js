import vector from "./vector";
import World from "./world";

class Satellite {
  constructor(
    semiMajorAxis, // a
    eccentricity, // e
    initialTrueAnomaly, // ν0
    inclination, // i
    earthMass = World.earthMass,
    G = World.GravitationalConstant
  ) {
    this.a = semiMajorAxis;
    this.e = eccentricity;
    this.nu = initialTrueAnomaly;
    this.i = inclination;

    this.G = G;
    this.M = earthMass;

    this.time = 0;

    this.E = this.trueAnomalyToEccentricAnomaly(this.nu);
    this.M = this.eccentricAnomalyToMeanAnomaly(this.E);

    this.position = this.positionCartesian();
    this.velocity = this.velocityVector();
  }

  period() {
    return 2 * Math.PI * Math.sqrt(Math.pow(this.a, 3) / (this.G * this.M));
  }

  radius() {
    return (
      (this.a * (1 - Math.pow(this.e, 2))) / (1 + this.e * Math.cos(this.nu))
    );
  }

  orbitalVelocityMagnitude() {
    const r = this.radius();
    return Math.sqrt(this.G * this.M * (2 / r - 1 / this.a));
  }

  positionCartesian() {
    const r = this.radius();
    return vector.create(r * Math.cos(this.nu), r * Math.sin(this.nu));
  }

  velocityVector() {
    const r = this.radius();
    const v = this.orbitalVelocityMagnitude();
    const angle = this.nu + Math.PI / 2;
    return vector.create(v * Math.cos(angle), v * Math.sin(angle));
  }

  trueAnomalyToEccentricAnomaly(nu) {
    const e = this.e;
    const cosE = (e + Math.cos(nu)) / (1 + e * Math.cos(nu));
    const sinE = (Math.sqrt(1 - e * e) * Math.sin(nu)) / (1 + e * Math.cos(nu));
    let E = Math.atan2(sinE, cosE);
    if (E < 0) E += 2 * Math.PI;
    return E;
  }

  eccentricAnomalyToMeanAnomaly(E) {
    return E - this.e * Math.sin(E);
  }

  meanAnomalyToEccentricAnomaly(M, tolerance = 1e-6, maxIter = 100) {
    let E = M;
    for (let i = 0; i < maxIter; i++) {
      const f = E - this.e * Math.sin(E) - M;
      const fPrime = 1 - this.e * Math.cos(E);
      const delta = f / fPrime;
      E -= delta;
      if (Math.abs(delta) < tolerance) break;
    }
    if (E < 0) E += 2 * Math.PI;
    return E;
  }

  eccentricAnomalyToTrueAnomaly(E) {
    const e = this.e;
    const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
    const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
    let nu = Math.atan2(sinNu, cosNu);
    if (nu < 0) nu += 2 * Math.PI;
    return nu;
  }

  update(dTime) {
    this.time += dTime;

    const n = Math.sqrt((this.G * this.M) / Math.pow(this.a, 3));
    this.M += n * dTime;

    this.E = this.meanAnomalyToEccentricAnomaly(this.M);
    this.nu = this.eccentricAnomalyToTrueAnomaly(this.E);

    this.position = this.positionCartesian();
    this.velocity = this.velocityVector();
  }

  getPosition() {
    return this.position;
  }

  getVelocity() {
    return this.velocity;
  }
}

export default Satellite;
