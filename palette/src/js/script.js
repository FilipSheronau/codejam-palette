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

  
}

const palette = new Palette();
document.body.addEventListener('load', palette.bodyLoad());
