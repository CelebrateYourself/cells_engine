import { random } from './utils'

class Token {

    constructor(){
        this.weight = 0
    }
    
    draw(){
        throw TypeError(`\
Token.draw: is an abstract method. Must be overridden by subclasses`)
    }

    static create(raw, viewConfig){
        
        const type = typeof(raw)

        if(type === 'number'){
            return new ActiveToken(raw, viewConfig)
        } else if(type === 'string'){
            return new PassiveToken(raw, viewConfig)
        } else {
            return null
        }
    }
}


class ActiveToken extends Token {
    
    constructor(value, viewConfig){
        super()   
        
        // canvas pixels
        this.x = viewConfig.x
        this.y = viewConfig.y
        // base sizes
        this.config = viewConfig.baseConfig
        // model
        this.weight = 60
        this.value = value
    }

    toString(){
        return String(this.value)
    }

    draw(config){

        const ctx = this.config.ctx,
              tokenSize = this.config.tokenSize,
              rectRound = this.config.rectRound,
              roundRect = this.config._roundRect,
              x = this.x,
              y = this.y

        // token
        ctx.shadowBlur = config.tokenShadowBlur
        ctx.shadowColor = config.tokenShadowColor
        ctx.shadowOffsetX = config.tokenShadowOffsetX
        ctx.shadowOffsetY = config.tokenShadowOffsetY   
        ctx.fillStyle = config.tokenFillColor
        roundRect(ctx, x, y, tokenSize, tokenSize, rectRound, true, false)
        // reset shadow effect
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
            
        // border
        ctx.strokeStyle = config.tokenBorderColor
        ctx.lineWidth = config.tokenBorderWidth
        roundRect(ctx, x, y, tokenSize, tokenSize, rectRound, false, true)

        // text
        ctx.font = config.font
        ctx.fillStyle = config.textFillStyle
        ctx.textAlign = config.textAlign
        ctx.textBaseline = config.textBaseline
        ctx.fillText(
            String(this.value),
            x + config.localTextX,
            y + config.localTextY,
            config.textMaxWidth
        )
    }
}


class PassiveToken extends Token {
    
    
    constructor(value, viewConfig){
        super()

        if(Object.values(this.states).indexOf(value) < 0){
            throw new Error(
                'PassiveToken.constructor: the "value" ['+ value +'] should be ' + 
                'an existing state (' + Object.values(this.states).join(', ') + ')'
            )
        }

        // canvas pixels
        this.x = viewConfig.x
        this.y = viewConfig.y
        // common sizes
        this.config = viewConfig.baseConfig
        // model
        this.weight = 80
        this.value = value
        this.state = value
    }

    toString(){
        return String(this.value)
    }

    _drawSingleArrow(ctx, arw1, arwC, arw2){
        ctx.beginPath()
        ctx.moveTo(...arw1)
        ctx.lineTo(...arwC)
        ctx.lineTo(...arw2)
        ctx.stroke()
        ctx.closePath()
    }

