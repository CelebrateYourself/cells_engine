import { Board } from './cells/board';

// |

class Cells {

    constructor(selector, size, config){

        this.cellSize = 0
        
        Object.assign(this, config)

        this.rows = size[0]
        this.cols = size[1]
        this.board = Array(this.rows * this.cols)
        this.board.fill(null)

        this.element = document.querySelector(selector)
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext('2d')

        this.cursor = null
        this.selected = null

        this.textFontSize = Math.floor(this.cellSize * 0.29)
        this.textFont = `bold ${ this.textFontSize }px 'Georgia', serif`
        this.picFont = `${ this.textFontSize * 2 }px 'Icons'`

        this.canvasPadding = Math.floor(this.cellSize * 0.05)
        this.cellPadding = Math.floor(this.cellSize * 0.05)
        this.tokenSize = this.cellSize - this.cellPadding * 2

        this.canvas.width = this.cellSize * this.cols + this.canvasPadding * 2
        this.canvas.height = this.cellSize * this.rows + this.canvasPadding * 2
        this.element.appendChild(this.canvas)

        this._frameCallback = this._frame.bind(this)
        this._attachEvents()
    }

    _attachEvents(){
        this.canvas.addEventListener('mouseover', (function(e){
            const moveHandler = (function(e){
                let cursorCoords = this._toCanvasPixels(e),
                    cursorType = 'default',
                    hoverCoords = this._getHoverCoords(cursorCoords)
                
                this.cursor = cursorCoords

                if(hoverCoords){
                    cursorType = 'pointer'
                }

                this.canvas.style.cursor = cursorType
            }).bind(this)

            this.canvas.addEventListener('mouseleave', (function(e){
                this.canvas.removeEventListener('mousemove', moveHandler, false)
                this.cursor = null
            }).bind(this), false)

            this.canvas.addEventListener('mousemove', moveHandler, false)

        }).bind(this), false)

        this.canvas.addEventListener('click', (function(e){
            const coords = this._getHoverCoords(this._toCanvasPixels(e))

            if(coords){
                const i = this._toBoardIndex(coords)
                if(typeof(this.board[i]) === 'number'){
                    this.selected = i
                }
            }

        }).bind(this), false)
    }

    _toBoardIndex(coords){
        return this.cols * coords[1] + coords[0]
    }

    _toCanvasPixels(e){
        const tag = e.target,
              left = tag.offsetLeft,
              top = tag.offsetTop,
              x = e.pageX - left,
              y = e.pageY - top;

        return [x, y]
    }

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
            (toCellX < tSize + Math.floor(cellPad * 1.4) && toCellY < tSize + Math.floor(cellPad * 1.4))
        ) ? [x,y] : null
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

    load(dataArray){
        const board = this.board

        if(
            !(dataArray instanceof Array)
            || dataArray.length !== board.length    
        ){
            throw RangeError(`\
${this.constructor.name}.load: the load data must be \
an Array[${ board.length }]`)
        }

        dataArray.forEach((raw, i) => {
            // validations
            board[i] = raw
        })
    }

    draw(){
        const ctx = this.ctx,
              board = this.board,
              cellSize = this.cellSize,
              tokenSize = this.tokenSize,
              cellPadding = this.cellPadding,
              canvasPadding = this.canvasPadding,
              rectRound = Math.floor(this.cellSize * 0.07)
        
        let hovered = null

        // clear
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        for(let i = 0, len = board.length; i < len; i++){
            // free cell
            if(board[i] === null){
                continue
            }

            const line = Math.floor(i / this.cols),
                  item = i % this.cols

            const x = item * cellSize + canvasPadding + cellPadding,
                  y = line * cellSize + canvasPadding + cellPadding

            // cell
            if(typeof(board[i]) === 'number'){
                ctx.shadowBlur = Math.floor(this.cellSize * 0.04)
                ctx.shadowColor = '#999'
                ctx.shadowOffsetX = Math.floor(this.cellSize * 0.03)
                ctx.shadowOffsetY = Math.floor(this.cellSize * 0.03)
                ctx.fillStyle = '#ddd'
                this._roundRect(ctx, x, y, tokenSize, tokenSize, rectRound, true, false)
                ctx.shadowBlur = 0
                ctx.shadowOffsetX = 0
                ctx.shadowOffsetY = 0 
            }

            if(this.selected === i) {
                ctx.fillStyle = '#888'
                this._roundRect(ctx, x, y, tokenSize, tokenSize, rectRound, true, false)
            }
            
            if(this.cursor){
                let hoveredCoords = this._getHoverCoords(this.cursor)
                if(hoveredCoords){
                    hovered = this._toBoardIndex(hoveredCoords)
                }
            }

            // border
            if(typeof(board[i]) === 'number'){
                if(hovered !== null && hovered === i){
                    ctx.lineWidth = Math.floor(this.cellSize * 0.04)
                    ctx.strokeStyle = '#aaa'
                } else {
                    ctx.lineWidth = Math.floor(this.cellSize * 0.02)
                    ctx.strokeStyle = '#bbb'
                }
                this._roundRect(ctx, x, y, tokenSize, tokenSize, rectRound, false, true)
            } else if(typeof(board[i]) === 'string'){
                ctx.lineWidth = Math.floor(this.cellSize * 0.02)
                ctx.strokeStyle = '#999'
                ctx.fillStyle = '#666'
                ctx.setLineDash([
                    Math.floor(tokenSize * 0.08),
                    Math.floor(tokenSize * 0.05)],
                )
                this._roundRect(ctx, x, y, tokenSize, tokenSize, rectRound, false, true)
                ctx.setLineDash([])
            }

            // text
            if(typeof(board[i]) === 'number'){
                ctx.font = this.textFont
                ctx.fillStyle = '#444'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.shadowBlur = 1
                ctx.shadowColor = '#111'
                ctx.fillText(
                    String(board[i]),
                    x + Math.floor(tokenSize / 2),
                    y + Math.floor(cellPadding / 2) + Math.floor(tokenSize / 2),
                    Math.floor(tokenSize * 0.75)
                )
                ctx.shadowBlur = 0
            } else if(typeof(board[i]) === 'string'){
                ctx.font = this.picFont
                ctx.fillStyle = '#aaa'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.shadowColor = '#333'
                ctx.fillText(
                    String.fromCharCode(59455),
                    x + tokenSize / 2,
                    y + Math.floor(cellPadding / 2) + Math.floor(tokenSize / 2),
                    Math.floor(tokenSize * 0.75),
                )
            }
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