import { Board } from './board'
import {
    Token,
    ActiveToken,
    PassiveToken,
} from './token'



class CellsBuilder {

    constructor(selector, size, config){

        this.PLAY = 'play'
        this.RELOAD = 'reload'
        this.CLOSE = 'close'
        this.SAVE = 'save'

        this.MAX_LINE_VALUE = 9
        this.MIN_LINE_VALUE = 3
        this.MIN_SIZE = 12

        this.initialSize = [4, 3]
        this.initialBoard = Array(this.initialSize[0] * this.initialSize[1]).fill(null)

        this.state = null

        this.cellSize = 0  // base value
        
        if(config){
            Object.assign(this, config)
        }

        if(!size){
            size = this.initialSize
        }

        if(size[0] * size[1] < this.MIN_SIZE){
            throw new RangeError(
`CellsBuilder: board size area "${ size[0] * size[1] }" should be great or equal to "${ this.MIN_SIZE }"`
            )
        }

        if(size[0] < this.MIN_LINE_VALUE || size[1] < this.MIN_LINE_VALUE){
            throw new RangeError(
`CellsBuilder: board size "[${ size[0] }, ${ size[1] }]" should be contains values greater or equal "${ this.MIN_LINE_VALUE }"`
            )
        }

        this.board = new Board(size)


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

        // button name
        this.hoverButton = null
        
        // text
        this.baseFontSize = Math.floor(this.cellSize * 0.3)
        this.panelFontSize = Math.floor(this.baseFontSize * 0.9)
    
        this.cellFont = `900 ${ this.baseFontSize }px 'Montserrat', serif`
        this.panelFont = `bold ${ this.panelFontSize }px 'Montserrat', serif`
        
        // paddings & styles
        this.canvasPadding = Math.floor(this.cellSize * 0.05)
        this.cellPadding = Math.floor(this.cellSize * 0.05)
        this.rectRound = Math.floor(this.cellSize * 0.07)
        this.tokenSize = this.cellSize - this.cellPadding * 2

        // menu panel
        this.panelSize = Math.floor(this.cellSize * 1.6)
        this.panelBasePadding = this.canvasPadding + this.cellPadding
        this.panelButtonSize = Math.floor(this.cellSize * 0.35)
        this.arrowButtonWidth = Math.floor(this.cellSize * 0.5)
        this.arrowButtonHeight = this.cellSize

        this.panelCurrentToken = 0
        this.panelSelectedToken = null

        // canvas
        this.computeCanvasSize()
        
        // menu buttons
        this.buttonRadius = Math.floor(this.panelButtonSize * 0.5),
        this.buttonPadding = Math.floor(this.panelButtonSize * 0.3)
        
        //=======================
        this.element.appendChild(this.canvas)
        this.frameCallback = this.frame.bind(this)
        this.computeStyles()
        this.attachEvents()
        
        this.computePanelButtons()
    }

    computeCanvasSize(){
        this.canvas.width = this.cellSize * this.board.cols + this.canvasPadding * 2
        this.canvas.height = (
            this.cellSize * this.board.rows + 
            this.canvasPadding * 2 + this.panelSize
        )
    }

