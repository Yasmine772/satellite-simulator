import * as THREE from 'three';
import { BodyType, Rigid } from 'physics/body';
import SimulatedObject from 'components/simulated-object';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import moonModelUrl from 'assets/moon.glb';

/**
 * A callback that will be called when the moon collides with another body.
 */
type DestructionListener = (moon: Moon) => void;

export default class Moon extends SimulatedObject implements Rigid {
  protected mesh: THREE.Mesh;
  static readonly defaultCollisionRadius = 1.74e6; // نصف قطر القمر بالمتر
  public collisionRadius = Moon.defaultCollisionRadius;

  private readonly destructionListeners: DestructionListener[] = [];

  constructor(mass = 7.35e22, model?: THREE.Object3D) {
    super(BodyType.Dynamic, mass, 100);

    if (model) {
      // استخدام نموذج خارجي
      this.mesh = new THREE.Mesh(); // مجرد placeholder
      this.add(model);
    } else {
      // نموذج افتراضي (كروي)
      const geometry = new THREE.SphereGeometry(Moon.defaultCollisionRadius, 32, 32);
      const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
      this.mesh = new THREE.Mesh(geometry, material);
      this.add(this.mesh);
    }
  }

  onCollision(): void {
    this.destructionListeners.forEach((listener) => listener(this));
  }

  addDestructionListener(listener: DestructionListener) {
    this.destructionListeners.push(listener);
  }

  static async spawn(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    mass = 7.35e22
  ): Promise<Moon> {
    const model = await Moon.loadModel();
    const moon = new Moon(mass, model);
    moon.position.copy(position);
    moon.velocity.copy(velocity);
    return moon;
  }

 private static async loadModel(): Promise<THREE.Object3D> {
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      moonModelUrl,
      (gltf) => {
        const model = gltf.scene;

        // الحجم الحقيقي للقمر
        const desiredRadius = 1.74e6;

        // بناءً على log الكونسول
        const modelRadius = 174e6;
        const scaleFactor = desiredRadius / modelRadius;

        model.scale.setScalar(250055);

        // تعيين خامة بسيطة لتأكيد الظهور
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshPhongMaterial({ color: 0xcccccc });
          }
        });

        resolve(model);
      },
      undefined,
      reject
    );
  });
}

}