    _drawSingleArc(ctx, arcC, arcR){
        ctx.beginPath()
        ctx.arc(...arcC, arcR, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
    }

    draw(config){

        const ctx = this.config.ctx,
              tokenSize = this.config.tokenSize,
              rectRound = this.config.rectRound,
              roundRect = this.config._roundRect,
              x = this.x,
              y = this.y,
              centerX = x + config.center,
              centerY = y + config.center,
              figRadius = config.figureRadius,
              halfFigRadius = figRadius / 2

        ctx.fillStyle = config.tokenFillColor
        roundRect(ctx, x, y, tokenSize, tokenSize, rectRound, true, false)
        
        // arrows
        ctx.lineCap = config.lineCap
        ctx.lineWidth = config.lineWidth
        ctx.strokeStyle = config.arrowColor
        ctx.fillStyle = config.arcFill

        switch(this.state){

        case this.states.BOTTOM:
            this._drawSingleArrow(
                ctx,
                [centerX - figRadius, centerY], 
                [centerX, centerY + figRadius],
                [centerX + figRadius, centerY]
            )
            this._drawSingleArc(
                ctx,
                [centerX, centerY - halfFigRadius],
                halfFigRadius
            )
            break;

        case this.states.TOP:
            this._drawSingleArrow(
                ctx,
                [centerX - figRadius, centerY], 
                [centerX, centerY - figRadius],
                [centerX + figRadius, centerY]
            )
            this._drawSingleArc(
                ctx,
                [centerX, centerY + halfFigRadius],
                halfFigRadius
            )
            break;

        case this.states.LEFT:
            this._drawSingleArrow(
                ctx,
                [centerX, centerY - figRadius], 
                [centerX - figRadius, centerY],
                [centerX, centerY + figRadius]
            )
            this._drawSingleArc(
                ctx,
                [centerX + halfFigRadius, centerY],
                halfFigRadius
            )
            break;

        case this.states.RIGHT:
            this._drawSingleArrow(
                ctx,
                [centerX, centerY - figRadius], 
                [centerX + figRadius, centerY],
                [centerX, centerY + figRadius]
            )
            this._drawSingleArc(
                ctx,
                [centerX - halfFigRadius, centerY],
                halfFigRadius
            )
            break;

        case this.states.ALL:
            this._drawSingleArrow(
                ctx,
                [centerX - halfFigRadius, centerY - figRadius],
                [centerX, centerY - figRadius - halfFigRadius],
                [centerX + halfFigRadius, centerY - figRadius]
            )
            this._drawSingleArrow(
                ctx,
                [centerX - halfFigRadius, centerY + figRadius],
                [centerX, centerY + figRadius + halfFigRadius],
                [centerX + halfFigRadius, centerY + figRadius]
            )
            this._drawSingleArrow(
                ctx,
                [centerX - figRadius, centerY - halfFigRadius],
                [centerX - figRadius - halfFigRadius, centerY],
                [centerX - figRadius, centerY + halfFigRadius]
            )
            this._drawSingleArrow(
                ctx,
                [centerX + figRadius, centerY - halfFigRadius],
                [centerX + figRadius + halfFigRadius, centerY],
                [centerX + figRadius, centerY + halfFigRadius]
            )
            
            ctx.beginPath()
            ctx.strokeStyle = config.arcFill
            ctx.moveTo(centerX, centerY - halfFigRadius)
            ctx.lineTo(centerX, centerY + halfFigRadius)
            ctx.moveTo(centerX - halfFigRadius, centerY)
            ctx.lineTo(centerX + halfFigRadius, centerY)
            ctx.stroke()
            ctx.closePath()
            /*
            this._drawSingleArc(
                ctx,
                [centerX, centerY],
                halfFigRadius,
            )*/
            break;

        case this.states.VERTICAL:
            this._drawSingleArrow(
                ctx,
                [centerX - halfFigRadius, centerY - figRadius],
                [centerX, centerY - figRadius - halfFigRadius],
                [centerX + figRadius, centerY - halfFigRadius]
            )
            this._drawSingleArrow(
                ctx,
                [centerX - figRadius, centerY + halfFigRadius],
                [centerX, centerY + figRadius + halfFigRadius],
                [centerX + halfFigRadius, centerY + figRadius]
            )
            this._drawSingleArc(
                ctx,
                [centerX, centerY],
                halfFigRadius,
            )
            break;
        
        case this.states.HORIZONTAL:
            this._drawSingleArrow(
                ctx,
                [centerX - halfFigRadius, centerY - figRadius],
                [centerX - figRadius - halfFigRadius, centerY],
                [centerX - figRadius, centerY + halfFigRadius]
            )
            this._drawSingleArrow(
                ctx,
                [centerX + figRadius, centerY - halfFigRadius],
                [centerX + figRadius + halfFigRadius, centerY],
                [centerX + halfFigRadius, centerY + figRadius]
            )
            this._drawSingleArc(
                ctx,
                [centerX, centerY],
                halfFigRadius,
            )
            break;

        case this.states.NONE:

            this._drawSingleArc(
                ctx,
                [centerX, centerY],
                figRadius + halfFigRadius
            )
            ctx.beginPath()
            ctx.strokeStyle = config.xLineColor
            ctx.moveTo(centerX - halfFigRadius, centerY - halfFigRadius)
            ctx.lineTo(centerX + halfFigRadius, centerY + halfFigRadius)
            ctx.moveTo(centerX + halfFigRadius, centerY - halfFigRadius)
            ctx.lineTo(centerX - halfFigRadius, centerY + halfFigRadius)
            ctx.stroke()
            ctx.closePath()
            break;
        }
    }
}


Object.assign(PassiveToken.prototype, {
    states: {
        NONE: 'none',
        LEFT: 'left',
        RIGHT: 'right',
        TOP: 'top',
        BOTTOM: 'bottom',
        HORIZONTAL: 'horizontal',
        VERTICAL: 'vertical',
        ALL: 'all',
    }
})


export {
    Token,
    ActiveToken,
    PassiveToken,
}
