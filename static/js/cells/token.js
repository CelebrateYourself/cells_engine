
class Token {

    constructor(){
        this.weight = 0
    }
    
    draw(){
        throw TypeError(`\
Token.draw: is an abstract method. Must be overridden by subclasses`)
    }

    static create(raw){
        const type = typeof(raw)
        
        let token

        if(type === 'number'){
            token = new ActiveToken(raw)
        } else if(type === 'string'){
            token = new PassiveToken(raw)
        } else {
            token = null
        }
        return token
    }
}


class ActiveToken extends Token {
    
    constructor(value){
        super()
        this.weight = 60
        this.value = value
    }

    toString(){
        return String(this.value)
    }

    draw(ctx, config){

        // token
        ctx.shadowBlur = Math.floor(config.cellSize * 0.04)
        ctx.shadowColor = '#999'
        ctx.shadowOffsetX = Math.floor(config.cellSize * 0.03)
        ctx.shadowOffsetY = Math.floor(config.cellSize * 0.03)
        
        ctx.fillStyle = config.isActive ? '#888' : '#ddd'
        
        config.roundRect(
            ctx,
            config.x,
            config.y,
            config.tokenSize,
            config.tokenSize,
            config.rectRound,
            true,
            false
        )
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
            
        // border
        ctx.strokeStyle = config.isHover ? '#aaa' : '#bbb'
        ctx.lineWidth = Math.floor(config.cellSize * (config.isHover ? 0.04 : 0.02))
        config.roundRect(
            ctx,
            config.x,
            config.y,
            config.tokenSize,
            config.tokenSize,
            config.rectRound,
            false,
            true
        )

        // text
        ctx.font = config.font
        ctx.fillStyle = '#444'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowBlur = 1
        ctx.shadowColor = '#111'
        ctx.fillText(
            String(this.value),
            config.x + Math.floor(config.tokenSize / 2),
            config.y + Math.floor(config.cellPadding / 2) + Math.floor(config.tokenSize / 2),
            Math.floor(config.tokenSize * 0.75)
        )
        ctx.shadowBlur = 0 
    }
}


class PassiveToken extends Token {
    
    constructor(value){
        super()
        this.weight = 80
        this.value = value
    }

    toString(){
        return String(this.value)
    }

    draw(ctx, config){

        // border
        ctx.lineWidth = Math.floor(config.cellSize * 0.02)
        ctx.strokeStyle = '#999'
        ctx.fillStyle = '#666'
        ctx.setLineDash([
            Math.floor(config.tokenSize * 0.08),
            Math.floor(config.tokenSize * 0.05)],
        )
        config.roundRect(
            ctx,
            config.x,
            config.y,
            config.tokenSize,
            config.tokenSize,
            config.rectRound,
            false,
            true
        )
        ctx.setLineDash([])

        // text
        ctx.font = config.font
        ctx.fillStyle = '#aaa'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = '#333'
        ctx.fillText(
            String.fromCharCode(59455),
            config.x + config.tokenSize / 2,
            config.y + Math.floor(config.cellPadding / 2) + Math.floor(config.tokenSize / 2),
            Math.floor(config.tokenSize * 0.75),
        )
    }
}



module.exports = {
    Token,
    ActiveToken,
    PassiveToken,
}