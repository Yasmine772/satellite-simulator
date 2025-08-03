import * as THREE from "three";
import { satelliteModel } from "models";
import { BodyType, Rigid } from "physics/body";
import SimulatedObject from "components/simulated-object";

type DestructionListener = (satellite: Satellite) => void;

export default class Satellite extends SimulatedObject implements Rigid {
  public readonly mesh = new THREE.Mesh(
    new THREE.SphereGeometry(10, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true })
  );

  static readonly defaultCollisionRadius = 10;
  public collisionRadius = Satellite.defaultCollisionRadius;

  public isDestroyed = false; // خاصية التدمير

  private readonly destructionListeners: DestructionListener[] = [];

  private a: number;
  private e: number;
  private nu: number;
  private E: number;
  private M: number;
  private G: number;
  private earthMass: number;

  constructor(
    mass = 10,
    a = 7e6,
    e = 0.01,
    nu = 0,
    G = 6.6743e-11,
    earthMass = 5.972e24
  ) {
    super(BodyType.Dynamic, mass, 100);
    this.add(this.mesh);

    this.a = a;
    this.e = e;
    this.nu = nu;
    this.G = G;
    this.earthMass = earthMass;

    satelliteModel.then(({ scene }) => {
      const model = scene.clone(true);
      model.scale.multiplyScalar(7e4);

      this.remove(this.mesh);
      this.add(model);
    });

    this.E = this.trueToEccentric(nu, e);
    this.M = this.eccentricToMean(this.E, e);

    this.position.copy(this.positionCartesian());
    this.velocity.copy(this.velocityVector());
  }

  onCollision(): void {
    this.isDestroyed = true;
    this.destructionListeners.forEach((listener) => listener(this));
  }

  addDestructionListener(listener: DestructionListener) {
    this.destructionListeners.push(listener);
  }

  static spawn(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    mass = 10,
    a = 7e6,
    e = 0.01,
    nu = 0,
    G = 6.6743e-11,
    earthMass = 5.972e24
  ): Satellite {
    const satellite = new Satellite(mass, a, e, nu, G, earthMass);
    satellite.position.copy(position);
    satellite.velocity.copy(velocity);
    return satellite;
  }

  private trueToEccentric(nu: number, e: number) {
    const cosE = (e + Math.cos(nu)) / (1 + e * Math.cos(nu));
    const sinE = (Math.sqrt(1 - e * e) * Math.sin(nu)) / (1 + e * Math.cos(nu));
    return Math.atan2(sinE, cosE);
  }

  private eccentricToMean(E: number, e: number) {
    return E - e * Math.sin(E);
  }

  private meanToEccentric(M: number, e: number, tolerance = 1e-6): number {
    let E = M;
    for (let i = 0; i < 100; i++) {
      const f = E - e * Math.sin(E) - M;
      const fPrime = 1 - e * Math.cos(E);
      const delta = f / fPrime;
      E -= delta;
      if (Math.abs(delta) < tolerance) break;
    }
    return E;
  }

  private eccentricToTrue(E: number, e: number) {
    const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
    const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
    return Math.atan2(sinNu, cosNu);
  }

  private radius() {
    return (this.a * (1 - this.e * this.e)) / (1 + this.e * Math.cos(this.nu));
  }

  private positionCartesian() {
    const r = this.radius();
    return new THREE.Vector3(r * Math.cos(this.nu), r * Math.sin(this.nu), 0);
  }

  private velocityVector() {
    const r = this.radius();
    const v = Math.sqrt(this.G * this.earthMass * (2 / r - 1 / this.a));
    const angle = this.nu + Math.PI / 2;
    return new THREE.Vector3(v * Math.cos(angle), v * Math.sin(angle), 0);
  }

  public update(dt: number) {
    if (
      this.a === undefined ||
      this.e === undefined ||
      this.M === undefined ||
      !this.G ||
      !this.earthMass ||
      this.isDestroyed
    )
      return;

    const n = Math.sqrt((this.G * this.earthMass) / Math.pow(this.a, 3));
    this.M += n * dt;

    this.E = this.meanToEccentric(this.M, this.e);
    this.nu = this.eccentricToTrue(this.E, this.e);

    this.position.copy(this.positionCartesian());
    this.velocity.copy(this.velocityVector());

    this.mesh.position.copy(this.position);
  }

  getPosition(): THREE.Vector3 {
    return this.position;
  }
  public getOrbitInfo(): string {
    const pos = this.getPosition();
    const velocity = this.velocity;

    return `
  <b>Satellite Data:</b><br />
  <div>
  Position:
  <span style="display: inline-block; margin-left: 5px;">x=${pos.x.toFixed(2)}</span>
  <div style="margin-left: 70px;">y=${pos.y.toFixed(2)}</div>
  <div style="margin-left: 70px;">z=${pos.z.toFixed(2)}</div>
</div>

<div>
Velocity: 
<span style="display: inline-block; margin-left: 5px;">x=${velocity.x.toFixed(2)}</span>
<div style="margin-left: 64px;"> y=${velocity.y.toFixed(2)}</div>
<div style="margin-left:64px;"> z=${velocity.z.toFixed(2)}</div>
</div>
  <div>Semi-major axis : ${this.a.toExponential(3)} m</div>
  <div>Eccentricity: ${this.e.toFixed(5)}</div>
  <div>True Anomaly : ${((this.nu * 180) / Math.PI).toFixed(2)}°</div>
  <div>Mean Anomaly : ${((this.M * 180) / Math.PI).toFixed(2)}°</div>
  <div>Eccentric Anomaly : ${((this.E * 180) / Math.PI).toFixed(2)}°</div>
`;
  }
  pointTowardsEarth(target: THREE.Vector3) {
    const direction = new THREE.Vector3()
      .subVectors(target, this.mesh.position)
      .normalize();

    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, -1), // اتجاه القمر الأصلي
      direction
    );

    this.mesh.quaternion.copy(quaternion);
  }
}
