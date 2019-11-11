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
    this.toggleTool(document.querySelector('#pensil'));
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
    document.querySelector('#clean').addEventListener('mousedown', (event) => {
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
    this.prevColor = this.currentColor;
    this.currentColor = document.getElementById('inp-color').value;
    document.querySelector('#current-color i').style.color = this.currentColor;
    document.querySelector('#prev-color i').style.color = this.prevColor;
    this.ctx.fillStyle = this.currentColor;
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
      this.prevColor = this.currentColor;
      this.currentColor = '#ff0000';
      document.querySelector('#current-color i').style.color = this.currentColor;
      document.querySelector('#prev-color i').style.color = this.prevColor;
      this.ctx.fillStyle = this.currentColor;
      document.getElementById('inp-color').value = this.currentColor;
    } else if (idData === 'blue-color') {
      this.prevColor = this.currentColor;
      this.currentColor = '#0000ff';
      document.querySelector('#current-color i').style.color = this.currentColor;
      document.querySelector('#prev-color i').style.color = this.prevColor;
      this.ctx.fillStyle = this.currentColor;
      document.getElementById('inp-color').value = this.currentColor;
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



  cleanCanvas() {    
    this.ctx.clearRect(0, 0, this.scale, this.scale);
  }
}

const palette = new Palette();
document.body.addEventListener('load', palette.bodyLoad());
