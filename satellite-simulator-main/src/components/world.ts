import * as THREE from 'three';

import SimulatedSpace from 'components/simulated-space';
import Planet from 'components/planet';
import Sun from 'components/sun';
import Moon from 'components/moon'; // استيراد القمر

import { EARTH_RADIUS } from 'physics/constants';
import GhostSatellite from 'components/ghost-satellite';
import Satellite from 'components/satellite';
import { remove as _remove } from 'lodash';
import { skyBoxTexture } from 'textures';

export type SatelliteDestructionListener = (satellite: Satellite) => void;

export default class World extends THREE.Scene {
    protected clock = new THREE.Clock();
    protected simulatedSpace = new SimulatedSpace(1e-2);

    readonly sun = new Sun();
    readonly planet = new Planet();
    readonly ghost = new GhostSatellite();

    readonly satellites: Satellite[] = [];

    moon!: Moon;
 // سيتم تحميله لاحقًا

    public paused = false;
    public timescale = 1;

    get timeResolution() {
        return this.simulatedSpace.timeResolution;
    }

    set timeResolution(value) {
        this.simulatedSpace.timeResolution = value;
    }

    onSatelliteDestruction: SatelliteDestructionListener | undefined;

    constructor() {
        super();

        this.add(new THREE.AxesHelper(EARTH_RADIUS / 10));
        this.add(new THREE.AmbientLight(0xffffff, 0.5));

        this.add(this.sun);
        this.add(this.ghost);

        this.simulatedSpace.addTo(this);
        this.simulatedSpace.add(this.planet);

        this.background = skyBoxTexture;

        this.planet.rotateY(Math.PI * -0.7);

        this.init();
    }

    /**
     * تحميل القمر (Moon) بشكل غير متزامن
     */
    async init() {
        const orbitRadius = 100.844e8; // نصف قطر المدار
        const initialPosition = new THREE.Vector3(orbitRadius, 0, 0);
        const initialVelocity = new THREE.Vector3(0, 0, 0);

        this.moon = await Moon.spawn(initialPosition, initialVelocity);
        this.simulatedSpace.add(this.moon);
        this.add(this.moon);
console.log('Moon world position:', this.moon.getWorldPosition(new THREE.Vector3()));


    }

    update() {
        if (this.paused) return;

        const dt = this.clock.getDelta() % (1 / 30) * this.timescale;

        this.simulatedSpace.run(dt);
        this.planet.update(dt);

        this.satellites.forEach((satellite) => satellite.lookAt(this.planet.position));

        if (this.moon) {
            // تحديث موقع القمر ليحركه حول الأرض
            const orbitalPeriod = 27.3 * 24 * 3600; // فترة القمر بالثواني
            const angularSpeed = (2 * Math.PI) / orbitalPeriod;
           // const angularSpeed = 0.3;

            if (!this.moon.userData.angle) this.moon.userData.angle = 0;
            this.moon.userData.angle += angularSpeed * dt;

            const angle = this.moon.userData.angle;
            const orbitRadius = 3.844e8;

            const x = orbitRadius * Math.cos(angle);
            const y = orbitRadius * Math.sin(angle);

            this.moon.position.set(x, y, 0);
        }
    }

    addSatellite(satellite: Satellite) {
        this.satellites.push(satellite);
        this.simulatedSpace.add(satellite);

        satellite.addDestructionListener((satellite) => {
            this.removeSatellite(satellite);
            if (this.onSatelliteDestruction) this.onSatelliteDestruction(satellite);
        });
    }

    removeSatellite(satellite: Satellite) {
        _remove(this.satellites, (obj) => obj === satellite);
        this.simulatedSpace.remove(satellite);
    }
}
