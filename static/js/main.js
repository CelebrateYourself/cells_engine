import { Board } from './cells/board';
import { Token, ActiveToken, PassiveToken } from './cells/token';
// |

class Cells {

    constructor(selector, size, config){

        this.cellSize = 0  // base value

        Object.assign(this, config)

        // model
        this._board = new Board(size)

        // root and canvas HTMLElement
        this.element = document.querySelector(selector)
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext('2d')

        // in board coords
        this.cursor = null
        this.selected = null
        this._eventQueue = []

        // text
        this.baseFontSize = Math.floor(this.cellSize * 0.29)
        this.textFont = `bold ${ this.baseFontSize }px 'Georgia', serif`
        this.picFont = `${ this.baseFontSize * 2 }px 'Icons'`

        // paddings & styles
        this.canvasPadding = Math.floor(this.cellSize * 0.05)
        this.cellPadding = Math.floor(this.cellSize * 0.05)
        this.rectRound = Math.floor(this.cellSize * 0.07)
        this.tokenSize = this.cellSize - this.cellPadding * 2

        this.canvas.width = this.cellSize * this._board.cols + this.canvasPadding * 2
        this.canvas.height = this.cellSize * this._board.rows + this.canvasPadding * 2
        
        this.element.appendChild(this.canvas)
        this._frameCallback = this._frame.bind(this)
        this._computeStyles()
        this._attachEvents()
    }

    _computeStyles(){

        this._baseConfig = Object.freeze({
            ctx: this.ctx,
            tokenSize: this.tokenSize,
            rectRound: this.rectRound,  // round size
            _roundRect: this._roundRect,  // function
        })

        this._activeConfig = Object.freeze({
            // token
            tokenBorderColor: '#bbb',
            tokenBorderWidth: Math.floor(this.tokenSize * 0.02),
            tokenFillColor: '#ddd',
            tokenShadowColor: '#999',
            tokenShadowBlur: Math.floor(this.tokenSize * 0.05),
            tokenShadowOffsetX: Math.floor(this.tokenSize * 0.04),
            tokenShadowOffsetY: Math.floor(this.tokenSize * 0.04),
            // text
            font: this.textFont,
            textFillStyle: '#444',
            textAlign: 'center',
            textBaseline: 'middle',
            textShadowBlur: 1,
            textShadowColor: '#111',
            textMaxWidth: Math.floor(this.tokenSize * 0.75),
            localTextX: Math.floor(this.tokenSize / 2),
            localTextY: Math.floor(this.tokenSize / 1.8),
        })

        this._passiveConfig = Object.freeze({
            // token
            tokenBorderColor: '#999',
            tokenBorderWidth: Math.floor(this.tokenSize * 0.02),
            tokenBorderDashFilledSize: Math.floor(this.tokenSize * 0.08),
            tokenBorderDashEmptySize: Math.floor(this.tokenSize * 0.05),
            // text
            font: this.picFont,
            textFillStyle: '#aaa',
            textAlign: 'center',
            textBaseline: 'middle',
            textShadowColor: '#333',
            textMaxWidth: Math.floor(this.tokenSize * 0.75),
            localTextX: Math.floor(this.tokenSize / 2),
            localTextY: Math.floor(this.tokenSize / 1.9), 
        })
    }

    _attachEvents(){
        // cursor & cursor coords
        this.canvas.addEventListener('mouseover', (function(e){
            
            const moveHandler = (function(e){
                this._eventQueue.push(this._onHover.bind(this, e))
            }).bind(this)

            this.canvas.addEventListener('mouseleave', (function(e){
                this.canvas.removeEventListener('mousemove', moveHandler, false)
                this.cursor = null
            }).bind(this), false)

            this.canvas.addEventListener('mousemove', moveHandler, false)

        }).bind(this), false)

        // click & selected
        this.canvas.addEventListener('click', (function(e){
            this._eventQueue.push(this._onClick.bind(this, e))
        }).bind(this), false)
    }

    _onHover(e){
        const cursorPix = this._canvasPixelCoords(e),
              hoverCoords = this._getHoverCoords(cursorPix),
              cursorType = hoverCoords ? 'pointer' : 'default'
            
        this.cursor = hoverCoords
        this.canvas.style.cursor = cursorType
    }

    _onClick(e){
        const coords = this._getHoverCoords(this._canvasPixelCoords(e))

        if(coords){
            if(this._board.getItem(coords) instanceof ActiveToken){
                this.selected = coords
            }
        }
    }

    _indexToCoord(i){
        const line = Math.floor(i / this._board.cols),
              item = i % this._board.cols

        return [line, item]
    }

    _canvasPixelCoords(e){
        const tag = e.target,
              left = tag.offsetLeft,
              top = tag.offsetTop,
              x = e.pageX - left,
              y = e.pageY - top;

        return [x, y]
    }

    // token local pixel coords
    _tokenPixelCoords(boardCoords){
        const [item, line] = boardCoords,
              x = item * this.cellSize + this.canvasPadding + this.cellPadding,
              y = line * this.cellSize + this.canvasPadding + this.cellPadding

        return [x, y]
    }

    // returns null or token board coords if cursor is on it
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
    /*
    _isValid(from, to){
        if(from[0] !== to[0] || from[1] !== to[1]){
            return false
        }
    }*/

    _move(from, to){
        const board = this._board,
              fromToken = this._board.getItem(from),
              toToken = this._board.getItem(to)

        if(toToken){
            // change tokens [x, y] coords
        }

        board.setItem(from, toToken)
        board.setItem(to, fromToken)
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

    destroy(){
        delete this.ctx
        delete this._baseConfig
        delete this._activeConfig
        delete this._passiveConfig
        this._board.destroy()
        delete this._board
        this.element.removeChild(this.canvas)
        delete this.element
        delete this._frameCallback
    }

    load(data){

        const baseConfig = this._baseConfig
        const tokens = data.map((primitive, i) => {

            // board coordinates
            const item = Math.floor(i / this._board.cols),
                  line = i % this._board.cols,
                  // pixel coords
                  [x, y] = this._tokenPixelCoords([line, item])

            // the 'baseConfig' is a singleton that contains common readonly props
            return Token.create(primitive, {x, y, baseConfig})
        })

        this._board.fill(tokens)
    }

    draw(){

        this._clear()

        for(let i = 0, len = this._board.length; i < len; i++){

            const coords = this._indexToCoord(i)
            const token = this._board.getItem(coords)

            // free cell
            if(token === null){
                continue
            }
            
            const changes = {}
            let config = {}

            if(token instanceof ActiveToken){
                
                config = this._activeConfig

                const s = this.selected
                if(s && (s[0] === coords[0] && s[1] === coords[1])){
                    changes.tokenFillColor = '#888'
                }

                const c = this.cursor
                if(c && (c[0] === coords[0] && c[1] === coords[1])){
                   changes.tokenBorderColor = '#aaa'
                   changes.tokenBorderWidth = Math.floor(this.tokenSize * 0.05)
                }
            }

            if(token instanceof PassiveToken){
                config = this._passiveConfig
            }
            
            if(Object.keys(changes).length){
                config = Object.assign({}, config, changes)
            }

            token.draw(config)
        }

        window.requestAnimationFrame(this._frameCallback)
    }

    update(){
        const queue = this._eventQueue
        while(queue.length){
            const handler = queue.shift()
            if(!handler){
                return
            }
            handler() 
        }
    }

    _frame(){
        this.update()
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