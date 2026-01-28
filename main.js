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
const quizData = [
    { planet: 'mars', texture: 'textures/2k_mars.jpg', question: '1 + 1 = ?', answers: [2, 3], correct: 2 },
    { planet: 'earth', texture: 'textures/2k_earth_daymap.jpg', question: '2 + 3 = ?', answers: [5, 4], correct: 5 },
    { planet: 'venus', texture: 'textures/2k_venus_surface.jpg', question: '5 - 2 = ?', answers: [3, 4], correct: 3 },
    { planet: 'mercury', texture: 'textures/2k_mercury.jpg', question: '4 + 1 = ?', answers: [5, 6], correct: 5 },
    { planet: 'moon', texture: 'textures/2k_moon.jpg', question: '3 - 1 = ?', answers: [2, 1], correct: 2 },
];

let currentQuestionIndex = 0;
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

    const levelData = quizData[currentQuestionIndex];

    // Create Planet
    const textureLoader = new THREE.TextureLoader();
    const geometry = new THREE.SphereGeometry(3, 32, 32);
    const material = new THREE.MeshStandardMaterial({ map: textureLoader.load(levelData.texture) });
    currentPlanet = new THREE.Mesh(geometry, material);
    scene.add(currentPlanet);

    // Display Question
    speechBubble.innerText = levelData.question;

    // Display Answers
    levelData.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerText = answer;
        button.addEventListener('click', () => selectAnswer(answer, levelData.correct));
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
        setTimeout(() => document.body.style.animation = '', 0.5);
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
                currentQuestionIndex = (currentQuestionIndex + 1) % quizData.length;
                loadLevel();
            }, 1000); // Wait for explosion to finish
        }
    }
    
    // Explosion animation
    if(particles) {
        const positions = particles.geometry.attributes.position.array;
        for(let i=0; i<positions.length; i+=3) {
            positions[i] += particles.velocities[i];
            positions[i+1] += particles.velocities[i+1];
            positions[i+2] += particles.velocities[i+2];
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }


    renderer.render(scene, camera);
}


//-- INITIALIZATION -----------------------------------------------------------
// Need to re-download textures
const texturePromises = quizData.map(level => {
    return new Promise(resolve => {
        new THREE.TextureLoader().load(level.texture, resolve);
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
