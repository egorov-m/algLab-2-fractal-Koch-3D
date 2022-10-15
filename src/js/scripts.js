import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";

let renderer, camera, scene, controls;
let mouseX = 0;
let mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let meshesFlag = true;
// Массив всех сеток на сцене
let meshes = [];

// Набор цветов для фрактала — белый, красный, жёлтый, зелёный, синий
let color = ["#ffffff", "#ff0000", "#ffff00", "#00ff00", "#0000ff"];
// Текущий цвет
let currentColor = 0;

// Options to be added to the GUI
let options = {
    size: 50,
    stellation: 1,
    epoch: 3,
    animationTime: 0,
    reset: function() {
        this.size = 50;
        this.stellation = 1;
        this.epoch = 5;
        this.animationTime = 0;
    }
};

// Пройденное время отрисовки
let timeFractal;
// Предполагаемое время на отрисовку фрактала
let time;

init();
onWindowResize();
animate();

// DAT.GUI Related Stuff
let gui = new GUI();
let paramsFractal = gui.addFolder("Fractal");
paramsFractal.add(options, "epoch", 1, 6).listen().step(1).onFinishChange(function(e) {
    if (performance.now() - timeFractal >= time) {
        meshesFlag = true;
    } else {
        alert("Дождитесь завершения отрисовки!");
    }
    
});
paramsFractal.add(options, "size", 10, 100).listen().step(1).onFinishChange(function(e) {
    if (performance.now() - timeFractal >= time) {
        meshesFlag = true;
    } else {
        alert("Дождитесь завершения отрисовки!");
    }
});
paramsFractal.add(options, "stellation", 0, 2).listen().step(0.1).onFinishChange(function(e) {
    if (performance.now() - timeFractal >= time) {
        meshesFlag = true;
    } else {
        alert("Дождитесь завершения отрисовки!");
    }
});
paramsFractal.add(options, "animationTime", 0, 200).name("animation time").listen().step(50).onFinishChange(function(e) {
    if (performance.now() - timeFractal >= time) {
        meshesFlag = true;
    } else {
        alert("Дождитесь завершения отрисовки!");
    }
});
paramsFractal.open();
gui.add(options, "reset").onFinishChange(function (e) {
    if (performance.now() - timeFractal >= time) {
        meshesFlag = true;
    } else {
        alert("Дождитесь завершения отрисовки!");
    }
});

/**
 * SECTION Initializing core ThreeJS elements
 */
function init() {
    // Initialize renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    // Initialize scene, light
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xbbbbbb, 0.3));
    scene.background = new THREE.Color(0x040d21);

    // Initialize camera, light
    camera = new THREE.PerspectiveCamera();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    var dLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dLight.position.set(-800, 2000, 400);
    camera.add(dLight);

    var dLight1 = new THREE.DirectionalLight(0x7982f6, 1);
    dLight1.position.set(-200, 500, 200);
    camera.add(dLight1);

    var dLight2 = new THREE.PointLight(0x8566cc, 0.5);
    dLight2.position.set(-200, 500, 200);
    camera.add(dLight2);

    camera.position.z = 400;
    camera.position.x = 0;
    camera.position.y = 0;

    scene.add(camera);

    // Additional effects
    scene.fog = new THREE.Fog(0x535ef3, 400, 2000);

    // Initialize controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dynamicDampingFactor = 0.01;
    controls.enablePan = false;
    controls.minDistance = 200;
    controls.maxDistance = 500;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1;
    controls.autoRotate = false;

    controls.minPolarAngle = Math.PI / 3.5;
    controls.maxPolarAngle = Math.PI - Math.PI / 3;

    window.addEventListener("resize", onWindowResize, false);
    document.addEventListener("mousemove", onMouseMove);
}

/**
 * Главная функция построения фрактала
 * @param {number} n число эпох
 * @param {Array} geometry массив ранее созданных треугольников
 */
