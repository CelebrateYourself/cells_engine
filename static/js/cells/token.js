

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
            return PassiveToken.create(raw, viewConfig)
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

        // canvas pixels
        this.x = viewConfig.x
        this.y = viewConfig.y
        // common sizes
        this.config = viewConfig.baseConfig
        // model
        this.weight = 100
        this.value = value
    }

    toString(){
        return String(this.value)
    }

    static create(raw, viewConfig){
        if(raw === 'heavy'){
            return new HeavyPassiveToken(raw, viewConfig)
        } else if(raw === 'light'){
            return new LightPassiveToken(raw, viewConfig)
        }
    }
}


class HeavyPassiveToken extends PassiveToken {
    
    constructor(value, viewConfig){
        super(value, viewConfig)

        this.weight = 80
    }

    toString(){
        return String(this.value)
    }

    draw(config){

        const ctx = this.config.ctx,
              tokenSize = this.config.tokenSize,
              rectRound = this.config.rectRound,
              x = this.x,
              y = this.y,
              roundRect = this.config._roundRect

        // border
        ctx.fillStyle = config.tokenFillColor
        ctx.lineWidth = config.tokenBorderWidth
        ctx.strokeStyle = config.tokenBorderColor
        ctx.setLineDash([config.tokenBorderDashFilledSize, config.tokenBorderDashEmptySize])
        roundRect(ctx, x, y, tokenSize, tokenSize, rectRound, true, true)
        // reset dash
        ctx.setLineDash([])

        // text
        ctx.font = config.font
        ctx.fillStyle = config.textFillStyle
        ctx.textAlign = config.textAlign
        ctx.textBaseline = config.textBaseline
        ctx.fillText(
            String.fromCharCode(59455),
            x + config.localTextX,
            y + config.localTextY,
            config.textMaxWidth,
        )
    }
}


class LightPassiveToken extends PassiveToken {
    
    constructor(value, viewConfig){
        super(value, viewConfig)

        this.weight = 40
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

        ctx.fillStyle = config.tokenFillColor
        roundRect(ctx, x, y, tokenSize, tokenSize, rectRound, true, false)
        // text
        ctx.font = config.font
        ctx.fillStyle = config.textFillStyle
        ctx.textAlign = config.textAlign
        ctx.textBaseline = config.textBaseline
        ctx.fillText(
            String.fromCharCode(61872),
            x + config.localTextX,
            y + config.localTextY,
            config.textMaxWidth,
        )
    }
}


export {
    Token,
    ActiveToken,
    PassiveToken,
    HeavyPassiveToken,
    LightPassiveToken,
}
