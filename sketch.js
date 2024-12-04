let tSize = 250; // Text size
let particleSpeed = 8; // Particle speed
let attractionRadius = 25; // Radius within which particles are attracted to the cursor
let particles = [];
let cursorSize = 50; // Cursor size
let word = "hello"; // The word to display
let collected = false; // Tracks if all particles have reached their targets
let dispersing = false; // Tracks if the particles are in dispersal mode

// Sounds
let collectSound, disperseSound, formSound;
let soundsLoaded = false; // Boolean to track if sounds are loaded

let pulseSize = 24; // Initial pulse size
let pulseDirection = 1; // Pulse direction

function preload() {
  font = loadFont("Bolden-Display.ttf"); // Replace with your bold and tyrannical-style font file
  collectSound = loadSound("collect.mp3", soundLoaded);
  formSound = loadSound("form.mp3", soundLoaded);
}

// Callback to confirm sounds are loaded
let soundsToLoad = 2; // Number of sounds to load
function soundLoaded() {
  soundsToLoad--;
  if (soundsToLoad === 0) {
    soundsLoaded = true;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupWord(word); // Initialize particles to form the word
  cursor('none'); // Hide the default system cursor
}

function draw() {
  background(128, 0, 32); // Background color

  // Check if all particles are stuck to the cursor
  collected = particles.every((p) => p.stuckToCursor);

  // If all particles are stuck to the cursor and we're not dispersing, trigger the webpage redirect
  if (collected && !dispersing) {
    setTimeout(() => {
      window.open("https://www.example.com", "_blank"); // Replace with your desired URL
    }, 1000); // Wait for a second after all particles are collected before redirecting
  }

  // Update and display each particle
  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];
    p.update();
    p.behaviors();
    p.show();
  }

  // Draw the transparent circle (custom cursor)
  fill(255, 255, 0, 50); // Semi-transparent yellow
  noStroke();
  ellipse(mouseX, mouseY, cursorSize, cursorSize);

  // Display "Click Here" text in the middle of the canvas if particles are collected
  if (collected && !dispersing) {
    // Check if the cursor is over the "Click Here" text
    let textWidthVal = textWidth("Click Here");
    let textHeightVal = textAscent() + textDescent();
    let textX = width / 2 - textWidthVal / 2;
    let textY = height / 2 - textHeightVal / 2;

    // If cursor is within the bounds of the text
    let isHovering = mouseX > textX && mouseX < textX + textWidthVal &&
                     mouseY > textY && mouseY < textY + textHeightVal;

    // Pulsing effect only when hovering
    if (isHovering) {
      pulseSize += pulseDirection * 2; // Adjust the speed of the pulse
      if (pulseSize > 30 || pulseSize < 24) {
        pulseDirection *= -1; // Reverse the direction of the pulse when the text size reaches limits
      }
    }

    fill(255, 223, 0); // Yellow color
    textSize(pulseSize); // Pulsing text size
    textAlign(CENTER, CENTER);
    textFont("Georgia"); // Tyrannical bold font style, can replace with any suitable font
    text("Click Here", width / 2, height / 2); // Click Here text

    // Draw a border around the text to highlight it
    noFill();
    stroke(255, 223, 0); // Yellow border
    strokeWeight(4);
    rectMode(CENTER);
    rect(width / 2, height / 2, textWidthVal + 20, textHeightVal + 20); // Border around the text
  }
}

function setupWord(word) {
  particles = []; // Clear any existing particles
  let points = font.textToPoints(word, 0, 0, tSize, {
    sampleFactor: 0.15, // Adjust for more or fewer particles
  });

  // Center the word on the canvas
  let bounds = font.textBounds(word, 0, 0, tSize);
  let offsetX = (width - bounds.w) / 2 - bounds.x;
  let offsetY = (height - bounds.h) / 2 - bounds.y;

  for (let i = 0; i < points.length; i++) {
    let pt = points[i];
    let particle = new Particle(pt.x + offsetX, pt.y + offsetY, particleSpeed);
    particles.push(particle);
  }
}

function Particle(x, y, m) {
  this.pos = createVector(width / 2, height / 2); // Start at the center of the canvas
  this.target = createVector(x, y); // Position forming the word
  this.vel = createVector();
  this.acc = createVector();
  this.maxSpeed = m;
  this.stuckToCursor = false; // Check if the particle is stuck to the cursor
  this.r = 4; // Particle size
  this.arrived = false; // Tracks if the particle has reached its target
}

Particle.prototype.behaviors = function () {
  let mouse = createVector(mouseX, mouseY);

  if (this.stuckToCursor) {
    // Stick to the cursor and move with it
    let angle = random(TWO_PI);
    let distance = random(0, cursorSize / 2);
    this.pos.x = mouseX + cos(angle) * distance;
    this.pos.y = mouseY + sin(angle) * distance;

    // If dispersing or cursor moves away, allow the particle to disperse or form the word
    if (dispersing || p5.Vector.dist(this.pos, mouse) > cursorSize) {
      this.stuckToCursor = false;
    }
  } else if (!dispersing && dist(this.pos.x, this.pos.y, mouseX, mouseY) < attractionRadius) {
    // If the particle is near the cursor, stick to it
    this.stuckToCursor = true;
    if (soundsLoaded && !collected) collectSound.play(); // Play collect sound when a particle is collected
  } else if (dispersing) {
    // Random dispersal
    let randomForce = p5.Vector.random2D().mult(2);
    this.applyForce(randomForce);
  } else {
    // Move towards the target position to form the word
    let arrive = this.arrive(this.target);
    this.applyForce(arrive);

    // Check if the particle has reached its target
    if (p5.Vector.dist(this.pos, this.target) < 5) {
      this.arrived = true;
      this.vel.set(0, 0);
    }
  }
};

Particle.prototype.applyForce = function (force) {
  this.acc.add(force);
};

Particle.prototype.arrive = function (target) {
  let desired = p5.Vector.sub(target, this.pos);
  let d = desired.mag();
  let speed = this.maxSpeed;
  if (d < 100) {
    // Slow down as the particle approaches its target
    speed = map(d, 0, 100, 0, this.maxSpeed);
  }
  desired.setMag(speed);
  let steer = p5.Vector.sub(desired, this.vel);
  return steer;
};

Particle.prototype.update = function () {
  this.pos.add(this.vel);
  this.vel.add(this.acc);
  this.acc.mult(0);
};

Particle.prototype.show = function () {
  fill(255, 223, 0); // Particle color
  noStroke();
  ellipse(this.pos.x, this.pos.y, this.r, this.r); // Draw the particle
};

let clickCount = 0;

function mousePressed() {
  if (soundsLoaded) {
    if (clickCount === 0 && !dispersing) {
      // First click: Trigger dispersal
      particles.forEach((p) => {
        p.arrived = false; // Reset arrival flag for future interactions
        p.stuckToCursor = false; // Allow particles to disperse
      });
      dispersing = true;
      clickCount++;
    } else if (clickCount === 1 && dispersing) {
      // Second click: Return to forming the word
      formSound.play(); // Play forming sound when returning to form the word
      particles.forEach((p) => {
        p.arrived = false; // Reset arrival flag
        p.stuckToCursor = false; // Ensure particles can form the word
      });
      dispersing = false;
      clickCount = 0;
    }
  }
}
