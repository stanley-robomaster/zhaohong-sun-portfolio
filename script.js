document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

document.querySelectorAll('[data-email]').forEach((link) => {
  const address = link.dataset.email;
  const label = link.querySelector('[data-email-label]');
  if (label) label.textContent = address;
  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.assign(`mailto:${address}`);
  });
});

function decodeRle(source) {
  const rows = [[]];
  let x = 0;
  let y = 0;
  let count = '';
  for (const symbol of source) {
    if (/\d/.test(symbol)) {
      count += symbol;
      continue;
    }
    if (symbol === 'b' || symbol === 'o') {
      const run = Number(count) || 1;
      if (symbol === 'o') {
        for (let step = 0; step < run; step += 1) rows[y][x + step] = 1;
      }
      x += run;
      count = '';
    } else if (symbol === '$') {
      const skip = Number(count) || 1;
      for (let step = 0; step < skip; step += 1) {
        y += 1;
        if (!rows[y]) rows[y] = [];
      }
      x = 0;
      count = '';
    } else if (symbol === '!') {
      break;
    }
  }
  return rows;
}

const patterns = {
  period32P21: decodeRle('5b2o$5b2o2$bo$obo$bo3b3o$9bo$5bo4bo$5bo3bo$6bo3bo$5bo4bo$6bo$8b3o3bo$13bobo$14bo2$9b2o$9b2o!'),
  period104P9: decodeRle('8b2o$6bo4bo$2b2o10b2o$2bo2bo6bo2bo$3b3ob4ob3o$6bo4bo$3b3o6b3o$2bo12bo$3b5o2b5o$8b2o$5b2o4b2o$4bobo4bobo$4b2o6b2o3$6b2o2b2o$5bo2b2o2bo$3bobob4obobo$b3obobo2bobob3o$o3b2ob4ob2o3bo$b2o3bo4bo3b2o$3b2o2bo2bo2b2o$3bob2o4b2obo!'),
  period37P10_1: decodeRle('2b2o5b2o2b$2bobo3bobo2b$3bo5bo3b$o5bo5bo$5o3b5o$5bobo5b$2b2o5b2o2b$2bo7bo2b$3bo5bo3b$2b2o5b2o!'),
  period72P21: decodeRle('19bo$17b3o$16bo$16b2o2$13b2o$13bobo$14b2o6$17b2o8b2o$2o14bobo7bobo$bo11b2obo9b2o$bobo9bo4b2o10b2o$2b2o10b2o4bo9bobo$6b2o9bob2o11bo$5bobo7bobo14b2o$5b2o8b2o6$18b2o$18bobo$19b2o2$16b2o$17bo$14b3o$14bo!')
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvases = [...document.querySelectorAll('.life-canvas')];

function normalize(pattern) {
  const width = Math.max(...pattern.map((row) => row.length));
  const empty = Array(width + 4).fill(0);
  return [empty.slice(), empty.slice(), ...pattern.map((row) => [0, 0, ...Array.from({ length: width }, (_, x) => row[x] || 0), 0, 0]), empty.slice(), empty.slice()];
}

function nextGeneration(board) {
  const height = board.length;
  const width = board[0].length;
  return board.map((row, y) => row.map((cell, x) => {
    let neighbors = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        neighbors += board[(y + dy + height) % height][(x + dx + width) % width];
      }
    }
    return neighbors === 3 || (cell && neighbors === 2) ? 1 : 0;
  }));
}

function drawLife(canvas, board) {
  const context = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  context.clearRect(0, 0, width, height);
  const cellSize = Math.max(4, Math.floor(Math.min(width / (board[0].length + 4), height / (board.length + 4))));
  const offsetX = (width - board[0].length * cellSize) / 2;
  const offsetY = (height - board.length * cellSize) / 2;
  const color = getComputedStyle(canvas).color || '#14344b';
  context.fillStyle = color;
  board.forEach((row, y) => row.forEach((cell, x) => {
    if (cell) context.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, Math.max(2, cellSize - 1), Math.max(2, cellSize - 1));
  }));
}

canvases.forEach((canvas) => {
  const source = patterns[canvas.dataset.pattern];
  if (!source) return;
  let board = normalize(source);
  const render = () => drawLife(canvas, board);
  render();
  if (!reducedMotion) {
    window.setInterval(() => { board = nextGeneration(board); render(); }, 650);
  }
  window.addEventListener('resize', render);
});
