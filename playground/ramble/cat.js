// Ramble's pixel-art cat, ported from the app's Sources/Cat.swift so the demo
// draws the same sprite, pixel for pixel.
const Cat = (() => {
  const WIDTH = 48;        // 18-column cat + 6-column tail, with 12 columns of margin each side
  const HEIGHT = 22;
  const MARGIN = 12;
  const HEAD_ROWS = 14;    // rows above this belong to the head (and move with it)
  const BODY_COLUMNS = 18; // columns at or beyond this are the tail
  const BALL_SIZE = 6;
  const BALL_AT_LEFT_PAW = -2;
  const BALL_AT_RIGHT_PAW = 14;

  const palette = {
    k: '#3b2940', // outline
    o: '#f7a85c', // orange fur
    s: '#e0853d', // stripes
    w: '#fff2de', // cream muzzle and chest
    p: '#f5a3b5', // pink ears and blush
    n: '#e8708a', // nose
    e: '#3b2940', // eyes
    h: '#ffffff', // eye shine
    r: '#e35c78', // yarn
    q: '#faabbd', // yarn strand highlight
    g: '#736173', // whiskers
  };

  // Left half of everything below the ears (grid rows 7–21), mirrored to make the 18-column cat.
  const leftHalf = [
    'kooooosos',
    'koooooooo',
    'koooooooo',
    'koooooooo',
    'kooppooon',
    'koooookok',
    'kkoooooko',
    '.koooooow',
    '.koooowww',
    'koooowwww',
    'koooowwww',
    'ksooowwww',
    'ksoooowww',
    'koowwkoow',
    '.........',
  ];

  // One ear (left side) for grid rows 1–6; the right ear is its mirror image.
  const earArt = {
    normal:  ['.........', '..k......', '..kk.....', '..kpk....', '.kppok...', '.kppookkk'],
    perked:  ['..k......', '..kk.....', '..kpk....', '.kppk....', '.kppok...', '.kppookkk'],
    lowered: ['.........', '.........', 'kk.......', '.kpk.....', '.kppok...', '.kppookkk'],
  };

  // The 6 columns right of the body (grid rows 12–21), per tail pose.
  const tails = {
    up:    ['..kk..', '.kook.', '.kosk.', '.kook.', '.kosk.', '.kook.', 'kook..', 'kok...', 'kk....', '......'],
    swish: ['......', '...kk.', '..kook', '..kosk', '.kook.', '.kosk.', 'kook..', 'kok...', 'kk....', '......'],
  };

  const earPairs = {
    normal: ['normal', 'normal'],
    perked: ['perked', 'perked'],
    tiltLeft: ['lowered', 'perked'],
    tiltRight: ['perked', 'lowered'],
    twitch: ['normal', 'lowered'],
    flat: ['lowered', 'lowered'],
  };

  const mirror = row => row + [...row].reverse().join('');

  function grid({ eyes = 'open', ears = 'normal', tail = 'up' }) {
    const [leftEar, rightEar] = earPairs[ears];
    const rows = ['.'.repeat(18)];
    for (let i = 0; i < 6; i++) {
      rows.push(earArt[leftEar][i] + [...earArt[rightEar][i]].reverse().join(''));
    }
    leftHalf.forEach(r => rows.push(mirror(r)));
    const cells = rows.map(r => [...r]);

    // Eyes cover columns 3–6 (mirrored 11–14).
    const setEyes = (row, pattern) => [...pattern].forEach((c, i) => {
      cells[row][3 + i] = c;
      cells[row][14 - i] = c;
    });
    switch (eyes) {
      case 'open':   setEyes(9, 'oeho'); setEyes(10, 'oeeo'); break;
      case 'lookUp': setEyes(8, 'oeho'); setEyes(9, 'oeeo'); break;
      case 'wide':   setEyes(8, 'oeho'); setEyes(9, 'oeeo'); setEyes(10, 'oeeo'); break;
      case 'blink':
      case 'closed': setEyes(10, 'okko'); break;
      case 'happy':  setEyes(9, 'okko'); setEyes(10, 'kook'); break;
    }

    let tailRows;
    if (tail === 'happy' || tail === 'happyFlick') {
      const tip = tail === 'happy' ? ['...kk.', '..kook', '.kook.'] : ['..kk..', '.kook.', '.kook.'];
      tailRows = Array(4).fill('......').concat(tip, ['.kook.', '.kosk.', '.kook.', '.kook.', '.kosk.',
        '.kook.', '.kook.', '.kosk.', '.kook.', '.kook.', 'kook..', 'kok...', 'kk....', '......', '......']);
    } else {
      tailRows = Array(12).fill('......').concat(tails[tail]);
    }
    return cells.map((row, i) => row.concat([...tailRows[i]]));
  }

  // Two soft whiskers each side of the face; they move with the head.
  const whiskers = (() => {
    const left = [[-1, 11], [-2, 11], [-1, 13], [-2, 13]];
    return left.concat(left.map(([x, y]) => [17 - x, y]));
  })();

  // A 6×6 ball of yarn; `frame` shifts the strands so it looks like it's rolling.
  function yarn(frame) {
    const pixels = [];
    const mid = (BALL_SIZE - 1) / 2, r = BALL_SIZE / 2 + 0.2;
    for (let y = 0; y < BALL_SIZE; y++) {
      for (let x = 0; x < BALL_SIZE; x++) {
        const d = Math.hypot(x - mid, y - mid);
        if (d > r) continue;
        pixels.push([x, y, d > r - 1.1 ? 'k' : (x + y + frame) % 3 === 0 ? 'q' : 'r']);
      }
    }
    return pixels;
  }

  // The batting paw, pressed flat against the ball's outer side.
  function batPaw(side, ballX) {
    const px = ballX - 1, py = 21 - BALL_SIZE;
    const shape = ['.k.', 'kwk', 'kwk', 'kwk', '.k.'];
    const left = [];
    shape.forEach((row, dy) => [...row].forEach((c, dx) => {
      if (c !== '.') left.push([px + dx, py + dy, c]);
    }));
    return side === 'left' ? left : left.map(([x, y, c]) => [2 * ballX + BALL_SIZE - 1 - x, y, c]);
  }

  const liftedFoot = side => side === 'left' ? [3, 4] : [13, 14];

  // Draws one pose. `nod` moves the head down, `tilt` (-1, 0, 1) shifts it sideways.
  function draw(ctx, scale, pose) {
    const { paw = null, ball = null, nod = 0, tilt = 0 } = pose;
    const cells = grid(pose);
    ctx.clearRect(0, 0, WIDTH * scale, HEIGHT * scale);
    const fill = (x, y, c) => {
      const color = palette[c];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect((x + MARGIN) * scale, y * scale, scale, scale);
    };
    const isHead = (x, y) => y < HEAD_ROWS && x < BODY_COLUMNS;
    const shift = Math.sign(tilt);
    const lifted = paw ? liftedFoot(paw) : [];

    // Body and tail first, then the head on top so a nod overlaps the neck.
    cells.forEach((row, y) => row.forEach((c, x) => {
      if (!isHead(x, y)) fill(x, y, y === 20 && lifted.includes(x) ? 'o' : c);
    }));
    cells.forEach((row, y) => row.forEach((c, x) => {
      if (isHead(x, y)) fill(x + shift, y + nod, c);
    }));
    whiskers.forEach(([x, y]) => fill(x + shift, y + nod, 'g'));
    if (ball) yarn(ball.frame).forEach(([x, y, c]) => fill(ball.x + x, 21 - BALL_SIZE + y, c));
    if (paw && ball) batPaw(paw, ball.x).forEach(([x, y, c]) => fill(x, y, c));
  }

  // One 2.8 s round of batting the yarn: left paw bats, it rolls across, right paw bats it back.
  function play(seconds) {
    const left = BALL_AT_LEFT_PAW, right = BALL_AT_RIGHT_PAW;
    const c = seconds % 2.8;
    const smooth = p => { p = Math.min(Math.max(p, 0), 1); return p * p * (3 - 2 * p); };
    let x, paw = null;
    if (c < 0.4) { x = left; paw = 'left'; }
    else if (c < 1.4) x = left + (right - left) * smooth((c - 0.4) / 1.0);
    else if (c < 1.8) { x = right; paw = 'right'; }
    else x = right + (left - right) * smooth((c - 1.8) / 1.0);
    const ballX = Math.round(x);
    const center = ballX + BALL_SIZE / 2;
    return {
      paw,
      ball: { x: ballX, frame: ((ballX % 4) + 4) % 4 },
      tilt: center < 5 ? -1 : center > 12 ? 1 : 0,
    };
  }

  // Small white pixel glyphs: "Z" for dozing, "!" for being startled awake.
  const glyphs = {
    z: ['kkkk', '..k.', '.k..', 'kkkk'],
    bang: ['k', 'k', 'k', '.', 'k'],
  };

  return { WIDTH, HEIGHT, palette, draw, play, glyphs };
})();