function fractal(n = 5, geometry = []) {
    if (n > 0) {
        if (geometry.length < 1) {
            // Первая эпоха — создание начального тетраедра по заданному размеру
            const h = (options.size * Math.sqrt(6)) / 3;
            const points1 = [-options.size / 2, -options.size / 2, 0, 0, options.size / 2, 0, options.size / 2, -options.size / 2, 0];
            const points2 = [-options.size / 2, -options.size / 2, 0, options.size / 2, -options.size / 2, 0, 0, 0, h];
            const points3 = [-options.size / 2, -options.size / 2, 0, 0, 0, h, 0, options.size / 2, 0];
            const points4 = [options.size / 2, -options.size / 2, 0, 0, options.size / 2, 0, 0, 0, h];

            const triangle1 = getTriangle(points1);
            const triangle2 = getTriangle(points2);
            const triangle3 = getTriangle(points3);
            const triangle4 = getTriangle(points4);
            geometry.push(triangle1, triangle2, triangle3, triangle4);
            setMeshTriangle(triangle1);
            setMeshTriangle(triangle2);
            setMeshTriangle(triangle3);
            setMeshTriangle(triangle4);
            n--;
            setTimeout(() => {
                fractal(n, geometry);
            }, options.animationTime);
        } else {
            let newGeometry = [];
            for (let i = 0; i < geometry.length; i++) {
                const v = geometry[i].getAttribute("position").array;
                // Вершины треугольника
                let A = new THREE.Vector3(v[0], v[1], v[2]);
                let B = new THREE.Vector3(v[3], v[4], v[5]);
                let C = new THREE.Vector3(v[6], v[7], v[8]);
                // Получаем середины сторон треугольника
                let AB = A.clone().add(B).multiplyScalar(0.5);
                let BC = B.clone().add(C).multiplyScalar(0.5);
                let CA = C.clone().add(A).multiplyScalar(0.5);
                // Вычисляем вершину
                let ab2 = A.clone().sub(B).lengthSq();
                let bc2 = B.clone().sub(C).lengthSq();
                let ca2 = C.clone().sub(A).lengthSq();
                // Высота
                let elevation =
                    (options.stellation * Math.sqrt(2 * (ab2 + bc2 + ca2))) / 6;
                let ABC = new THREE.Triangle(AB, BC, CA);
                // Точка вершины
                let TOP = new THREE.Vector3();
                ABC.getMidpoint(TOP);
                let NORMAL = new THREE.Vector3();
                ABC.getNormal(NORMAL);
                TOP.add(NORMAL.multiplyScalar(elevation));

                // Точки треугольника
                const points1 = [
                    AB.x,
                    AB.y,
                    AB.z,
                    BC.x,
                    BC.y,
                    BC.z,
                    TOP.x,
                    TOP.y,
                    TOP.z,
                ];
                const points2 = [
                    AB.x,
                    AB.y,
                    AB.z,
                    TOP.x,
                    TOP.y,
                    TOP.z,
                    CA.x,
                    CA.y,
                    CA.z,
                ];
                const points3 = [
                    BC.x,
                    BC.y,
                    BC.z,
                    CA.x,
                    CA.y,
                    CA.z,
                    TOP.x,
                    TOP.y,
                    TOP.z,
                ];

                // Новые треугольники
                const triangle1 = getTriangle(points1);
                const triangle2 = getTriangle(points2);
                const triangle3 = getTriangle(points3);

                newGeometry.push(triangle1, triangle2, triangle3);
            }
            n--;
            setTimeout(() => {
                setMeshAnimation(0, newGeometry, n);
            }, options.animationTime);
        }
    }
}

function setMeshAnimation(k, newGeometry, n) {
    if (k < newGeometry.length) {
        setMeshTriangle(newGeometry[k]);
        setMeshTriangle(newGeometry[++k]);
        setMeshTriangle(newGeometry[++k]);
        k++;
        setTimeout(() => {
            setMeshAnimation(k, newGeometry, n);
        }, options.animationTime);
    } else {
        fractal(n, newGeometry);
    }
}

/**
 * Установить треугольник на сцену
 * @param {THREE.BufferGeometry} geometry 
 */
function setMeshTriangle(geometry) {
    let m = getMeshTriangle(geometry);
    meshes.push(m);
    scene.add(m);
}

/**
 * Случайная генерация цвета
 * @returns цвет
 */
function generateColor() {
    // let n = (Math.random() * 0xfffff * 1000000).toString(16);
    // return "#" + n.slice(0, 6);
    if (currentColor < color.length) {
        return color[currentColor++];
    } else {
        currentColor = 0;
        return color[currentColor++];
    }
}

/**
 * Получить сетку треугольника
 * @param {THREE.BufferGeometry} geometry 
 * @returns сетка треугольника
 */
function getMeshTriangle(geometry) {
    var randomColor = generateColor();
    const material = new THREE.MeshBasicMaterial({
        color: randomColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
    });
    return new THREE.Mesh(geometry, material);
}

/**
 * Получение треугольника по заданным точкам
 * @param {Array} points вершины треугольника
 * @returns треугольник
 */
function getTriangle(points) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < points.length; i++) vertices.push(points[i]);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.attributes.position.needsUpdate = true;
    return geometry;
}

/**
 * Движение мышью
 * @param {event} event событие
 */
function onMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

/**
 * Изменение размера окна
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    windowHalfX = window.innerWidth / 1.5;
    windowHalfY = window.innerHeight / 1.5;
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Анимация движения камеры по сцене
 */
function animate() {
    if (meshesFlag) {
        for (let i = 0; i < meshes.length; i++) {
            scene.remove(meshes[i]);
        }
        meshes.length = 0;
        meshesFlag = false;
        time = Math.pow(3, options.epoch - 1) * options.animationTime * 3;
        timeFractal = performance.now();
        fractal(options.epoch);
    }
    camera.position.x +=
        Math.abs(mouseX) <= windowHalfX / 2
            ? (mouseX / 2 - camera.position.x) * 0.005
            : 0;
    camera.position.y += (-mouseY / 2 - camera.position.y) * 0.005;
    camera.lookAt(scene.position);
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
