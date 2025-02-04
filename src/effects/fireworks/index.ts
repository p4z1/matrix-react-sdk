/*
 Copyright 2020 Nurjin Jafar
 Copyright 2020 Nordeck IT + Consulting GmbH.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import ICanvasEffect from "../ICanvasEffect";

export type FireworksOptions = {
    /**
     * max fireworks count
     */
    maxCount: number;
    /**
     * gravity value that firework adds to shift from it's start position
     */
    gravity: number;
};

type FireworksParticle = {
    /**
     * color
     */
    color: string;
    /**
     * x,y are the point where the particle starts to position on canvas
     */
    x: number;
    y: number;
    /**
     * vx,vy shift values from x and y
     */
    vx: number;
    vy: number;
    /**
     * the alpha opacity of the firework particle (between 0 and 1, where 1 is opaque and 0 is invisible)
     */
    alpha: number;
    /**
     * w,h width and height
     */
    w: number;
    h: number;
};

export const DefaultOptions: FireworksOptions = {
    maxCount: 500,
    gravity: 0.05,
};

export default class Fireworks implements ICanvasEffect {
    private readonly options: FireworksOptions;

    constructor(options: { [key: string]: any }) {
        this.options = { ...DefaultOptions, ...options };
    }

    private context: CanvasRenderingContext2D | null = null;
    private supportsAnimationFrame = window.requestAnimationFrame;
    private particles: Array<FireworksParticle> = [];
    public isRunning: boolean;

    public start = async (canvas: HTMLCanvasElement, timeout = 3000) => {
        if (!canvas) {
            return;
        }
        this.isRunning = true;
        this.context = canvas.getContext("2d");
        this.supportsAnimationFrame.call(window, this.updateWorld);
        if (timeout) {
            window.setTimeout(this.stop, timeout);
        }
    };

    private updateWorld = () => {
        if (!this.isRunning && this.particles.length === 0) return;
        this.update();
        this.paint();
        this.supportsAnimationFrame.call(window, this.updateWorld);
    };

    private update = () => {
        if (this.particles.length < this.options.maxCount && this.isRunning) {
            this.createFirework();
        }
        const alive = [];
        for (let i = 0; i < this.particles.length; i++) {
            if (this.move(this.particles[i])) {
                alive.push(this.particles[i]);
            }
        }
        this.particles = alive;
    };

    private paint = () => {
        if (!this.context || !this.context.canvas) return;
        this.context.globalCompositeOperation = "destination-out";
        this.context.fillStyle = "rgba(0,0,0,0.5)";
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.context.globalCompositeOperation = "lighter";
        for (let i = 0; i < this.particles.length; i++) {
            this.drawParticle(this.particles[i]);
        }
    };

    private createFirework = () => {
        if (!this.context || !this.context.canvas) return;
        const width = this.context.canvas.width;
        const height = this.context.canvas.height;
        const xPoint = Math.random() * (width - 200) + 100;
        const yPoint = Math.random() * (height - 200) + 100;
        const nFire = Math.random() * 50 + 100;
        const color =
            "rgb(" +
            ~~(Math.random() * 200 + 55) +
            "," +
            ~~(Math.random() * 200 + 55) +
            "," +
            ~~(Math.random() * 200 + 55) +
            ")";
        for (let i = 0; i < nFire; i++) {
            const particle = <FireworksParticle>{};
            particle.color = color;
            particle.w = particle.h = Math.random() * 4 + 1;
            particle.x = xPoint - particle.w / 2;
            particle.y = yPoint - particle.h / 2;
            particle.vx = (Math.random() - 0.5) * 10;
            particle.vy = (Math.random() - 0.5) * 10;
            particle.alpha = Math.random() * 0.5 + 0.5;
            const vy = Math.sqrt(25 - particle.vx * particle.vx);
            if (Math.abs(particle.vy) > vy) {
                particle.vy = particle.vy > 0 ? vy : -vy;
            }
            this.particles.push(particle);
        }
    };

    public stop = async () => {
        this.isRunning = false;
    };

    private drawParticle = (particle: FireworksParticle): void => {
        if (!this.context || !this.context.canvas) {
            return;
        }
        this.context.save();
        this.context.beginPath();

        this.context.translate(particle.x + particle.w / 2, particle.y + particle.h / 2);
        this.context.arc(0, 0, particle.w, 0, Math.PI * 2);
        this.context.fillStyle = particle.color;
        this.context.globalAlpha = particle.alpha;

        this.context.closePath();
        this.context.fill();
        this.context.restore();
    };

    private move = (particle: FireworksParticle) => {
        particle.x += particle.vx;
        particle.vy += this.options.gravity;
        particle.y += particle.vy;
        particle.alpha -= 0.01;
        return !(
            particle.x <= -particle.w ||
            particle.x >= screen.width ||
            particle.y >= screen.height ||
            particle.alpha <= 0
        );
    };
}
