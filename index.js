import { Board } from './cells/board'
import {
    Token,
    ActiveToken,
    PassiveToken,
    HeavyPassiveToken,
    LightPassiveToken,
    NewPassiveToken,
} from './cells/token'
import { Counter } from './cells/counter'
import { Timer } from './cells/timer'
import { random } from './cells/utils'
// |

class Cells {

    constructor(selector, size, config){

        this.PLAY = 'play'
        this.CLOSE = 'close'
        this.RELOAD = 'reload'
        this.VICTORY = 'victory'

        this.cellSize = 0  // base value
        
        Object.assign(this, config)
        
        // model
        this.board = new Board(size)
        this.timer = new Timer()
        this.counter = new Counter()

        // root and canvas HTMLElement
        this.element = document.querySelector(selector)
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext('2d')
        this.backgroundColor = '#fff'

        // in board coords
        this.hoverToken = null
        this.selected = null

        this.eventQueue = []
        
        this.changed = true
        this.paused = false
        this.state = this.PLAY
        // button name
        this.hoverButton = null
        
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

        // menu panel
        this.panelSize = Math.floor(this.cellSize * 0.7)
        this.panelBasePadding = this.canvasPadding + this.cellPadding
        this.panelButtonSize = this.panelFontSize
        this.panelButtonMargin = this.panelButtonSize * 0.4

        this.canvas.width = this.cellSize * this.board.cols + this.canvasPadding * 2
        this.canvas.height = (
            this.cellSize * this.board.rows + 
            this.canvasPadding * 2 + this.panelSize
        )
        
        this.element.appendChild(this.canvas)
        this.frameCallback = this.frame.bind(this)
        this.computeStyles()
        this.attachEvents()
    }

