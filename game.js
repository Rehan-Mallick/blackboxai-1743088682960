// Matter.js modules
const { Engine, Render, Runner, World, Bodies, Body, Vector } = Matter;

// Game setup
const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 0; // We'll handle gravity manually for tilting

// Canvas setup
const canvas = document.getElementById('game-canvas');
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#1a202c'
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Game state
let currentLevel = 1;
let tiltX = 0;
let tiltY = 0;
const maxTilt = 0.001;
const tiltSpeed = 0.0001;
let ball, goal, walls = [];
const levelCompleteElement = document.getElementById('level-complete');

// Controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        tiltX = -tiltSpeed;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        tiltX = tiltSpeed;
    }
});

document.addEventListener('keyup', (e) => {
    if ((e.key === 'ArrowLeft' || e.key === 'a') && tiltX < 0) {
        tiltX = 0;
    } else if ((e.key === 'ArrowRight' || e.key === 'd') && tiltX > 0) {
        tiltX = 0;
    }
});

// Reset button
document.getElementById('reset').addEventListener('click', () => {
    loadLevel(currentLevel);
});

// Next level button
document.getElementById('next-level').addEventListener('click', () => {
    currentLevel++;
    if (currentLevel > 100) currentLevel = 1;
    document.getElementById('level').textContent = currentLevel;
    levelCompleteElement.classList.add('hidden');
    loadLevel(currentLevel);
});

// Level loading
function loadLevel(level) {
    // Clear previous level
    World.clear(world);
    walls = [];

    // Create boundaries
    const boundaryOptions = { isStatic: true, render: { fillStyle: '#4a5568' } };
    walls.push(Bodies.rectangle(400, 0, 800, 20, boundaryOptions)); // Top
    walls.push(Bodies.rectangle(400, 600, 800, 20, boundaryOptions)); // Bottom
    walls.push(Bodies.rectangle(0, 300, 20, 600, boundaryOptions)); // Left
    walls.push(Bodies.rectangle(800, 300, 20, 600, boundaryOptions)); // Right

    // Create ball
    ball = Bodies.circle(400, 300, 15, {
        restitution: 0.5,
        friction: 0.01,
        render: { fillStyle: '#e2e8f0' }
    });

    // Create goal
    goal = Bodies.rectangle(
        getRandomPosition(100, 700),
        getRandomPosition(100, 500),
        30, 30, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: '#10b981' }
        }
    );

    // Create obstacles based on level difficulty
    const obstacleCount = Math.min(50, Math.floor(level * 0.5));
    for (let i = 0; i < obstacleCount; i++) {
        const size = getRandomSize(level);
        const obstacle = Bodies.rectangle(
            getRandomPosition(50, 750),
            getRandomPosition(50, 550),
            size.width, size.height, {
                isStatic: true,
                angle: Math.random() * Math.PI,
                render: { fillStyle: '#6b7280' }
            }
        );
        walls.push(obstacle);
    }

    // Add all bodies to world
    World.add(world, [...walls, ball, goal]);

    // Collision detection for goal
    Matter.Events.on(engine, 'collisionStart', (event) => {
        const pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            if ((pair.bodyA === ball && pair.bodyB === goal) || 
                (pair.bodyA === goal && pair.bodyB === ball)) {
                levelCompleteElement.classList.remove('hidden');
            }
        }
    });
}

// Helper functions
function getRandomPosition(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomSize(level) {
    const minSize = 20 + (level * 0.5);
    const maxSize = 60 + (level * 0.8);
    const size = Math.random() * (maxSize - minSize) + minSize;
    return {
        width: size,
        height: size * (0.5 + Math.random() * 0.5)
    };
}

// Game loop for tilt physics
Matter.Events.on(engine, 'beforeUpdate', () => {
    // Apply tilt gravity
    const gravity = engine.gravity;
    gravity.x = tiltX;
    gravity.y = tiltY;

    // Limit maximum tilt
    if (Math.abs(gravity.x) > maxTilt) {
        gravity.x = gravity.x > 0 ? maxTilt : -maxTilt;
    }
});

// Start first level
loadLevel(currentLevel);