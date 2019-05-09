import { Board } from './cells/board'
import {
    Token,
    ActiveToken,
    PassiveToken,
    HeavyPassiveToken,
    LightPassiveToken
} from './cells/token'
import { Counter } from './cells/counter'
import { Timer } from './cells/timer'
import { random } from './cells/utils'
// |

class Cells {

    constructor(selector, size, config){

        this.cellSize = 0  // base value
        
        Object.assign(this, config)
        
        // model
        this._board = new Board(size)
        this._timer = new Timer()
        this._counter = new Counter()

        // root and canvas HTMLElement
        this.element = document.querySelector(selector)
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext('2d')
        this.backgroundColor = '#fff'

        // in board coords
        this.cursor = null
        this.selected = null
        this._eventQueue = []
        
        this.panelSize = Math.floor(this.cellSize * 0.7)
        
        // text
        this.baseFontSize = Math.floor(this.cellSize * 0.3)
        this.panelFontSize = Math.floor(this.baseFontSize * 0.9)
    
        this.cellFont = `900 ${ this.baseFontSize }px 'Montserrat', serif`
        this.cellPicFont = `${ this.baseFontSize * 2 }px 'Icons'`
        this.panelFont = `bold ${ this.panelFontSize }px 'Montserrat', serif`
        
        // paddings & styles
        this.canvasPadding = Math.floor(this.cellSize * 0.05)
        this.cellPadding = Math.floor(this.cellSize * 0.05)
        this.rectRound = Math.floor(this.cellSize * 0.07)
        this.tokenSize = this.cellSize - this.cellPadding * 2

        this.canvas.width = this.cellSize * this._board.cols + this.canvasPadding * 2
        this.canvas.height = (
            this.cellSize * this._board.rows + 
            this.canvasPadding * 2 + this.panelSize
        )
        
        this.element.appendChild(this.canvas)
        this._frameCallback = this._frame.bind(this)
        this._computeStyles()
        this._attachEvents()
    }

