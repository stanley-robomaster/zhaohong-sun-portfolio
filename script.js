document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const patterns = {
  block: [[1,1],[1,1]],
  beacon: [[1,1,0,0],[1,1,0,0],[0,0,1,1],[0,0,1,1]],
  pulsar: [
    '  111   111  ', '             ', '1    1 1    1', '1    1 1    1', '1    1 1    1',
    '  111   111  ', '             ', '  111   111  ', '1    1 1    1', '1    1 1    1',
    '1    1 1    1', '             ', '  111   111  '
  ].map((row) => [...row].map((cell) => cell === '1' ? 1 : 0)),
  gosper: [
    '...........................1........',
    '.........................1.1........',
    '...............11......11............',
    '..............1...1....11............',
    '...11........1.....1...11............',
    '..1..1.......1...1.1................',
    '..1..1.......1.....1................',
    '..1..1........1...1.................',
    '...11..........11...................',
    '.....................................',
    '.....................................'
  ].map((row) => [...row].map((cell) => cell === '1' ? 1 : 0))
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvases = [...document.querySelectorAll('.life-canvas')];

function normalize(pattern) {
  const width = Math.max(...pattern.map((row) => row.length));
  return pattern.map((row) => [...row, ...Array(width - row.length).fill(0)]);
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