    computePanelButtons(){
        let decreaseRowsButton = [
            Math.floor(this.canvas.width / 2) - Math.floor(this.cellSize * 0.55) - this.panelButtonSize,
            Math.floor(this.panelSize * 0.99) - this.panelBasePadding - this.panelButtonSize,
            this.panelButtonSize,
            this.panelButtonSize,
        ],
        increaseRowsButton = [
            decreaseRowsButton[0],
            decreaseRowsButton[1] - this.panelButtonSize * 2,
            this.panelButtonSize,
            this.panelButtonSize,
        ],
        decreaseColsButton = [
            decreaseRowsButton[0] - Math.floor(this.panelButtonSize * 1.6),
            decreaseRowsButton[1],
            this.panelButtonSize,
            this.panelButtonSize,
        ],
        increaseColsButton = [
            decreaseColsButton[0],
            increaseRowsButton[1],
            this.panelButtonSize,
            this.panelButtonSize,
        ],
        leftArrowButton = [
            this.canvas.width 
            - this.panelBasePadding
            - Math.floor(
                (this.canvas.width - (
                    Math.floor(this.canvas.width / 2)
                    - Math.floor(this.cellSize * 0.55)
                    + this.panelBasePadding * 2)
                ) 
              / 2) 
            - this.cellSize,
            this.panelSize - this.cellSize - this.panelBasePadding,
            this.arrowButtonWidth,
            this.arrowButtonHeight,
        ],
        setToken = [
            leftArrowButton[0] + this.arrowButtonWidth + this.cellPadding,
            leftArrowButton[1] + this.cellPadding,
            this.tokenSize,
            this.tokenSize,
        ],
        rightArrowButton = [
            leftArrowButton[0] + this.arrowButtonWidth + this.cellSize,
            leftArrowButton[1],
            this.arrowButtonWidth,
            this.arrowButtonHeight,
        ],
        closeButton = [
            rightArrowButton[0] + this.arrowButtonWidth - this.panelButtonSize,
            Math.floor(this.panelButtonSize * 0.15),
            this.panelButtonSize,
            this.panelButtonSize,
        ],
        reloadButton = [
            closeButton[0] - (this.panelButtonSize + Math.floor(this.buttonPadding * 0.5)),
            closeButton[1],
            this.panelButtonSize,
            this.panelButtonSize,
        ],
        saveButton = [
            reloadButton[0] - (this.panelButtonSize + Math.floor(this.buttonPadding * 0.5)),
            reloadButton[1],
            this.panelButtonSize,
            this.panelButtonSize,
        ]

        this.buttons = {
            decreaseRowsButton,
            increaseRowsButton,
            decreaseColsButton,
            increaseColsButton,
            leftArrowButton,
            setToken,
            rightArrowButton,
            closeButton,
            reloadButton,
            saveButton,
        }

        const cfg = {
            x: setToken[0],
            y: setToken[1],
            baseConfig: this.baseConfig,
        }

        this.panelTokens = [1, ...Object.values(PassiveToken.prototype.states)].map(
            v => Token.create(v, cfg)
        )
    }

