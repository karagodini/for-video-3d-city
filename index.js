// Базовые параметры
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

if (window.innerWidth > 800) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.needsUpdate = true;
}

document.body.appendChild(renderer.domElement);

// Камера
var camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(0, 2, 14);

// Сделайте его отзывчивым
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Сцена
var scene = new THREE.Scene();
var city = new THREE.Object3D();
var smoke = new THREE.Object3D();
var town = new THREE.Object3D();
var createCarPos = true;
var uSpeed = 0.001;

// Фоновый рисунок
var setcolor = 0xF02050;
scene.background = new THREE.Color(setcolor);
scene.fog = new THREE.Fog(setcolor, 10, 16);

// Случайная функция
function mathRandom(num = 8) {
    return -Math.random() * num + Math.random() * num;
}

// Меняйте цвета зданий
var setTintNum = true;
function setTintColor() {
    var setColor = setTintNum ? 0x000000 : 0x000000;
    setTintNum = !setTintNum;
    return setColor;
}

// Создать город
function init() {
    var segments = 2;
    for (var i = 1; i < 100; i++) {
        var geometry = new THREE.BoxGeometry(1, 0, 0, segments, segments, segments);
        var material = new THREE.MeshStandardMaterial({
            color: setTintColor(),
            wireframe: false,
            flatShading: true,
            side: THREE.DoubleSide
        });
        var wmaterial = new THREE.MeshLambertMaterial({
            color: 0x000000,
            wireframe: true,
            transparent: true,
            opacity: 0.03,
            side: THREE.DoubleSide
        });

        var cube = new THREE.Mesh(geometry, material);
        var wire = new THREE.Mesh(geometry, wmaterial);
        var floor = new THREE.Mesh(geometry, material);
        var wFloor = new THREE.Mesh(geometry, material);

        cube.add(wFloor);
        cube.castShadow = true;
        cube.receiveShadow = true;
        floor.scale.y = 0.05;
        cube.scale.y = 0.1 + Math.abs(mathRandom(8));

        var cubeWidth = 0.9;
        cube.scale.x = cube.scale.z = cubeWidth + mathRandom(1 - cubeWidth);
        cube.position.x = Math.round(mathRandom());
        cube.position.z = Math.round(mathRandom());

        floor.position.set(cube.position.x, 0, cube.position.z);

        town.add(floor);
        town.add(cube);
    }

    // Подробности
    var gmaterial = new THREE.MeshToonMaterial({ color: 0X000000, side: THREE.DoubleSide });
    var gparticular = new THREE.CircleGeometry(0.01, 3);
    var aparticular = 5;

    for (var h = 1; h < 300; h++) {
        var particular = new THREE.Mesh(gparticular, gmaterial);
        particular.position.set(mathRandom(aparticular), mathRandom(aparticular), mathRandom(aparticular));
        particular.rotation.set(mathRandom(), mathRandom(), mathRandom());
        smoke.add(particular);
    }

    var pmaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
        roughness: 1,
        metalness: 0.6,
        opacity: 0.9,
        transparent: true
    });

    var pgeometry = new THREE.PlaneGeometry(60, 60);
    var pelement = new THREE.Mesh(pgeometry, pmaterial);
    pelement.rotation.x = -90 * Math.PI / 180;
    pelement.position.y = -0.001;
    pelement.receiveShadow = true;
    city.add(pelement);
}

// Функция мыши
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(), INTERSECTED;
var intersected;

function onMouseMove(e) {
    e.preventDefault();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onDocumentTouchStart(e) {
    if (e.touches.length == 1) {
        e.preventDefault();
        mouse.x = (e.touches[0].pageX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.touches[0].pageY / window.innerHeight) * 2 + 1;
    }
}

function onDocumentTouchMove(e) {
    if (e.touches.length == 1) {
        e.preventDefault();
        mouse.x = (e.touches[0].pageX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.touches[0].pageY / window.innerHeight) * 2 + 1;
    }
}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('touchstart', onDocumentTouchStart, false);
window.addEventListener('touchmove', onDocumentTouchMove, false);

// Создание освещения
var ambientLight = new THREE.AmbientLight(0xFFFFFF, 4);
var lightFront = new THREE.SpotLight(0xFFFFFF, 20, 10);
var lightBack = new THREE.PointLight(0xFFFFFF, 0.5);
var spotLightHelper = new THREE.SpotLightHelper(lightFront);

lightFront.rotation.x = 45 * Math.PI / 180;
lightFront.rotation.z = -45 * Math.PI / 180;
lightFront.position.set(5, 5, 5);
lightFront.castShadow = true;
lightFront.shadow.mapSize.width = 6000;
lightFront.shadow.mapSize.height = lightFront.shadow.mapSize.width;
lightFront.penumbra = 0.1;
lightBack.position.set(0, 6, 0);

smoke.position.y = 2;

scene.add(ambientLight);
city.add(lightFront);
scene.add(lightBack);
scene.add(city);
city.add(smoke);
city.add(town);

// Помощник по сетке
var gridHelper = new THREE.GridHelper(60, 120, 0x000000, 0xFF0000);
city.add(gridHelper);

// Мир автомобилей
var createCars = function (cScale = 2, cPos = 20, cColor = 0x000000) {
    var cMat = new THREE.MeshToonMaterial({ color: cColor, side: THREE.DoubleSide });
    var cGeo = new THREE.BoxGeometry(1, cScale / 40, cScale / 40);
    var cElem = new THREE.Mesh(cGeo, cMat);
    var cAmp = 3;

    if (createCarPos) {
        createCarPos = false;
        cElem.position.x = -cPos;
        cElem.position.z = mathRandom(cAmp);

        TweenMax.to(cElem.position, 3, { x: cPos, repeat: -1, yoyo: true, delay: mathRandom(3) });
    } else {
        createCarPos = true;
        cElem.position.x = mathRandom(cAmp);
        cElem.position.z = -cPos;
        cElem.position.y = 90 * Math.PI / 180;

        TweenMax.to(cElem.position, 5, { z: cPos, repeat: -1, yoyo: true, delay: mathRandom(3), ease: Power1.easeInOut });
    }
    cElem.receiveShadow = true;
    cElem.castShadow = true;
    cElem.position.y = Math.abs(mathRandom(5));
    city.add(cElem);
}

var generateLines = function () {
    for (var i = 0; i < 60; i++) {
        createCars(0, 1, 20);
    }
}

// Позиция камеры
var cameraSet = function () {
    createCars(0.1, 20, 0xFFFFFF);
}

// Анимированная функция
var animate = function () {
    var time = Date.now() * 0.00005;
    requestAnimationFrame(animate);

    city.rotation.y -= ((mouse.x * 8) - camera.rotation.y) * uSpeed;
    city.rotation.x -= (-(mouse.y * 2) - camera.rotation.x) * uSpeed;
    if (city.rotation.x < -0.05) {
        city.rotation.x = -0.05;
    } else if (city.rotation.x > 1) {
        city.rotation.x = 1;
    }

    smoke.rotation.y += 0.01;
    smoke.rotation.x += 0.01;

    camera.lookAt(city.position);
    renderer.render(scene, camera);
}

// Вызов основных функций
init();
generateLines();
animate();
