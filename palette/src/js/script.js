class Palette {
  constructor() {
    this.mode = 'pensil';
    this.currentColor = '#000000';
    this.prevColor = '#ffffff';
    this.permitDraw = false;
    this.canvas = null;
    this.ctx = null;
    this.scale = 32;
    this.firstPoint = {
      left: null,
      top: null,
    };
    this.busy = false;
  }

  // body load an other events
  bodyLoad() {
    this.createCanvas();
    if (localStorage.getItem('state')) {
      const state = JSON.parse(localStorage.getItem('state'));
      this.mode = state.mode;
      this.currentColor = state.currentColor;
      this.prevColor = state.prevColor;
      this.ctx.fillStyle = this.currentColor;
      document.getElementById('inp-color').value = this.currentColor;
    }
    this.toggleTool(document.querySelector(`#${this.mode}`));
    document.querySelector('#current-color i').style.color = this.currentColor;
    document.querySelector('#prev-color i').style.color = this.prevColor;
    document.querySelector('.left-menu').addEventListener('mousedown', (event) => { this.toggleTool(event); });
    document.querySelector('.left-bottom-menu').addEventListener('mousedown', (event) => { this.toggleColor(event); });
    document.getElementById('inp-color').addEventListener('change', (event) => { this.inputColor(event); });
    // canvas events
    this.canvas.addEventListener('mousedown', (event) => {
      if (this.mode === 'pensil') {
        this.startDraw(event);
      } else if (this.mode === 'fill') {
        if (!this.busy) {
          this.busy = true;
          this.fillPromise(event);
        }
      } else if (this.mode === 'choose-color') {
        this.colorPicker(event);
      }
    });
    this.canvas.addEventListener('mouseup', (event) => { this.stopDraw(event); });
    this.canvas.addEventListener('mousemove', (event) => { this.draw(event); });
    this.canvas.addEventListener('mouseout', (event) => { this.stopDraw(event); });
    // hot key event
    document.addEventListener('keydown', (event) => {
      if (event.code === 'KeyP') {
        this.toggleTool(document.querySelector('#pensil'));
      } else if (event.code === 'KeyB') {
        this.toggleTool(document.querySelector('#fill'));
      } else if (event.code === 'KeyC') {
        this.toggleTool(document.querySelector('#choose-color'));
      } else if (event.code === 'KeyD') {
        this.cleanCanvas();
      }
    });
    document.querySelector('#clean').addEventListener('mousedown', () => {
      this.cleanCanvas();
    });
    window.onbeforeunload = () => {
      this.saveLocalStorage();
    };
  }

  // create canvas layout
  createCanvas() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    if (localStorage.getItem('paletteLayout')) {
      const dataURL = localStorage.getItem('paletteLayout');
      const img = new Image();
      img.src = dataURL;
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0);
      };
    }
    this.ctx.fillStyle = this.currentColor;
  }

  // toggle tool;
  toggleTool(data) {
    let item;
    if (data.tagName) {
      item = data;
    } else {
      item = data.target.closest('li');
    }
    document.querySelector('.left-menu .active').classList.remove('active');
    item.classList.add('active');
    this.mode = document.querySelector('.left-menu .active').getAttribute('id');
  }

  // input color
  inputColor() {
    if (this.currentColor !== document.getElementById('inp-color').value) {
      this.prevColor = this.currentColor;
      this.currentColor = document.getElementById('inp-color').value;
      document.querySelector('#current-color i').style.color = this.currentColor;
      document.querySelector('#prev-color i').style.color = this.prevColor;
      this.ctx.fillStyle = this.currentColor;
    }
  }

  // toggle color
  toggleColor(data) {
    const idData = data.target.closest('li').getAttribute('id');
    if (idData === 'prev-color') {
      const tempColor = this.currentColor;
      this.currentColor = this.prevColor;
      this.prevColor = tempColor;
      document.querySelector('#current-color i').style.color = this.currentColor;
      document.querySelector('#prev-color i').style.color = this.prevColor;
      this.ctx.fillStyle = this.currentColor;
      document.getElementById('inp-color').value = this.currentColor;
    } else if (idData === 'red-color') {
      if (this.currentColor !== '#ff0000') {
        this.prevColor = this.currentColor;
        this.currentColor = '#ff0000';
        document.querySelector('#current-color i').style.color = this.currentColor;
        document.querySelector('#prev-color i').style.color = this.prevColor;
        this.ctx.fillStyle = this.currentColor;
        document.getElementById('inp-color').value = this.currentColor;
      }
    } else if (idData === 'blue-color') {
      if (this.currentColor !== '#0000ff') {
        this.prevColor = this.currentColor;
        this.currentColor = '#0000ff';
        document.querySelector('#current-color i').style.color = this.currentColor;
        document.querySelector('#prev-color i').style.color = this.prevColor;
        this.ctx.fillStyle = this.currentColor;
        document.getElementById('inp-color').value = this.currentColor;
      }
    }
  }

  // finding coords depending on scale
  getCoords(data) {
    const box = this.canvas.getBoundingClientRect();
    return {
      top: Math.floor((data.pageY - box.top + window.pageYOffset) / (512 / this.scale)),
      left: Math.floor((data.pageX - box.left + window.pageXOffset) / (512 / this.scale)),
    };
  }

  // start drawing after mousedown
  startDraw(data) {
    this.permitDraw = true;
    this.firstPoint.left = this.getCoords(data).left;
    this.firstPoint.top = this.getCoords(data).top;
    this.ctx.fillRect(
      this.firstPoint.left,
      this.firstPoint.top, 1, 1,
    );
  }

  // stop drawing after mouseup or mouseout
  stopDraw() {
    this.permitDraw = false;
    this.firstPoint.left = null;
    this.firstPoint.top = null;
  }

  // drawing with Bresenham's line algorithm after mousemove
  draw(data) {
    if (this.permitDraw === true) {
      let x1 = this.firstPoint.left;
      let y1 = this.firstPoint.top;
      const x2 = this.getCoords(data).left;
      const y2 = this.getCoords(data).top;
      this.firstPoint.left = this.getCoords(data).left;
      this.firstPoint.top = this.getCoords(data).top;
      const deltaX = Math.abs(x2 - x1);
      const deltaY = Math.abs(y2 - y1);
      const signX = x1 < x2 ? 1 : -1;
      const signY = y1 < y2 ? 1 : -1;
      let error = deltaX - deltaY;
      this.ctx.fillRect(x2, y2, 1, 1);
      while (x1 !== x2 || y1 !== y2) {
        this.ctx.fillRect(x1, y1, 1, 1);
        const error2 = error * 2;
        if (error2 > -deltaY) {
          error -= deltaY;
          x1 += signX;
        }
        if (error2 < deltaX) {
          error += deltaX;
          y1 += signY;
        }
      }
    }
  }

  fillArea(data) {
    this.busy = true;
    const startX = this.getCoords(data).left;
    const startY = this.getCoords(data).top;
    const fillColor = Palette.colorToRgba(this.currentColor);
    const dstImg = this.ctx.getImageData(0, 0, this.scale, this.scale);
    const dstData = dstImg.data;
    const startPos = this.getPixelPos(startX, startY);
    let startColor = {
      r: dstData[startPos],
      g: dstData[startPos + 1],
      b: dstData[startPos + 2],
      a: dstData[startPos + 3],
    };
    if (fillColor.r === startColor.r
      && fillColor.g === startColor.g
      && fillColor.b === startColor.b
    ) {
      startColor = {
        r: 0,
        g: 0,
        b: 0,
        a: 0,
      };
    }
    const todo = [[startX, startY]];
    while (todo.length) {
      const pos = todo.pop();
      const x = pos[0];
      let y = pos[1];
      let currentPos = this.getPixelPos(x, y);
      y += 1;
      while ((y >= 0) && Palette.matchStartColor(dstData, currentPos, startColor)) {
        y -= 1;
        currentPos -= this.scale * 4;
      }
      currentPos += this.scale * 4;
      let reachLeft = false;
      let reachRight = false;
      y -= 1;
      while ((y < this.scale - 1) && Palette.matchStartColor(dstData, currentPos, startColor)) {
        y += 1;
        Palette.colorPixel(dstData, currentPos, fillColor);
        if (x > 0) {
          if (Palette.matchStartColor(dstData, currentPos - 4, startColor)) {
            if (!reachLeft) {
              todo.push([x - 1, y]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }
        if (x < this.scale - 1) {
          if (Palette.matchStartColor(dstData, currentPos + 4, startColor)) {
            if (!reachRight) {
              todo.push([x + 1, y]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }
        currentPos += this.scale * 4;
      }
    }
    this.ctx.putImageData(dstImg, 0, 0);
    return true;
  }

  // convert format color
  static rgbToHex(data) {
    let r = data.r.toString(16);
    let g = data.g.toString(16);
    let b = data.b.toString(16);
    const { a } = data;
    if (a === 0) {
      r = 'ff';
      g = 'ff';
      b = 'ff';
    } else {
      if (r.length === 1) r = `0${r}`;
      if (g.length === 1) g = `0${g}`;
      if (b.length === 1) b = `0${b}`;
    }
    return `#${r}${g}${b}`;
  }

  colorPicker(data) {
    const startX = this.getCoords(data).left;
    const startY = this.getCoords(data).top;
    const dstImg = this.ctx.getImageData(0, 0, this.scale, this.scale);
    const dstData = dstImg.data;
    const startPos = this.getPixelPos(startX, startY);
    const startColor = {
      r: dstData[startPos],
      g: dstData[startPos + 1],
      b: dstData[startPos + 2],
      a: dstData[startPos + 3],
    };
    const newColor = Palette.rgbToHex(startColor);
    console.log(startColor);
    console.log(newColor);
    this.prevColor = this.currentColor;
    this.currentColor = newColor;
    document.querySelector('#current-color i').style.color = this.currentColor;
    document.querySelector('#prev-color i').style.color = this.prevColor;
    this.ctx.fillStyle = this.currentColor;
    document.getElementById('inp-color').value = this.currentColor;
  }

  // get position in ImageData
  getPixelPos(x, y) {
    return (y * this.scale + x) * 4;
  }

  // return Star Color
  static matchStartColor(data, pos, startColor) {
    return (data[pos] === startColor.r
      && data[pos + 1] === startColor.g
      && data[pos + 2] === startColor.b
      && data[pos + 3] === startColor.a);
  }

  // set pixel color
  static colorPixel(dat, pos, color) {
    const data = dat;
    data[pos] = color.r || 0;
    data[pos + 1] = color.g || 0;
    data[pos + 2] = color.b || 0;
    data[pos + 3] = Object.prototype.hasOwnProperty.call(color, 'a') ? color.a : 255;
  }

  // convert color format
  fillPromise(data) {
    const promiseFill = new Promise((resolve) => {
      if (this.fillArea(data)) {
        setTimeout(() => {
          resolve();
        }, 0);
      }
    });
    promiseFill.then(() => {
      this.busy = false;
    });
  }

  // convert format color
  static colorToRgba(c) {
    let result;
    if (c[0] === '#') {
      const color = c.replace('#', '');
      const bigint = parseInt(color, 16);
      // eslint-disable-next-line no-bitwise
      const r = (bigint >> 16) & 255;
      // eslint-disable-next-line no-bitwise
      const g = (bigint >> 8) & 255;
      // eslint-disable-next-line no-bitwise
      const b = bigint & 255;
      result = {
        r,
        g,
        b,
        a: 255,
      };
    } else if (c.indexOf('rgba(') === 0) {
      const color = c.replace('rgba(', '').replace(' ', '').replace(')', '').split(',');
      result = {
        r: color[0],
        g: color[1],
        b: color[2],
        a: color[3] * 255,
      };
    } else {
      result = {
        r: 0,
        g: 0,
        b: 0,
        a: 0,
      };
    }
    return result;
  }

  saveLocalStorage() {
    if (localStorage.getItem('state')) {
      localStorage.removeItem('paletteLayout');
      localStorage.removeItem('state');
      const state = {
        mode: this.mode,
        currentColor: this.currentColor,
        prevColor: this.prevColor,
      };
      localStorage.setItem('paletteLayout', this.canvas.toDataURL());
      localStorage.setItem('state', JSON.stringify(state));
    } else {
      const state = {
        mode: this.mode,
        currentColor: this.currentColor,
        prevColor: this.prevColor,
      };
      localStorage.setItem('state', JSON.stringify(state));
    }
  }

  cleanCanvas() {
    this.ctx.clearRect(0, 0, this.scale, this.scale);
  }
}

const palette = new Palette();
document.body.addEventListener('load', palette.bodyLoad());
