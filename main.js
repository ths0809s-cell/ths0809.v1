//-- SETUP --------------------------------------------------------------------
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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem() {
    const operation = ['+', '-', '*', '/'][getRandomInt(0, 3)];
    let num1, num2, question, correct, incorrect;

    switch (operation) {
        case '+':
            num1 = getRandomInt(10, 99);
            num2 = getRandomInt(10, 99);
            correct = num1 + num2;
            question = `${num1} + ${num2} = ?`;
            incorrect = correct + (Math.random() > 0.5 ? getRandomInt(1, 5) : -getRandomInt(1, 5));
            if (incorrect === correct) incorrect += (Math.random() > 0.5 ? 1 : -1); // Ensure incorrect is different
            break;
        case '-':
            num1 = getRandomInt(10, 99);
            num2 = getRandomInt(10, 99);
            if (num1 < num2) [num1, num2] = [num2, num1]; // Ensure num1 >= num2
            correct = num1 - num2;
            question = `${num1} - ${num2} = ?`;
            incorrect = correct + (Math.random() > 0.5 ? getRandomInt(1, 5) : -getRandomInt(1, 5));
            if (incorrect === correct) incorrect += (Math.random() > 0.5 ? 1 : -1);
            break;
        case '*':
            num1 = getRandomInt(1, 10);
            num2 = getRandomInt(1, 10);
            correct = num1 * num2;
            question = `${num1} * ${num2} = ?`;
            incorrect = correct + (Math.random() > 0.5 ? getRandomInt(1, 3) : -getRandomInt(1, 3));
            if (incorrect === correct) incorrect += (Math.random() > 0.5 ? 1 : -1);
            break;
        case '/':
            num2 = getRandomInt(1, 10);
            num1 = num2 * getRandomInt(1, 10); // Ensure num1 is a multiple of num2
            correct = num1 / num2;
            question = `${num1} / ${num2} = ?`;
            incorrect = correct + (Math.random() > 0.5 ? getRandomInt(1, 3) : -getRandomInt(1, 3));
            if (incorrect === correct) incorrect += (Math.random() > 0.5 ? 1 : -1);
            break;
    }

    // Shuffle correct and incorrect answers
    const answers = Math.random() > 0.5 ? [correct, incorrect] : [incorrect, correct];

    return { question, answers, correct };
}

let currentPlanet = null;
let rocket = null;
let particles = null;

const speechBubble = document.getElementById('speech-bubble');
const answerButtons = document.getElementById('answer-buttons');

//-- GAME LOGIC ---------------------------------------------------------------
function loadLevel() {
    // Clean up previous level
    if (currentPlanet) scene.remove(currentPlanet);
    if (rocket) scene.remove(rocket);
    answerButtons.innerHTML = '';

    const problem = generateProblem();
    const planetData = planetTextures[getRandomInt(0, planetTextures.length - 1)];

    // Create Planet
    const textureLoader = new THREE.TextureLoader();
    const geometry = new THREE.SphereGeometry(3, 32, 32);
    const material = new THREE.MeshStandardMaterial({ map: textureLoader.load(planetData.texture) });
    currentPlanet = new THREE.Mesh(geometry, material);
    scene.add(currentPlanet);

    // Display Question
    speechBubble.innerText = problem.question;

    // Display Answers
    problem.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerText = answer;
        button.addEventListener('click', () => selectAnswer(answer, problem.correct));
        answerButtons.appendChild(button);
    });
}

function selectAnswer(selectedAnswer, correctAnswer) {
    if (selectedAnswer === correctAnswer) {
        // Disable buttons
        document.querySelectorAll('#answer-buttons button').forEach(b => b.disabled = true);
        
        // Launch Rocket
        const rocketGeom = new THREE.CylinderGeometry(0.2, 0.2, 1, 32);
        const rocketMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        rocket = new THREE.Mesh(rocketGeom, rocketMat);
        rocket.position.y = -10;
        rocket.rotation.x = Math.PI; // Point up
        scene.add(rocket);

    } else {
        // Shake screen on wrong answer
        document.body.style.animation = 'shake 0.5s';
        setTimeout(() => document.body.style.animation = '', 500);
    }
}

function createExplosion() {
    const particleCount = 100;
    const particlesGeom = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 0.1;
        velocities.push((Math.random() - 0.5) * 0.1);
    }

    particlesGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0xffa500, size: 0.1 });
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

    // Rocket animation
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
                // No currentQuestionIndex increment as problems are generated dynamically
                loadLevel();
            }, 1000); // Wait for explosion to finish
        }
    }
    
    // Explosion animation
    if(particles) {
        const positions = particles.geometry.attributes.position.array;
        for(let i=0; i<positions.length; i+=3) {
            positions[i] += particles.velocities[i] * 0.8; // Slow down over time
            positions[i+1] += particles.velocities[i+1] * 0.8;
            positions[i+2] += particles.velocities[i+2] * 0.8;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        // Optionally make particles fade out
        particles.material.opacity -= 0.01;
        if(particles.material.opacity <= 0) {
            scene.remove(particles);
            particles = null;
        }
    }


    renderer.render(scene, camera);
}


//-- INITIALIZATION -----------------------------------------------------------
// Need to re-download textures
const texturePromises = planetTextures.map(data => {
    return new Promise(resolve => {
        new THREE.TextureLoader().load(data.texture, resolve);
    });
});

Promise.all(texturePromises).then(() => {
    loadLevel();
    animate();
});


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});