    refreshUI(){
        this.computeCanvasSize()
        this.computePanelButtons()
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

        this.passiveConfig = Object.freeze({
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

        this.panelConfig = Object.freeze({
            ctx: this.ctx,
            panelBackground: '#fff',
            bottomLineY: Math.floor(this.panelSize * 0.99),
            bottomLineWidth: Math.floor(this.cellSize * 0.04),
            bottomLineStrokeStyle: '#666',
            fontColor: '#555',
            buttonColor: '#aaa',
            hoverButtonColor: '#888',
            iconColor: '#eee',
            iconLineWidth: Math.floor(this.panelButtonSize * 0.15),
            arrowWidth: Math.floor(this.arrowButtonWidth * 0.5),
            arrowHeight: this.arrowButtonWidth,
            arrowLineWidth: Math.floor(this.arrowButtonWidth * 0.25)
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

        // при всплытии тача на клик, будет двойной клик, а это удаляет элемент
        // если всплытие убрать, не заработают кнопки
        //
        //this.canvas.addEventListener('touchstart', (function(e){
        //    this.eventQueue.push(this.onHover.bind(this, e))
        //    this.eventQueue.push(this.onTouch.bind(this, e))
        //}).bind(this), false)
        //
        //this.canvas.addEventListener('touchend', (function(e){
        //    this.eventQueue.push(this.onTouch.bind(this, e))
        //    this.hoverToken = null
        //}).bind(this), false)

        /* 
        Холст не перемещается по странице, при ведении пальцем,
        но если карта большая, ее не сдвинуть - нужно создать иконку
        для вкл/выкл перемещения или при долком касании end-start >= 1000
        
        this.canvas.addEventListener('touchmove', (function(e){
            e.preventDefault()
        }).bind(this), false)

        this.canvas.addEventListener('touchcancel', (function(e){
            e.preventDefault()
        }).bind(this), false) */
    }

    onHover(e){
        const cursorPix = this.canvasPixelCoords(e),
              hoverCell = this.hoverTokenCoords(cursorPix),
              hoverButton = this.hoverButtonName(cursorPix),
              cursorType = (hoverCell || hoverButton) ? 'pointer' : 'default'
            
        this.hoverToken = hoverCell
        this.hoverButton = hoverButton
        this.canvas.style.cursor = cursorType
    }

    onClick(e){
        const pixCoords = this.canvasPixelCoords(e),
              coords = this.hoverTokenCoords(pixCoords),
              button = this.hoverButtonName(pixCoords)

        if(!coords && !button){
            return
        }

        if(coords){
            if(this.panelSelectedToken){
                
                const pixCoords = this.tokenPixelCoords(coords),
                      config = {
                          x: pixCoords[0],
                          y: pixCoords[1],
                          baseConfig: this.baseConfig,
                      },
                      raw = Token.toRaw(this.panelSelectedToken),
                      newToken = Token.create(raw, config)
                
                this.board.setItem(coords, newToken)
                this.eventQueue.push(this.onChange.bind(this))

            } else {
                if(this.selected){
                    if(this.selected[0] === coords[0] && this.selected[1] === coords[1]){
                        this.board.setItem(coords, null)
                    } else {
                        this.change(this.selected, coords)
                    }
                    this.selected = null
                    this.eventQueue.push(this.onChange.bind(this))
                } else if(this.board.getItem(coords)){
                    this.selected = coords
                }
            }
            

        } else if(button){

            switch(button){
            
            case 'increaseColsButton':
                if(this.board.cols < this.MAX_LINE_VALUE){
                    const oldData = this.save(),
                          newSize = oldData['cols'] + 1,
                          newBoard = new Board([
                              oldData['rows'],
                              newSize,
                          ]),
                          newMap = []

                    for(let i = 0; i < newBoard.length; i++){
                        if((i + 1) % newSize === 0){
                            newMap[i] = null
                            continue;
                        }
                        newMap[i] = oldData.map.shift()
                    }

                    this.board.destroy()
                    this.board = newBoard
                    this.refreshUI()
                    this.load(newMap)
                } 
                break;

            case 'decreaseColsButton':
                if(
                    (this.board.length - this.board.rows >= this.MIN_SIZE) &&
                    (this.board.cols > this.MIN_LINE_VALUE)
                ){
                    const oldData = this.save(),
                          newSize = oldData['cols'] - 1,
                          newBoard = new Board([
                              oldData['rows'],
                              newSize,
                          ]),
                          newMap = []
    
                    for(let i = 0; i < newBoard.length; i++){
                        newMap[i] = oldData.map.shift()
                        if((i + 1) % newSize === 0){
                            oldData.map.shift()
                        }
                    }

                    this.board.destroy()
                    this.board = newBoard
                    this.refreshUI()
                    this.load(newMap)
                    }
                break;
            
            case 'increaseRowsButton':
                if(this.board.rows < this.MAX_LINE_VALUE){
                    const oldData = this.save(),
                          newSize = oldData['rows'] + 1,
                          newBoard = new Board([
                              newSize,
                              oldData['cols'],
                          ]),
                          newMap = [...oldData.map, ...Array(oldData.cols).fill(null)]
                    this.board.destroy()
                    this.board = newBoard
                    this.refreshUI()
                    this.load(newMap)
                } 
                break;

            case 'decreaseRowsButton':
                if(
                    (this.board.length - this.board.cols >= this.MIN_SIZE) && 
                    (this.board.rows > this.MIN_LINE_VALUE)
                ){
                    const oldData = this.save(),
                          newSize = oldData['rows'] - 1,
                          newBoard = new Board([
                              newSize,
                              oldData['cols'],
                          ]),
                          newMap = [...oldData.map]
                          newMap.length -= oldData.cols
                    this.board.destroy()
                    this.board = newBoard
                    this.refreshUI()
                    this.load(newMap)
                } 
                break;

            case 'leftArrowButton':
                this.panelCurrentToken = (this.panelCurrentToken > 0) 
                    ? this.panelCurrentToken - 1 
                    : this.panelTokens.length - 1  
                this.panelSelectedToken = null
                break;

            case 'setToken':
                if(this.selected){
                    this.selected = null
                }
                this.panelSelectedToken = this.panelSelectedToken 
                    ? null
                    : this.panelTokens[this.panelCurrentToken]
                break;

            case 'rightArrowButton':
                this.panelCurrentToken = (this.panelCurrentToken + 1) % this.panelTokens.length
                this.panelSelectedToken = null
                break;

            case 'closeButton':
                this.state = this.CLOSE
                break;

            case 'reloadButton':
                this.state = this.RELOAD
                break;

            case 'saveButton':
                if(this.isValid()){
                    if(this.onsave){
                        this.onsave(this.save())
                    }
                    this.state = this.CLOSE
                } else {
                    this.state = this.PLAY
                }
                break;
            }
        }

    }
    
    onChange(){
        let value = 1
        for(let i = 0; i < this.board.length; i++){
            let token = this.board.getItem(this.indexToCoord(i))
            if(token instanceof ActiveToken){
                token.value = value++
            }
        }
    }

    isValid(){
        const validators = [

            conf => { // active cells amount
                const result = { errors: [], warnings: [] },
                      minimum = Math.floor(conf.map.length * 0.5),
                      recommended = Math.floor(conf.map.length * 0.7),
                      numCount = conf.map.reduce((a, e) => { 
                          return typeof(e) === 'number' ? a + 1 : a
                       }, 0)
                if(numCount < minimum){
                    result.errors.push(
//`You should be increase the number of the active tokens from ${ numCount } to ${ minimum }.`
`Количество числовых тайлов должно быть не меньше ${ minimum }, вы установили ${ numCount }.`
                    )
                } else if(numCount < recommended){
                    result.warnings.push(
//`The recommended number of active tokens should be equal or greater ${ recommended }, you set ${ numCount }.`
`Рекомендуемое количество числовых тайлов ${ recommended } и выше, вы установили ${ numCount }.`
                    )
                }
                return result
            },

            conf => { // free cells amount
                const result = { errors: [], warnings: [] },
                      minimum = Math.floor(conf.map.length * 0.1) || 1,
                      overflow = Math.floor(conf.map.length * 0.3) || 2,
                      freeCount = conf.map.reduce((a, e) => { 
                        return e ? a : a + 1
                      }, 0)
                
                if(freeCount < minimum){
                    result.errors.push(
//`You should be increase the number of the free cells from ${ freeCount } to ${ minimum }.`
`Необходимо увеличить количество пустых ячеек с ${ freeCount } до ${ minimum }.`
)
                } else if(freeCount >= overflow){
                    result.warnings.push(
//`The recommended number of the free cells should be lower ${ overflow }, you set ${ freeCount }.`
`Рекомендуемое количество пустых ячеек составляет ${ overflow - 1 } и ниже, вы установили ${ freeCount }.`
)
                }

                return result
            },

            conf => { // passive cells amount
                const result = { errors: [], warnings: [] },
                      recommended = Math.floor(conf.map.length * 0.1) || 1,
                      overflow = Math.floor(conf.map.length * 0.25) || 3,
                      passiveCount = conf.map.reduce((a, e) => { 
                        return typeof(e) === 'string' ? a + 1 : a
                      }, 0)
                
                if(passiveCount < recommended){
                    result.warnings.push(
//`For an interesting game, the recommended number of passive tokens can be about ${ recommended }, you set ${ passiveCount }.`
`Для интересной и насыщенной игры, рекомендуется установить ${ recommended } неигровых тайлов, вы установили ${ passiveCount }.`
)
                } else if(passiveCount >= overflow){
                    result.errors.push(
//`You should be decrease the number of the passive cells from ${ passiveCount } to ${ overflow - 1}.`
`Необходимо уменьшить количество неигровых тайлов с ${ passiveCount } до ${ overflow - 1}.`
                    )
                }

                return result
            },

            conf => {
                const result = { errors: [], warnings: [] },
                      rows = conf.rows,
                      cols = conf.cols,
                      incorrectAngleTokens = [
                          'top',
                          'bottom',
                          'left',
                          'right',
                          'horizontal',
                          'vertical',
                          'all',
                      ],
                      incorrectRowTokens = [
                          'top',
                          'bottom',
                          'vertical',
                          'all',
                      ],
                      incorrectColTokens = [
                          'left',
                          'right',
                          'horizontal',
                          'all',
                      ]

                conf.map.forEach((e, i) => {
                    const row = Math.floor(i / cols),
                          col = i % cols

                    let coords = null

                    if(
                        (row === 0 && col === 0) 
                        || (row === 0 && col === (cols - 1))
                        || (row === (rows - 1) && col === 0)
                        || (row === (rows - 1) && col === (cols - 1))
                    ){
                        if(incorrectAngleTokens.includes(e)){
                            coords = this.indexToCoord(i).map(e => e += 1)
                            result.errors.push(
//`It makes no sense to use a "${ e }" token state in the [${ this.indexToCoord(i) }] cell.`
`Не имеет смысла использовать неактивный тайл "${ e }" в ячейке [${ coords }].`
                            )
                            return;
                        }
                    }
                    
                    if(row === 0 || row === (rows - 1)){
                        if(incorrectRowTokens.includes(e)){
                            coords = this.indexToCoord(i).map(e => e += 1)
                            result.errors.push(
//`It makes no sense to use a "${ e }" token state in the [${ this.indexToCoord(i) }] cell.`
`Не имеет смысла использовать неактивный тайл "${ e }" в ячейке [${ coords }].`
                            )
                            return;
                        }
                    }

                    if(col === 0 || col === (cols - 1)){
                        if(incorrectColTokens.includes(e)){
                            coords = this.indexToCoord(i).map(e => e += 1)
                            result.errors.push(
//`It makes no sense to use a "${ e }" token state in the [${ this.indexToCoord(i) }] cell.`
`Не имеет смысла использовать неактивный тайл "${ e }" в ячейке [${ coords }].`
                            )
                        }
                        return;
                    }
                })

                return result
            },

            conf => {
                const result = { errors: [], warnings: [] },
                      passiveCellsCoords = conf.map.map((e, i) => {
                          if(typeof(e) === 'string'){
                              return this.indexToCoord(i)
                          }
                      }).filter(e => !!e)

                passiveCellsCoords.forEach((c, i, a) => {
                    for(let j = i + 1; j < a.length; j++){
                        let n = a[j]

                        if(
                            ((Math.abs(c[0] - n[0]) === 1) && c[1] === n[1])
                            || ((Math.abs(c[1] - n[1]) === 1) && c[0] === n[0])
                        ){
                            result.warnings.push(
//`Pay attention to the correctness of nearby passive tokens [${ c }] and [${ n }].`
`Будьте внимательны, устанавливая рядом неактивные тайлы в ячейках [${ c.map(e => e += 1) }] и [${ n.map(e => e += 1) }].`
                            )
                        }
                    }
                })

                return result
            }
        ]

        const rawMap = this.save()

        const data = validators
            .map(fn => fn(rawMap))
            .reduce((acc, res) => {
                if(res.errors){
                    acc.errors = [...acc.errors, ...res.errors]
                }
                if(res.warnings){
                    acc.warnings = [...acc.warnings, ...res.warnings]
                }
                return acc
            }, { errors: [], warnings: [] })

        console.log(`[errors]\n${ data.errors.join('\n') }\n[warnings]\n${ data.warnings.join('\n') }\n`)

        if(data.errors.length > 0){
            if(this.onerror){
                this.onerror(data.errors.slice())
            }         
            return false
        } else if(data.warnings.length > 0 && this.onwarning){
            return this.onwarning(data.warnings.slice())
        } else {
            return true
        }
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

    hoverButtonName(coords){

        const canvPad = this.canvasPadding,
              width = this.canvas.width - canvPad,
              height = this.panelSize,
              buttons = this.buttons

        if(
            (coords[0] < canvPad || coords[1] < canvPad) ||
            (coords[0] > width || coords[1] > height)
        ){
            return null
        }

        for(let buttonName in buttons){
            let button  = buttons[buttonName]
            if(
                (button[0] < coords[0] && coords[0] < button[0] + button[2]) && 
                (button[1] < coords[1] && coords[1] < button[1] + button[3])
            ){
                return buttonName
            }
        }

        return null
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

    clearLocalData(){
        this.hoverToken = null
        this.selected = null
        this.changed = true
        this.state = null
        this.panelSelectedToken = null
        this.panelCurrentToken = 0
        this.eventQueue.length = 0
    }

    destroy(){
        this.clearLocalData()
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

        if(!data){
            data = this.initialBoard
        }

        if(!(Array.isArray(data) && data.length === this.board.length)){
            throw RangeError(`\
CellsBuilder.load: the argument must be an Array(${ this.board.length }), given (${ Array.isArray(data) ? data.length : typeof(data) })`)
        }

        this._data = data
        const baseConfig = this.baseConfig

        data.forEach((primitive, i) => {

            // board coordinates
            const coord = this.indexToCoord(i),
                  [cX, cY] = this.cellPixelCoords(coord),
                  [x, y] = this.tokenPixelCoords(coord)
            
            const cell = this.board.getCell(coord)

            cell.label = '?'
            cell.x = cX
            cell.y = cY
            // the 'baseConfig' is a singleton that contains common readonly props
            cell.token = Token.create(primitive, {x, y, baseConfig})
        })
    }

    save(){
        const res = {
            cols: this.board.cols,
            rows: this.board.rows,
            map: [],
        }

        for(let i = 0; i < this.board.length; i++){
            let token = this.board.getItem(this.indexToCoord(i))
            res.map.push(Token.toRaw(token))
        }
        return res
    }

    clear(){
        const ctx = this.ctx
        ctx.shadowBlur = 0
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    _drawButtonArc(ctx, color, x, y, r){
        ctx.beginPath()
        ctx.fillStyle = color
        ctx.moveTo(x, y)
        ctx.arc(x, y, r, 0, Math.PI * 2)     
        ctx.fill()
        ctx.closePath()
    }

    _drawPanelText(ctx, font, value, color, x, y, width){
        ctx.beginPath()
        ctx.font = font
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(
            value,
            x,
            y,
            width
        )
        ctx.fill()
        ctx.closePath()
    }

    drawPanel(config){

        const ctx = config.ctx,
              cellSize = this.cellSize,
              font = this.panelFont,
              fontColor = config.fontColor,
              buttonSize = this.panelButtonSize,
              buttonPadding = this.buttonPadding,
              buttonColor = config.buttonColor,
              hoverColor = config.hoverButtonColor,
              hoverButton = this.hoverButton,
              iconColor = config.iconColor,
              iconLineWidth = config.iconLineWidth,
              arrowButtonWidth = this.arrowButtonWidth,
              arrowWidth = config.arrowWidth,
              arrowHeight = config.arrowHeight,
              arrowLineWidth = config.arrowLineWidth,
              radius = this.buttonRadius

              
        // decrease rows button
        let button = 'decreaseRowsButton',
            x = this.buttons[button][0],
            y = this.buttons[button][1],
            centerX = x + radius,
            centerY = y + radius,
            fillColor = (hoverButton === button) ? hoverColor : buttonColor
        this._drawButtonArc(ctx, fillColor, centerX, centerY, radius)
        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.strokeStyle = iconColor
        ctx.lineWidth = iconLineWidth
        ctx.moveTo(x + buttonPadding, centerY)
        ctx.lineTo(x + buttonSize - buttonPadding, centerY)
        ctx.stroke()
        ctx.closePath()

        // rows number value
        y -= buttonSize
        this._drawPanelText(
            ctx,
            font,
            this.board.rows,
            fontColor,
            x + radius,
            y + radius,
            buttonSize
        );

        // increase rows button
        button = 'increaseRowsButton'
        x = this.buttons[button][0]
        y = this.buttons[button][1]
        centerY = y + radius
        fillColor = (hoverButton === button) ? hoverColor : buttonColor
        this._drawButtonArc(ctx, fillColor, centerX, centerY, radius)
        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.strokeStyle = iconColor
        ctx.lineWidth = iconLineWidth
        ctx.moveTo(centerX, y + buttonPadding)
        ctx.lineTo(centerX, y + buttonSize - buttonPadding)
        ctx.moveTo(x + buttonPadding, centerY)
        ctx.lineTo(x + buttonSize - buttonPadding, centerY)
        ctx.stroke()
        ctx.closePath()

        // rows header
        y -= buttonSize
        this._drawPanelText(
            ctx,
            font,
            'H',
            fontColor,
            x + buttonSize * 0.5,
            y + buttonSize * 0.5,
            buttonSize
        );


        // decrease cols button
        button = 'decreaseColsButton'
        x = this.buttons[button][0]
        y = this.buttons[button][1]
        centerX = x + radius
        centerY = y + radius
        fillColor = (hoverButton === button) ? hoverColor : buttonColor
        this._drawButtonArc(ctx, fillColor, centerX, centerY, radius)
        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.strokeStyle = iconColor
        ctx.lineWidth = iconLineWidth
        ctx.moveTo(x + buttonPadding, centerY)
        ctx.lineTo(x + buttonSize - buttonPadding, centerY)
        ctx.stroke()
        ctx.closePath()

        // cols value
        y -= buttonSize
        this._drawPanelText(
            ctx,
            font,
            this.board.cols,
            fontColor,
            x + radius,
            y + radius,
            buttonSize
        );

        // increase cols button
        button = 'increaseColsButton'
        x = this.buttons[button][0]
        y = this.buttons[button][1]
        centerY = y + radius
        fillColor = (hoverButton === button) ? hoverColor : buttonColor
        this._drawButtonArc(ctx, fillColor, centerX, centerY, radius)
        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.strokeStyle = iconColor
        ctx.lineWidth = iconLineWidth
        ctx.moveTo(centerX, y + buttonPadding)
        ctx.lineTo(centerX, y + buttonSize - buttonPadding)
        ctx.moveTo(x + buttonPadding, centerY)
        ctx.lineTo(x + buttonSize - buttonPadding, centerY)
        ctx.stroke()
        ctx.closePath()

        // cols header
        y = y - buttonSize
        this._drawPanelText(
            ctx,
            font,
            'W',
            fontColor,
            x + buttonSize * 0.5,
            y + buttonSize * 0.5,
            buttonSize
        )

        // separator
        x = x + buttonSize
        this._drawPanelText(
            ctx,
            font,
            '/',
            fontColor,
            x + buttonPadding,
            y + buttonSize * 0.5,
            buttonPadding * 2
        );


        // left arrow
        button = 'leftArrowButton'
        x = this.buttons[button][0]
        y = this.buttons[button][1]
        centerX = x + Math.floor(arrowButtonWidth * 0.5)
        centerY = y + arrowButtonWidth
        fillColor = (hoverButton === button) ? hoverColor : buttonColor
        ctx.beginPath()
        //ctx.fillStyle = '#aaa'
        //ctx.fillRect(x, y, arrowButtonWidth, cellSize)
        //ctx.fill()
        ctx.lineWidth = arrowLineWidth
        ctx.lineCap = 'round'
        ctx.strokeStyle = fillColor
        ctx.moveTo(centerX + Math.floor(arrowWidth * 0.5), centerY - Math.floor(arrowHeight * 0.5))
        ctx.lineTo(centerX - Math.floor(arrowWidth * 0.5), centerY)
        ctx.lineTo(centerX + Math.floor(arrowWidth * 0.5), centerY + Math.floor(arrowHeight * 0.5))
        ctx.stroke()
        ctx.closePath()

        // cell
        button = 'setToken'
        fillColor = (hoverButton === button) ? '#bbb' : '#ccc'
        ctx.beginPath()
        ctx.fillStyle = fillColor
        ctx.fillRect(x + arrowButtonWidth, y, cellSize, cellSize)
        const token = this.panelTokens[this.panelCurrentToken]
        if(token){
            let tConf = token instanceof ActiveToken ? this.activeConfig : this.passiveConfig
            if(this.panelSelectedToken){
                tConf = Object.assign({}, tConf, {
                    tokenFillColor: '#8f8f8f'
                })
            }
            token.draw(tConf)
        }
        ctx.closePath();

        // right arrow
        button = 'rightArrowButton'
        x = this.buttons[button][0]
        y = this.buttons[button][1]
        centerX = x + Math.floor(arrowButtonWidth * 0.5)
        fillColor = (hoverButton === button) ? hoverColor : buttonColor
        ctx.beginPath()
        //ctx.fillStyle = '#aaa'
        //ctx.fillRect(x, y, arrowButtonWidth, cellSize)
        //ctx.fill()
        ctx.lineWidth = arrowLineWidth
        ctx.lineCap = 'round'
        ctx.strokeStyle = fillColor
        ctx.moveTo(centerX - Math.floor(arrowWidth * 0.5), centerY - Math.floor(arrowHeight * 0.5))
        ctx.lineTo(centerX + Math.floor(arrowWidth * 0.5), centerY)
        ctx.lineTo(centerX - Math.floor(arrowWidth * 0.5), centerY + Math.floor(arrowHeight * 0.5))
        ctx.stroke()
        ctx.closePath();

        // close button
        button = 'closeButton'
        x = this.buttons[button][0]
        y = this.buttons[button][1]
        centerX = x + radius
        centerY = y + radius
        fillColor = (hoverButton === button) ? hoverColor : buttonColor
        ctx.beginPath()
        ctx.fillStyle = fillColor
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
        // close icon
        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.strokeStyle = iconColor
        ctx.lineWidth = iconLineWidth
        ctx.moveTo(x + buttonPadding, y + buttonPadding)
        ctx.lineTo(x + buttonSize - buttonPadding, y + buttonSize - buttonPadding)
        ctx.moveTo(x + buttonSize - buttonPadding, y + buttonPadding)
        ctx.lineTo(x + buttonPadding, y + buttonSize - buttonPadding)
        ctx.stroke()
        ctx.closePath();

        // reload button
        button = 'reloadButton'
        x = this.buttons[button][0]
        y = this.buttons[button][1]
        centerX = x + radius   
        fillColor = (hoverButton === button) ? hoverColor : buttonColor
        ctx.beginPath()
        ctx.fillStyle = fillColor
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
        // reload icon
        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.strokeStyle = iconColor
        ctx.lineWidth = iconLineWidth
        ctx.arc(centerX, centerY, radius - buttonPadding * 0.8, Math.PI * 0.2, 2* Math.PI - Math.PI * 0.4)
        ctx.stroke()
        ctx.closePath();

        // save button
        button = 'saveButton'
        x = this.buttons[button][0]
        y = this.buttons[button][1]
        centerX = x + radius
        fillColor = (hoverButton === button) ? hoverColor : buttonColor
        ctx.beginPath()
        ctx.fillStyle = fillColor
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
        // save icon
        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.strokeStyle = iconColor
        ctx.lineWidth = iconLineWidth
        ctx.moveTo(x + buttonPadding, y + buttonPadding * 1.5)
        ctx.lineTo(centerX, y + buttonSize - buttonPadding)
        ctx.lineTo(x + buttonSize - buttonPadding, y + buttonPadding)
        ctx.stroke()
        ctx.closePath()

        // panel bottom line
        ctx.lineWidth = config.bottomLineWidth
        ctx.strokeStyle = config.bottomLineStrokeStyle
        ctx.beginPath()
        ctx.moveTo(0, config.bottomLineY)
        ctx.lineTo(this.canvas.width, config.bottomLineY)
        ctx.stroke()
        ctx.closePath()

    } // _drawPanel

    draw(){

        if(!this.changed){
            return
        }

        this.changed = false

        this.clear()
        this.drawPanel(this.panelConfig)

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
            } else if(token instanceof PassiveToken){
                config = this.passiveConfig
            }
            
            const s = this.selected
            if(s && (s[0] === coords[0] && s[1] === coords[1])){
                changes.tokenFillColor = '#8f8f8f'
            }

            const c = this.hoverToken
            if(c && (c[0] === coords[0] && c[1] === coords[1])){
               changes.tokenBorderColor = '#aaa'
               changes.tokenBorderWidth = Math.floor(this.tokenSize * 0.05)
            }

            if(Object.keys(changes).length){
                config = Object.assign({}, config, changes)
            }

            token.draw(config)
        }
    }

    update(){
        const queue = this.eventQueue

        if(!queue.length){
            return
        }

        this.changed = true

        while(queue.length){
            let h = queue.shift()
            if(h){
                h()
            }
        }

        queue.length = 0
    }

    frame(){
        this.update()
        this.draw()

        switch(this.state){

        case this.PLAY:
            this.frameDescriptor = window.requestAnimationFrame(this.frameCallback)
            break;

        case this.RELOAD:
            this.clearLocalData()
            this.board.destroy()
            this.board = new Board(this.initialSize)
            this.load(this.initialBoard)
            this.refreshUI()

            this.state = this.PLAY
            this.frameDescriptor = window.requestAnimationFrame(this.frameCallback)
            break;

        case this.CLOSE:
            window.cancelAnimationFrame(this.frameDescriptor)
            this.destroy()
            break;

        default:
            throw new RangeError(
`CellsBuilder.frame: incorrect game state "${ this.state }"`
            )

        }
    }

    run(){
        if(this.onopen){
            this.onopen()
        }

        this.state = this.PLAY
        this.frameDescriptor = window.requestAnimationFrame(this.frameCallback)
    }
}

export default CellsBuilder
