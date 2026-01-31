깃허브 푸시 해줘//-- SETUP --------------------------------------------------------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

camera.position.z = 10;

//-- QUIZ DATA ----------------------------------------------------------------
const planetTextures = [
    { name: 'mars', texture: 'textures/2k_mars.jpg' },
    { name: 'earth', texture: 'textures/2k_earth_daymap.jpg' },
    { name: 'venus', texture: 'textures/2k_venus_surface.jpg' },
    { name: 'mercury', texture: 'textures/2k_mercury.jpg' },
    { name: 'moon', texture: 'textures/2k_moon.jpg' },
];

let level = 1;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem() {
    let num1, num2, question, correct, incorrect;

    if (level <= 2) { // Single digit addition
        num1 = getRandomInt(1, 9);
        num2 = getRandomInt(1, 9);
        correct = num1 + num2;
        question = `${num1} + ${num2} = ?`;
    } else if (level <= 4) { // Single digit subtraction
        num1 = getRandomInt(5, 9);
        num2 = getRandomInt(1, 4);
        correct = num1 - num2;
        question = `${num1} - ${num2} = ?`;
    } else { // Double digit + single digit addition
        num1 = getRandomInt(10, 99);
        num2 = getRandomInt(1, 9);
        correct = num1 + num2;
        question = `${num1} + ${num2} = ?`;
    }

    incorrect = correct + (Math.random() > 0.5 ? getRandomInt(1, 5) : -getRandomInt(1, 5));
    if (incorrect === correct) incorrect += (Math.random() > 0.5 ? 1 : -1);

    const answers = Math.random() > 0.5 ? [correct, incorrect] : [incorrect, correct];
    return { question, answers, correct };
}

let currentPlanet = null;
let rocket = null;
let particles = null;
const aliens = []; // Array to hold alien objects

const speechBubble = document.getElementById('speech-bubble');
const answerButtons = document.getElementById('answer-buttons');
const explosionSound = document.getElementById('explosion-sound');

//-- ALIEN --------------------------------------------------------------------
function createAlien() {
    const alienGroup = new THREE.Group();

    // Body
    const bodyGeom = new THREE.SphereGeometry(0.5, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green body
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    alienGroup.add(body);

    // Eye
    const eyeGeom = new THREE.SphereGeometry(0.1, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White eye
    const eye = new THREE.Mesh(eyeGeom, eyeMat);
    eye.position.set(0, 0.1, 0.4);
    alienGroup.add(eye);
    
    // Pupil
    const pupilGeom = new THREE.SphereGeometry(0.05, 12, 12);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black pupil
    const pupil = new THREE.Mesh(pupilGeom, pupilMat);
    pupil.position.set(0, 0.1, 0.45);
    alienGroup.add(pupil);

    // Set initial position and a random movement direction
    alienGroup.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5
    );

    alienGroup.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        0
    );
    
    scene.add(alienGroup);
    aliens.push(alienGroup);
}


//-- GAME LOGIC ---------------------------------------------------------------
function loadLevel() {
    if (currentPlanet) scene.remove(currentPlanet);
    if (rocket) scene.remove(rocket);
    answerButtons.innerHTML = '';

    const problem = generateProblem();
    const planetData = planetTextures[getRandomInt(0, planetTextures.length - 1)];

    const textureLoader = new THREE.TextureLoader();
    const geometry = new THREE.SphereGeometry(3, 32, 32);
    const material = new THREE.MeshStandardMaterial({ map: textureLoader.load(planetData.texture) });
    currentPlanet = new THREE.Mesh(geometry, material);
    scene.add(currentPlanet);

    speechBubble.innerText = problem.question;

    problem.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerText = answer;
        button.addEventListener('click', () => selectAnswer(answer, problem.correct));
        answerButtons.appendChild(button);
    });
}

function selectAnswer(selectedAnswer, correctAnswer) {
    if (selectedAnswer === correctAnswer) {
        level++;
        document.querySelectorAll('#answer-buttons button').forEach(b => b.disabled = true);
        
        const rocketGeom = new THREE.CylinderGeometry(0.2, 0.2, 1, 32);
        const rocketMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        rocket = new THREE.Mesh(rocketGeom, rocketMat);
        rocket.position.y = -10;
        rocket.rotation.x = Math.PI;
        scene.add(rocket);

    } else {
        document.body.style.animation = 'shake 0.5s';
        setTimeout(() => document.body.style.animation = '', 500);
    }
}

function createExplosion() {
    explosionSound.play();
    const particleCount = 100;
    const particlesGeom = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 0.1;
        velocities.push((Math.random() - 0.5) * 0.1);
    }

    particlesGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0xffa500, size: 0.1, transparent: true });
    particles = new THREE.Points(particlesGeom, particleMat);
    particles.velocities = velocities;
    scene.add(particles);
}

//-- ANIMATION LOOP -----------------------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    if (currentPlanet) {
        currentPlanet.rotation.y += 0.005;
    }

    // Animate aliens
    aliens.forEach(alien => {
        alien.position.add(alien.velocity);

        // Bounce off screen edges
        if (alien.position.x > 15 || alien.position.x < -15) {
            alien.velocity.x = -alien.velocity.x;
        }
        if (alien.position.y > 8 || alien.position.y < -8) {
            alien.velocity.y = -alien.velocity.y;
        }
    });

    if (rocket) {
        rocket.position.y += 0.2;
        if (rocket.position.distanceTo(currentPlanet.position) < 1) {
            scene.remove(currentPlanet);
            currentPlanet = null;
            scene.remove(rocket);
            rocket = null;

            createExplosion();

            setTimeout(() => {
                scene.remove(particles);
                particles = null;
                loadLevel();
            }, 1000);
        }
    }
    
    if(particles) {
        const positions = particles.geometry.attributes.position.array;
        for(let i=0; i<positions.length; i+=3) {
            positions[i] += particles.velocities[i] * 0.8;
            positions[i+1] += particles.velocities[i+1] * 0.8;
            positions[i+2] += particles.velocities[i+2] * 0.8;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.material.opacity -= 0.01;
    }

    renderer.render(scene, camera);
}

//-- INITIALIZATION -----------------------------------------------------------
const texturePromises = planetTextures.map(data => {
    return new Promise(resolve => {
        new THREE.TextureLoader().load(data.texture, resolve);
    });
});

Promise.all(texturePromises).then(() => {
    for (let i = 0; i < 5; i++) {
        createAlien();
    }
    loadLevel();
    animate();
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