    _computeStyles(){

        this._cellConfig = Object.freeze({
            ctx: this.ctx,
            font: this.cellFont,
            textFillStyle: '#999',
            textAlign: 'center',
            textBaseline: 'middle',
            textMaxWidth: Math.floor(this.cellSize * 0.70),
            localTextX: Math.floor(this.cellSize / 2),
            localTextY: Math.floor(this.cellSize / 1.8)
        })

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
            font: this.cellFont,
            textFillStyle: '#555',
            textAlign: 'center',
            textBaseline: 'middle',
            textMaxWidth: Math.floor(this.tokenSize * 0.75),
            localTextX: Math.floor(this.tokenSize / 2),
            localTextY: Math.floor(this.tokenSize / 1.8),
        })

        this._heavyPassiveConfig = Object.freeze({
            // token
            tokenBorderColor: '#999',
            tokenBorderWidth: Math.floor(this.tokenSize * 0.02),
            tokenBorderDashFilledSize: Math.floor(this.tokenSize * 0.08),
            tokenBorderDashEmptySize: Math.floor(this.tokenSize * 0.05),
            tokenFillColor: '#fff',
            // text
            font: this.cellPicFont,
            textFillStyle: '#777',
            textAlign: 'center',
            textBaseline: 'middle',
            textMaxWidth: Math.floor(this.tokenSize * 0.75),
            localTextX: Math.floor(this.tokenSize / 2),
            localTextY: Math.floor(this.tokenSize / 1.9), 
        })

        this._lightPassiveConfig = Object.freeze({
            // token
            tokenFillColor: '#fff',
            // text
            font: this.cellPicFont,
            textFillStyle: '#777',
            textAlign: 'center',
            textBaseline: 'middle',
            textMaxWidth: Math.floor(this.tokenSize * 0.75),
            localTextX: Math.floor(this.tokenSize / 2),
            localTextY: Math.floor(this.tokenSize / 1.9), 
        })

        this._timerConfig = Object.freeze({
            ctx: this.ctx,
            x: Math.floor(this.canvasPadding + this.cellPadding),
            y: Math.floor(this.panelSize * 0.6),
            // text
            font: this.panelFont,
            textFillStyle: '#666',
            textAlign: 'left',
            textBaseline: 'middle',
        })

        this._counterConfig = Object.freeze({
            ctx: this.ctx,
            x: Math.floor(this.canvas.width / 2),
            y: Math.floor(this.panelSize * 0.6),
            // text
            font: this.panelFont,
            textFillStyle: '#666',
            textAlign: 'right',
            textBaseline: 'middle',
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

        if(!coords){
            return
        }

        const token = this._board.getItem(coords)

        if(token instanceof ActiveToken){
            this.selected = coords
        } else if(
            token === null &&
            this.selected &&
            this._isValidMove(this.selected, coords)
        ){
            this._change(this.selected, coords)
            this.selected = null
            this._eventQueue.push(this._onChange.bind(this))
            this._eventQueue.push(this._counter.incr.bind(this._counter))
        }
    }

    _onChange(){
        console.log(`isComplete: ${ this._isComplete()} `)
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

    _cellPixelCoords(boardCoords){
        const [line, item] = boardCoords,
              x = item * this.cellSize + this.canvasPadding,
              y = line * this.cellSize + this.canvasPadding + this.panelSize

        return [x, y]
    }

    // token local pixel coords
    _tokenPixelCoords(boardCoords){
        const [x, y] = this._cellPixelCoords(boardCoords)
        return [x + this.cellPadding, y + this.cellPadding]
    }

    // returns null or token board coords if cursor is on it
    _getHoverCoords(coords){
        const canvPad = this.canvasPadding,
              height = this.canvas.height - canvPad,
              width = this.canvas.width - canvPad,
              cellPad = this.cellPadding,
              tSize = this.tokenSize,
              pSize = this.panelSize

        if(
            (coords[0] < canvPad || coords[1] < canvPad + pSize) ||
            (coords[0] > width || coords[1] > height)
        ){
            return null
        }

        const toCellX = (coords[0] - canvPad) % (tSize + cellPad * 2),
              toCellY = (coords[1] - (canvPad + pSize)) % (tSize + cellPad * 2),
              x = Math.floor((coords[0] - canvPad) / (tSize + cellPad * 2)),
              y = Math.floor((coords[1] - (canvPad + pSize)) / (tSize + cellPad * 2))

        return (
            (toCellX > cellPad && toCellY > cellPad) &&
            (
                (toCellX < tSize + Math.floor(cellPad * 1.4)) && 
                (toCellY < tSize + Math.floor(cellPad * 1.4))
            )
        ) ? [y, x] : null
    }

    _isComplete(){
        const board = this._board,
              len = board.length

        for(let i = 0; i < len; i++){
            const cell = board.getCell(this._indexToCoord(i)),
                  token = cell.token
            if(cell.label !== (token ? token.value : token)){
                return false
            }
        }

        return true
    }

    // from & to in border coords
    _isValidMove(from, to){
        if(from[0] !== to[0] && from[1] !== to[1]){
            return false
        }

        const xStep = ((from[0] === to[0]) ? 0 : (from[0] < to[0]) ? 1 : -1),
              yStep = ((from[1] === to[1]) ? 0 : (from[1] < to[1]) ? 1 : -1),
              pos = [from[0] + xStep, from[1] + yStep]

        while(!(pos[0] === to[0] && pos[1] === to[1])){
            if(!this._canCrossIt(from, pos)){
                return false
            }
            pos[0] += xStep
            pos[1] += yStep
        }

        return true
    }

    // who & what in border coords
    _canCrossIt(who, what){
        const whoToken = this._board.getItem(who),
              whatCell = this._board.getCell(what),
              whatTokenWeight = (whatCell.token ? whatCell.token.weight : 0)

        return (whatCell.capacity - whatTokenWeight - whoToken.weight) >= 0
    }

    _change(from, to){
        const board = this._board,
              fromToken = this._board.getItem(from),
              toToken = this._board.getItem(to),
              fromPixelCoords = this._tokenPixelCoords(from),
              toPixelCoords = this._tokenPixelCoords(to)

        board.setItem(from, toToken)
        board.setItem(to, fromToken)

        if(toToken && toToken instanceof Token){
            toToken.x = fromPixelCoords[0]
            toToken.y = fromPixelCoords[1]
        }

        if(fromToken && fromToken instanceof Token){
            fromToken.x = toPixelCoords[0]
            fromToken.y = toPixelCoords[1]
        }
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
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    _shuffle(n){
        let from, to, token
        const len = this._board.length - 1

        while(n--){
            do {
                do {
                    from = this._indexToCoord(random(len))
                    token = this._board.getItem(from)
                } while(token instanceof PassiveToken)

                do {
                    to = this._indexToCoord(random(len))
                    token = this._board.getItem(to)
                } while(token instanceof PassiveToken)

            } while(from[0] === to[0] && from[1] === to[1])

            this._change(from, to)
        }
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

        if(!(Array.isArray(data) && data.length === this._board.length)){
            throw RangeError(`\
Cells.load: the argument must be an Array[ ${this._board.length} ]`)
        }

        const baseConfig = this._baseConfig
        data.forEach((primitive, i) => {

            // board coordinates
            const coord = this._indexToCoord(i),
                  [cX, cY] = this._cellPixelCoords(coord),
                  [x, y] = this._tokenPixelCoords(coord)
            
            const cell = this._board.getCell(coord)

            cell.label = primitive
            cell.x = cX
            cell.y = cY
            // the 'baseConfig' is a singleton that contains common readonly props
            cell.token = Token.create(primitive, {x, y, baseConfig})
        })
    }


    _drawPanel(){
        this.ctx.shadowBlur = 0
        this.ctx.fillStyle = '#bbb'
        this.ctx.fillRect(0, 0, this.canvas.width, this.panelSize)
    }


    draw(){

        this._clear()

        //this._drawPanel()

        this._timer.draw(this._timerConfig)
        this._counter.draw(this._counterConfig)

        // panel line
        this.ctx.lineWidth = Math.floor(this.cellSize * 0.04)
        this.ctx.strokeStyle = '#666'
        this.ctx.beginPath()
        this.ctx.moveTo(0, this.panelSize * 0.99)
        this.ctx.lineTo(this.canvas.width, this.panelSize * 0.99)
        this.ctx.stroke()
        this.ctx.closePath()
        this.ctx.lineWidth = 0

        // ========================

        const ctx = this.ctx
        const rightPadding = this.canvasPadding + this.cellPadding
        const buttonSize = this.panelFontSize
        let x = Math.floor(this.canvas.width - (buttonSize / 2 + rightPadding))
        const y = Math.floor(this.panelSize * 0.6) 
        const radius = Math.floor(buttonSize * 0.4)
        
        ctx.lineWidth = Math.floor(buttonSize * 0.2)        
        ctx.strokeStyle = '#aaa'

        // close
        ctx.beginPath()
        ctx.moveTo(x - radius, y - radius)
        ctx.lineTo(x + radius, y + radius)
        ctx.moveTo(x - radius, y + radius)
        ctx.lineTo(x + radius, y - radius)
        ctx.stroke()
        ctx.closePath()

        // reload
        x -= buttonSize + 5
        ctx.beginPath()
        ctx.arc(x, y, radius, Math.PI * 0.3, Math.PI * 1.85)
        ctx.stroke()
        ctx.closePath()

        // pause
        x -= buttonSize + 5
        ctx.fillStyle = '#aaa'
        ctx.beginPath()
        ctx.moveTo(x - radius, y - radius)
        ctx.lineTo(x + radius, y)
        ctx.lineTo(x - radius, y + radius)
        ctx.fill()
        ctx.closePath()
        /*
        // pause button
        const radius = Math.floor(this.panelSize * 0.35)

        this.ctx.lineWidth = Math.floor(this.panelSize * 0.1)
        // this.ctx.lineWidth = Math.floor(this.panelSize * 0.15)
        this.ctx.strokeStyle = '#ccc'
        this.ctx.beginPath()
        this.ctx.arc(
            Math.floor(this.canvas.width / 2),
            Math.floor(this.panelSize / 2),
            radius,
            0,
            Math.PI * 2 
        )
        this.ctx.stroke()

        // pause rects
        const width = Math.floor(radius / 2)
        const height = radius
        const padding = Math.floor(this.panelSize * 0.03)

        this.ctx.fillStyle = '#ccc'
        this.ctx.fillRect(
            Math.floor(this.canvas.width / 2 - padding - width),
                Math.floor(this.panelSize / 2 - radius * 0.5),
            width,
            height
        )

        this.ctx.fillRect(
            Math.floor(this.canvas.width / 2 + padding),
                Math.floor(this.panelSize / 2 - radius * 0.5),
            width,
            height
        )*/
/*
        const radius = Math.floor(this.panelSize * 0.35)

        this.ctx.lineWidth = Math.floor(this.panelSize * 0.1)
        // this.ctx.lineWidth = Math.floor(this.panelSize * 0.15)
        this.ctx.strokeStyle = '#ccc'
        this.ctx.beginPath()
        this.ctx.arc(
            Math.floor(this.canvas.width / 2),
            Math.floor(this.panelSize / 2),
            radius,
            0,
            Math.PI * 2 
        )
        this.ctx.stroke()

        // pause triangle
        this.ctx.fillStyle = '#ccc'
        this.ctx.beginPath()
        this.ctx.lineTo(
            Math.floor(this.canvas.width /2 - radius * 0.35),
            Math.floor(this.panelSize / 2 - radius * 0.55)
        )
        this.ctx.lineTo(
            Math.floor(this.canvas.width /2 + radius * 0.6),
            Math.floor(this.panelSize / 2)
        )
        this.ctx.lineTo(
            Math.floor(this.canvas.width /2 - radius * 0.35),
            Math.floor(this.panelSize / 2 + radius * 0.55)
        )
        this.ctx.fill()
        this.ctx.closePath()
*/

        for(let i = 0, len = this._board.length; i < len; i++){

            const coords = this._indexToCoord(i),
                  cell = this._board.getCell(coords),
                  token = cell.token

            cell.draw(this._cellConfig)

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
                    changes.tokenFillColor = '#8f8f8f'
                }

                const c = this.cursor
                if(c && (c[0] === coords[0] && c[1] === coords[1])){
                   changes.tokenBorderColor = '#aaa'
                   changes.tokenBorderWidth = Math.floor(this.tokenSize * 0.05)
                }
            } else if(token instanceof LightPassiveToken){
                config = this._lightPassiveConfig
            } else if(token instanceof HeavyPassiveToken){
                config = this._heavyPassiveConfig
            }
            
            if(Object.keys(changes).length){
                config = Object.assign({}, config, changes)
            }

            token.draw(config)
        }
    }

    update(){
        const queue = this._eventQueue

        this._timer.update()

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

        window.requestAnimationFrame(this._frameCallback)
    }

    run(){
        while(this._isComplete()){
            this._shuffle(Math.floor(this._board.length / 2))
        }
        this._timer.start()
        window.requestAnimationFrame(this._frameCallback)
    }
}

/*************  Test  ****************/
const size = [3, 4]
const map = [
    1, 2, 3, 4,
    'heavy', null, 'light', 5,
    6, 7, 8, null
]


const cells = new Cells('#app', size, { cellSize: 80 })
cells.load(map)
cells.run()
console.log(cells)