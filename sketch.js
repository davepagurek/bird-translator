let started = false
let mic
let fft
let message = ''
let birdBuffer = []
let levelsBuffer = []


const MIN_BIN = 4
const BIRD_DEBOUNCE_COUNT = 2
const WORD_GAP_COUNT = 20

function setup() {
  createCanvas(windowWidth, windowHeight)
  
  mic = new p5.AudioIn()
  fft = new p5.FFT()
  mic.connect(fft)
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
}

function draw() {
  background(255);
  push()
  translate(width/2, height/2)
  textSize(min(width, height) * 0.05)
  
  if (!started) {
    textAlign(CENTER, CENTER)
    text('Tap to start translating', 0, 0)
    
    push()
    translate(width/2, height/2)
    scale(Math.min(width/2, height/2)/400)
    drawBird(false, 0)
    pop()
  } else {
    noStroke()
    let spectrum = fft.analyze().slice(0, 16)
    spectrum = spectrum.map((v, i) => {
      return pow(map(v, 0, 0.1, 0, 1, true), map(i, 0, spectrum.length, 1, 0.5))
    })

    if (frameCount % 2 === 0 && spectrum.length > 1) {
      const level = spectrum.slice(MIN_BIN).sort((a, b) => a - b).at(floor((spectrum.length-MIN_BIN) * 0.85))
      levelsBuffer.unshift(level)
      if (levelsBuffer.length > 10 * 30) {
        levelsBuffer.pop()
      }
    }
    const baseline = Math.max(
      0.1,
      levelsBuffer.length < 2
        ? 0.5
        : levelsBuffer.slice().sort((a, b) => a - b).at(ceil(levelsBuffer.length * 0.75))
    )
    
    // const bird =
    //   levelsBuffer.length > 3 * 30 &&
    //   spectrum.slice(10).filter(v => v > baseline * 1.5).length >= 6
    
    const peak = Math.max(...spectrum.slice(MIN_BIN))
    const peakBin = spectrum.indexOf(peak)
    const bird =
      levelsBuffer.length > 5 * 30 &&
      peak > baseline * 1.5 &&
      peakBin > 1 &&
      peakBin < 16 &&
      spectrum.every((v, i) => i < MIN_BIN || Math.abs(i - peakBin) < 2 || v < peak * 0.5) &&
      spectrum.slice(0, MIN_BIN).every(v => v < peak * 1.5)
      
    
    // console.log(round(baseline, 2) + ', ' + round(peak, 2) + ': ' + peakBin)
    
    const currentBird = birdBuffer.slice(0, BIRD_DEBOUNCE_COUNT).every((bird) => bird)

    // const bird = spectrum.slice(10).filter(v => v > 0.1).length >= 17
    birdBuffer.unshift(bird)
    if (birdBuffer.length > 3 * 60) {
      birdBuffer.pop()
    }
    fill(currentBird ? 'green' : 'red')
    
    for (let i = 0; i < spectrum.length; i++) {
      let x = map(i, 0, spectrum.length - 1, -width/2, width/2)
      let h = map(spectrum[i], 0, 1, 0, height * 0.3)
      rect(x, -h/2 - height * 0.25, width / spectrum.length, h, 8)
    }
    
    if (
      birdBuffer.slice(0, BIRD_DEBOUNCE_COUNT).every((bird) => bird) &&
      birdBuffer.slice(BIRD_DEBOUNCE_COUNT, BIRD_DEBOUNCE_COUNT + WORD_GAP_COUNT).every((bird) => !bird)
    ) {
      message += (message ? ' ' : '') + makeHey()
    }
    
    if (birdBuffer.every((bird) => !bird)) {
      message = ''
    }
    
    fill(0)
    textAlign(CENTER, CENTER)
    // text(spectrum.slice(10).filter(v => v > 0.1).length, 0, 100)
    // text(bird ? 'BIRD' : 'NOT BIRD', 0, 70)
    rectMode(CENTER)
    text(`Message:\n${message}`, 0, 50, width - 20)
    
    push()
    translate(width/2, height/2)
    scale(Math.min(width/2, height/2)/400)
    drawBird(bird, peak)
    pop()
  }
  
  pop()
}

function makeHey() {
  const numEs = round(1 + pow(random(), 2) * 10)
  let msg = 'H'
  for (let i = 0; i < numEs; i++) {
    msg += 'e'
  }
  msg += 'y!'
  
  if (random() < 0.2) {
    msg = msg.toUpperCase()
  }
  return msg
}

let open = 0
function drawBird(bird, peak) {
  const targetOpen = (bird ? 1 : 0) * pow(peak, 0.5)
  open = lerp(open, targetOpen, 0.8)
  stroke('#F8C97A')
  strokeWeight(6)
  line(-80, 0, -50, -70 - open * 15)
  line(-100, 0, -70, -70 - open * 15)
  noStroke()
  fill('#C2A2A2')
  translate(0, -open * 15)
  push()
  translate(-100, -100)
  scale(1.2, 0.9)
  circle(0, 0, 150)
  pop()
  triangle(
    -100, -100,
    -60, -160,
    0, -50
  )
  translate(-160, -180 - open * 15)
  circle(0, 0, 80)
  fill(0)
  circle(0, 0, 20)
  fill('#F8C97A')
  beginShape(TRIANGLES)
  vertex(-30, 0)
  vertex(-35, -10)
  vertex(-70, -open * 20)
  vertex(-30, 0)
  vertex(-35, 10)
  vertex(-70, open * 20)
  endShape()
}

function mouseClicked() {
  started = true
  mic.start()
}