    computeStyles(){

        this.cellConfig = Object.freeze({
            ctx: this.ctx,
            font: this.cellFont,
            textFillStyle: '#999',
            textAlign: 'center',
            textBaseline: 'middle',
            textMaxWidth: Math.floor(this.cellSize * 0.70),
            localTextX: Math.floor(this.cellSize / 2),
            localTextY: Math.floor(this.cellSize / 1.8)
        })

        this.baseConfig = Object.freeze({
            ctx: this.ctx,
            tokenSize: this.tokenSize,
            rectRound: this.rectRound,  // round size
            _roundRect: this._roundRect,  // function
        })

        this.activeConfig = Object.freeze({
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

        this.heavyPassiveConfig = Object.freeze({
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

        this.lightPassiveConfig = Object.freeze({
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

        this.newPassiveConfig = Object.freeze({
            // token
            tokenFillColor: '#fff',
            // figure
            lineCap: 'round',
            lineWidth: Math.floor(this.tokenSize * 0.09),
            arrowColor: "#777",
            xLineColor: '#fff',
            arcFill: "#bbb",
            figureRadius: Math.floor(this.tokenSize * 0.2),
            center: Math.floor(this.tokenSize / 2)
        })

        this.timerConfig = Object.freeze({
            ctx: this.ctx,
            x: Math.floor(this.canvasPadding + this.cellPadding),
            y: Math.floor(this.panelSize * 0.6),
            // text
            font: this.panelFont,
            textFillStyle: '#666',
            textAlign: 'left',
            textBaseline: 'middle',
        })

        this.counterConfig = Object.freeze({
            ctx: this.ctx,
            x: Math.floor(this.canvas.width / 2),
            y: Math.floor(this.panelSize * 0.6),
            // text
            font: this.panelFont,
            textFillStyle: '#666',
            textAlign: 'center',
            textBaseline: 'middle',
        })

        this.panelConfig = Object.freeze({
            ctx: this.ctx,
            panelBackground: '#fff',  // '#999',
            bottomLineY: Math.floor(this.panelSize * 0.99),
            bottomLineWidth: Math.floor(this.cellSize * 0.04),
            bottomLineStrokeStyle: '#666',
            iconRadius: Math.floor(this.panelButtonSize * 0.45),
            iconLineWidth: Math.floor(this.panelButtonSize * 0.15),
            iconStrokeStyle: '#bbb',
            iconCenterY: Math.floor(this.panelSize * 0.55),
            closeCenterX: Math.floor(this.canvas.width - (this.panelButtonSize * 0.5 + this.panelBasePadding)),
            reloadCenterX: Math.floor(this.canvas.width - (this.panelButtonSize * 1.5 + this.panelBasePadding + this.panelButtonMargin)),
            reloadCircleRads: [Math.PI * 0.3, Math.PI * 1.85],
            pauseCenterX: Math.floor(this.canvas.width - (this.panelButtonSize * 2.5 + this.panelBasePadding + this.panelButtonMargin * 2)),
            pauseIconFill: '#bbb',
            hoverIconStyle: '#999'
        })
    }

    attachEvents(){
        // cursor & cursor coords
        this.canvas.addEventListener('mouseover', (function(e){
            
            const moveHandler = (function(e){
                this.eventQueue.push(this.onHover.bind(this, e))
            }).bind(this)

            this.canvas.addEventListener('mouseleave', (function(e){
                this.canvas.removeEventListener('mousemove', moveHandler, false)
                this.hoverToken = null
                this.hoverButton = null
                this.changed = true
            }).bind(this), false)

            this.canvas.addEventListener('mousemove', moveHandler, false)

        }).bind(this), false)

        // click & selected
        this.canvas.addEventListener('click', (function(e){
            this.eventQueue.push(this.onClick.bind(this, e))
        }).bind(this), false)

        this.canvas.addEventListener('touchstart', (function(e){
            this.eventQueue.push(this.onClick.bind(this, e))
        }).bind(this), false)

        this.canvas.addEventListener('touchend', (function(e){
            this.eventQueue.push(this.onClick.bind(this, e))
            this.hoverToken = null
        }).bind(this), false)
    }

    onHover(e){
        const cursorPix = this.canvasPixelCoords(e),
              hoverCell = this.hoverTokenCoords(cursorPix),
              hoverButton = this.hoverButtonCoords(cursorPix),
              cursorType = (hoverCell || hoverButton) ? 'pointer' : 'default'
            
        this.hoverToken = hoverCell
        this.hoverButton = hoverButton
        this.canvas.style.cursor = cursorType
    }

    onClick(e){
        const pixCoords = this.canvasPixelCoords(e),
              coords = this.hoverTokenCoords(pixCoords),
              button = this.hoverButtonCoords(pixCoords)

        if(!coords && !button){
            return
        }

        if(coords && !this.paused){

            const token = this.board.getItem(coords)
            
            if(token instanceof ActiveToken){
                this.selected = coords
            } else if(
                token === null &&
                this.selected &&
                this.isValidMove(this.selected, coords)
            ){
                this.change(this.selected, coords)
                this.selected = null
                this.eventQueue.push(this.onChange.bind(this))
                this.eventQueue.push(this.counter.incr.bind(this.counter))
            }

        } else if(button){
            if(button === 'pause'){
                this.paused ? this.timer.unpause() : this.timer.pause()
                this.paused = !this.paused
            } else {
                this.state = this[button.toUpperCase()]
            }
        }

    }
    
    onChange(){
        if(this.isComplete()){
            this.state = this.VICTORY
        }
    }

    indexToCoord(i){
        const line = Math.floor(i / this.board.cols),
              item = i % this.board.cols

        return [line, item]
    }

    canvasPixelCoords(e){

        const tag = e.target,
              left = tag.offsetLeft,
              top = tag.offsetTop

        let clickX, clickY
        
        if(e.type === 'touchstart' || e.type === 'touchend'){
            clickX = e.changedTouches[0].pageX
            clickY = e.changedTouches[0].pageY
        } else {
            clickX = e.pageX
            clickY = e.pageY
        }

        const x = clickX - left,
              y = clickY - top

        return [x, y]
    }

    cellPixelCoords(boardCoords){
        const [line, item] = boardCoords,
              x = item * this.cellSize + this.canvasPadding,
              y = line * this.cellSize + this.canvasPadding + this.panelSize

        return [x, y]
    }

    // token local pixel coords
    tokenPixelCoords(boardCoords){
        const [x, y] = this.cellPixelCoords(boardCoords)
        return [x + this.cellPadding, y + this.cellPadding]
    }

    // returns null or token board coords if cursor is on it
    hoverTokenCoords(coords){
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

    hoverButtonCoords(coords){

        const canvPad = this.canvasPadding,
              width = this.canvas.width - canvPad,
              height = this.panelSize

        if(
            (coords[0] < this.canvas.width / 2 || coords[1] < canvPad) ||
            (coords[0] > width || coords[1] > height)
        ){
            return null
        }

        const cfg = this.panelConfig,
              r = cfg.iconRadius * 1.2,
              size = r * 2,
              baseX = cfg.closeCenterX - r,
              baseY = cfg.iconCenterY - r,
              indent = this.panelButtonSize + this.panelButtonMargin,
              buttons = ['close', 'reload', 'pause']

        for(let i = 0, len = buttons.length; i < len; i ++){
            const x = baseX - indent * i,
                  y = baseY

            if(coords[0] > x && coords[0] < x + size && coords[1] > y && coords[1] < y + size){
                return buttons[i]
            }
        }

        return null
    }

    isComplete(){
        const board = this.board,
              len = board.length

        for(let i = 0; i < len; i++){
            const cell = board.getCell(this.indexToCoord(i)),
                  token = cell.token
            if(cell.label !== (token ? token.value : token)){
                return false
            }
        }

        return true
    }

    // from & to in border coords
    isValidMove(from, to){
        if(from[0] !== to[0] && from[1] !== to[1]){
            return false
        }

        const xStep = ((from[0] === to[0]) ? 0 : (from[0] < to[0]) ? 1 : -1),
              yStep = ((from[1] === to[1]) ? 0 : (from[1] < to[1]) ? 1 : -1),
              pos = [from[0] + xStep, from[1] + yStep]

        while(!(pos[0] === to[0] && pos[1] === to[1])){
            if(!this.canCrossIt(from, pos)){
                return false
            }
            pos[0] += xStep
            pos[1] += yStep
        }

        return true
    }

    // who & what in border coords
    canCrossIt(who, what){
        const HEAVY = 80,
              LIGHT = 40

        const whoToken = this.board.getItem(who),
              whatCell = this.board.getCell(what),
              // whatTokenWeight = (whatCell.token ? whatCell.token.weight : 0),
              whatToken = whatCell.token

        let whatTokenWeight = 0
              
        if(whatToken){
          if(whatToken instanceof NewPassiveToken){
            switch(whatToken.state){
            
            case whatToken.NONE:
                whatTokenWeight = HEAVY
                break;

            case whatToken.ALL:
                whatTokenWeight = LIGHT
                break;

            case whatToken.BOTTOM:
                whatTokenWeight = who[0] < what[0] && who[1] === what[1] ? LIGHT : HEAVY
                break;
            
            case whatToken.TOP:
                whatTokenWeight = who[0] > what[0] && who[1] === what[1] ? LIGHT : HEAVY
                break;

            case whatToken.LEFT:
                whatTokenWeight = who[0] === what[0] && who[1] > what[1] ? LIGHT : HEAVY
                break;

            case whatToken.RIGHT:
                whatTokenWeight = who[0] === what[0] && who[1] < what[1] ? LIGHT : HEAVY
                break;

            case whatToken.HORIZONTAL:
                whatTokenWeight = who[0] === what[0] ? LIGHT : HEAVY
                break;

            case whatToken.VERTICAL:
                whatTokenWeight = who[1] === what[1] ? LIGHT : HEAVY
                break;
        
            }
            
          } else {
              whatTokenWeight = whatToken.weight
          }
        }

        return (whatCell.capacity - whatTokenWeight - whoToken.weight) >= 0
    }

    change(from, to){
        const board = this.board,
              fromToken = this.board.getItem(from),
              toToken = this.board.getItem(to),
              fromPixelCoords = this.tokenPixelCoords(from),
              toPixelCoords = this.tokenPixelCoords(to)

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

    shuffle(n){
        let from, to, token
        const len = this.board.length - 1

        while(n--){
            do {
                do {
                    from = this.indexToCoord(random(len))
                    token = this.board.getItem(from)
                } while(token instanceof PassiveToken)

                do {
                    to = this.indexToCoord(random(len))
                    token = this.board.getItem(to)
                } while(token instanceof PassiveToken)

            } while(from[0] === to[0] && from[1] === to[1])

            this.change(from, to)
        }
    }

    destroy(){
        delete this.frameCallback
        delete this._data
        delete this.ctx
        delete this.baseConfig
        delete this.activeConfig
        delete this.passiveConfig
        delete this.panelConfig
        delete this.counterConfig
        delete this.timerConfig
        this.board.destroy()
        delete this.board
        this.element.removeChild(this.canvas)
        delete this.element

        if(this.onclose){
            this.onclose()
        }
    }

    load(data){

        if(!(Array.isArray(data) && data.length === this.board.length)){
            throw RangeError(`\
Cells.load: the argument must be an Array[ ${this.board.length} ]`)
        }

        this._data = data
        const baseConfig = this.baseConfig

        data.forEach((primitive, i) => {

            // board coordinates
            const coord = this.indexToCoord(i),
                  [cX, cY] = this.cellPixelCoords(coord),
                  [x, y] = this.tokenPixelCoords(coord)
            
            const cell = this.board.getCell(coord)

            cell.label = primitive
            cell.x = cX
            cell.y = cY
            // the 'baseConfig' is a singleton that contains common readonly props
            cell.token = Token.create(primitive, {x, y, baseConfig})
        })
    }

    clear(){
        const ctx = this.ctx
        ctx.shadowBlur = 0
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    drawResults(){
        this.clear()

        const ctx = this.ctx,
              halfW = Math.floor(this.canvas.width / 2),
              indent = Math.floor(this.cellSize * 0.3)

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#666'
        ctx.font = this.cellFont

        let x = halfW,
            y = this.cellSize * 0.5

        ctx.fillText('Results', x, y)
        ctx.lineWidth = this.cellSize * 0.02
        ctx.beginPath()
        ctx.strokeStyle = "#bbb"
        ctx.moveTo(0, y * 1.8)
        ctx.lineTo(this.canvas.width, y * 1.3)
        ctx.stroke()
        ctx.closePath()

        ctx.font = this.panelFont
        ctx.fillStyle = '#777'
        
        y = this.cellSize * 1.2

        x = halfW - indent
        ctx.textAlign = 'right'
        ctx.fillText('Time:', x, y)

        x = halfW + indent
        ctx.textAlign = 'left'
        ctx.fillText(this.timer.toString(), x, y)

        y = this.cellSize * 1.5
        
        x = halfW - indent
        ctx.textAlign = 'right'
        ctx.fillText('Steps:', x, y)
        
        x = halfW + indent
        ctx.textAlign = 'left'
        ctx.fillText(this.counter.toString(), x, y)

        y = this.cellSize * 2.2

        x = halfW
        ctx.font = this.cellFont
        ctx.fillStyle = '#666'
        ctx.textAlign = 'center'
        ctx.fillText('Click to exit!', x, y)

        this.canvas.addEventListener('click', () => {
            this.destroy()
        })
    }

    drawPanel(config){

        const ctx = config.ctx
                       
        const y = config.iconCenterY,
              hover = this.hoverButton,
              baseStyle = config.iconStrokeStyle,
              hoverStyle = config.hoverIconStyle
        // x & radius will change
        let x = config.closeCenterX,
            radius = config.iconRadius

        // panel background
        this.ctx.fillStyle = config.panelBackground
        this.ctx.fillRect(0, 0, this.canvas.width, this.panelSize)

        // panel line
        ctx.lineWidth = config.bottomLineWidth
        ctx.strokeStyle = config.bottomLineStrokeStyle
        ctx.beginPath()
        ctx.moveTo(0, config.bottomLineY)
        ctx.lineTo(this.canvas.width, config.bottomLineY)
        ctx.stroke()
        ctx.closePath()

        ctx.lineWidth = config.iconLineWidth

        // close
        ctx.strokeStyle = (hover === 'close') ? hoverStyle : baseStyle
        ctx.beginPath()
        ctx.moveTo(x - radius, y - radius)
        ctx.lineTo(x + radius, y + radius)
        ctx.moveTo(x - radius, y + radius)
        ctx.lineTo(x + radius, y - radius)
        ctx.stroke()
        ctx.closePath()

        // reload
        x = config.reloadCenterX
        ctx.strokeStyle = (hover === 'reload') ? hoverStyle : baseStyle
        ctx.beginPath()
        ctx.arc(x, y, radius, ...config.reloadCircleRads)
        ctx.stroke()
        ctx.closePath()

        // pause
        const padding = Math.floor(radius * 0.4),
              style = (hover === 'pause') ? hoverStyle : baseStyle

        x = config.pauseCenterX
        ctx.beginPath()
        if(this.paused){
            ctx.fillStyle = style
            ctx.moveTo(x - radius, y - radius)
            ctx.lineTo(x + radius, y)
            ctx.lineTo(x - radius, y + radius)
            ctx.fill()
        } else {
            ctx.strokeStyle = style
            ctx.moveTo(x - padding, y - radius)
            ctx.lineTo(x - padding, y + radius)
            ctx.moveTo(x + padding, y - radius)
            ctx.lineTo(x + padding, y + radius)
            ctx.stroke()
        }

        ctx.closePath()

        if(this.hoverButton){
            ctx.fillStyle = '#666'
            ctx.fillRect(...this.hoverButton)
        }
    } // _drawPanel

    drawPausedBoard(){
        this.ctx.font = this.cellFont
        this.ctx.fillText(
            'Paused',
            Math.floor(this.canvas.width / 2),
            Math.floor(this.canvas.height / 2),
        )
    }

    draw(){

        if(!this.changed){
            return
        }

        this.changed = false

        this.clear()
        this.drawPanel(this.panelConfig)
        this.timer.draw(this.timerConfig)
        this.counter.draw(this.counterConfig)

        if(this.paused){
            this.drawPausedBoard()
            return
        }

        for(let i = 0, len = this.board.length; i < len; i++){

            const coords = this.indexToCoord(i),
                  cell = this.board.getCell(coords),
                  token = cell.token

            cell.draw(this.cellConfig)

            // free cell
            if(token === null){
                continue
            }
            
            const changes = {}
            let config = {}

            if(token instanceof ActiveToken){
                
                config = this.activeConfig

                const s = this.selected
                if(s && (s[0] === coords[0] && s[1] === coords[1])){
                    changes.tokenFillColor = '#8f8f8f'
                }

                const c = this.hoverToken
                if(c && (c[0] === coords[0] && c[1] === coords[1])){
                   changes.tokenBorderColor = '#aaa'
                   changes.tokenBorderWidth = Math.floor(this.tokenSize * 0.05)
                }
            } else if(token instanceof LightPassiveToken){
                config = this.lightPassiveConfig
            } else if(token instanceof HeavyPassiveToken){
                config = this.heavyPassiveConfig
            } else if(token instanceof NewPassiveToken){
                config = this.newPassiveConfig
            }
            
            if(Object.keys(changes).length){
                config = Object.assign({}, config, changes)
            }

            token.draw(config)
        }
    }

    update(){
        const queue = this.eventQueue,
              timer = this.timer,
              stamp = timer.getSeconds()

        if(!this.paused){
            timer.update()
        }

        if(queue.length || timer.getSeconds() !== stamp){
            this.changed = true
        }

        while(queue.length){
            const handler = queue.shift()
            if(!handler){
                return
            }
            handler() 
        }
    }

    frame(){
        const state = this.state

        this.update()
        this.draw()

        if(state === this.PLAY){
            this.frameDescriptor = window.requestAnimationFrame(this.frameCallback)
        } else {
            window.cancelAnimationFrame(this.frameDescriptor)

            if(state === this.CLOSE){
                this.destroy()
            } else if(state === this.RELOAD){
                this.load(this._data)
                this.run()
            } else if(state === this.VICTORY){
                this.drawResults()
            }
        }
    }

    run(){
       if(this.onopen){
           this.onopen()
       }

       while(this.isComplete()){
            this.shuffle(Math.floor(this.board.length / 2))
       }

        this.state = this.PLAY
        this.paused = false
        this.counter.start()
        this.timer.start()

        this.frameDescriptor = window.requestAnimationFrame(this.frameCallback)
    }
}

export default Cells
