import { Board } from './cells/board';
import { Token, ActiveToken, PassiveToken } from './cells/token';
// |

class Cells {

    constructor(selector, size, config){

        this.cellSize = 0

        Object.assign(this, config)

        this._board = new Board(size)

        this.element = document.querySelector(selector)
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext('2d')
        this.ctx._roundRect = this._roundRect

        // in board coords
        this.cursor = null
        this.selected = null

        // text
        this.baseFontSize = Math.floor(this.cellSize * 0.29)
        this.textFont = `bold ${ this.baseFontSize }px 'Georgia', serif`
        this.picFont = `${ this.baseFontSize * 2 }px 'Icons'`

        // paddings & styles
        this.canvasPadding = Math.floor(this.cellSize * 0.05)
        this.cellPadding = Math.floor(this.cellSize * 0.05)
        this.tokenSize = this.cellSize - this.cellPadding * 2
        this.rectRound = Math.floor(this.cellSize * 0.07)

        this.canvas.width = this.cellSize * this._board.cols + this.canvasPadding * 2
        this.canvas.height = this.cellSize * this._board.rows + this.canvasPadding * 2
        this.element.appendChild(this.canvas)
        
        this._frameCallback = this._frame.bind(this)
        this._attachEvents()
    }

    _attachEvents(){

        // cursor & cursor coords
        this.canvas.addEventListener('mouseover', (function(e){
            
            const moveHandler = (function(e){
                const cursorPix = this._toCanvasPixels(e),
                      hoverCoords = this._getHoverCoords(cursorPix),
                      cursorType = hoverCoords ? 'pointer' : 'default'
                    
                this.cursor = hoverCoords
                this.canvas.style.cursor = cursorType
            }).bind(this)

            this.canvas.addEventListener('mouseleave', (function(e){
                this.canvas.removeEventListener('mousemove', moveHandler, false)
                this.cursor = null
            }).bind(this), false)

            this.canvas.addEventListener('mousemove', moveHandler, false)

        }).bind(this), false)

        // click & selected
        this.canvas.addEventListener('click', (function(e){
            const coords = this._getHoverCoords(this._toCanvasPixels(e))

            if(coords){
                if(this._board.getItem(coords) instanceof ActiveToken){
                    this.selected = coords
                }
            }

        }).bind(this), false)
    }

    _toCanvasPixels(e){
        const tag = e.target,
              left = tag.offsetLeft,
              top = tag.offsetTop,
              x = e.pageX - left,
              y = e.pageY - top;

        return [x, y]
    }

    // returns null or token coords if cursor is on it
    _getHoverCoords(coords){
        const canvPad = this.canvasPadding,
              height = this.canvas.height - canvPad,
              width = this.canvas.width - canvPad,
              cellPad = this.cellPadding,
              tSize = this.tokenSize

        if(
            (coords[0] < canvPad || coords[1] < canvPad) ||
            (coords[0] > width || coords[1] > height)
        ){
            return null
        }

        const toCellX = (coords[0] - canvPad) % (tSize + cellPad * 2),
              toCellY = (coords[1] - canvPad) % (tSize + cellPad * 2),
              x = Math.floor((coords[0] - canvPad) / (tSize + cellPad * 2)),
              y = Math.floor((coords[1] - canvPad) / (tSize + cellPad * 2))

        return (
            (toCellX > cellPad && toCellY > cellPad) &&
            (
                (toCellX < tSize + Math.floor(cellPad * 1.4)) && 
                (toCellY < tSize + Math.floor(cellPad * 1.4))
            )
        ) ? [y,x] : null
    }

    _roundRect(ctx, x, y, width, height, radius = 5, fill = true, stroke = true){
 
        if (typeof radius === 'number') {
          radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
          var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
          for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
          }
        }

        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        if (fill) {
          ctx.fill();
        }
        if (stroke) {
          ctx.stroke();
        }
    }

    _clear(){
        const ctx = this.ctx
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    load(data){
        const tokens = data.map((primitive) => Token.create(primitive))
        this._board.fill(tokens)
    }

    draw(){
        const ctx = this.ctx,
              tokenSize = this.tokenSize,
              cellSize = this.cellSize,
              cellPadding = this.cellPadding,
              roundRect = this._roundRect,
              rectRound = this.rectRound,
              canvasPadding = this.canvasPadding
        
        this._clear()

        for(let i = 0, len = this._board.length; i < len; i++){

            const line = Math.floor(i / this._board.cols),
                  item = i % this._board.cols,
                  coords = [line, item]  // coords of current index
                  
            const token = this._board.getItem(coords)

            // local pixel coords for shapes
            const x = item * cellSize + canvasPadding + cellPadding,
                  y = line * cellSize + canvasPadding + cellPadding

            // free cell
            if(token === null){
                continue
            }
            
            const config = {
                x,
                y,
                cellSize,
                tokenSize,
                rectRound,  // round size
                roundRect,  // function
                cellPadding,
            }


            if(token instanceof ActiveToken){
                
                config.font = this.textFont
                config.isActive = false
                config.isHover = false
                
                const s = this.selected
                if(s && (s[0] === coords[0] && s[1] === coords[1])){
                    config.isActive = true
                }

                const c = this.cursor
                if(c && (c[0] === coords[0] && c[1] === coords[1])){
                   config.isHover = true
                }
            }

            if(token instanceof PassiveToken){
                config.font = this.picFont
            }
            
            token.draw(ctx, config)
        }

        window.requestAnimationFrame(this._frameCallback)
    }

    _frame(){
        this.draw()
    }

    run(){
        window.requestAnimationFrame(this._frameCallback)
    }
}

/*************  Test  ****************/
const size = [3, 5]
const map = [
    1, 2, 3, 4, 5,
    null, 'Rock', 6, 7, 8,
    9, 10, 11, 'Tree', null,
]


const cells = new Cells('#app', size, { cellSize: 80 })
cells.load(map)
cells.run()
console.log(cells)