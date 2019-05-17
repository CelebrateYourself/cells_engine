
export class Counter {

    constructor(init = 0){
        this._init = init
        this.steps = init
    }

    incr(){
        this.steps += 1
    }

    start(){
        this.steps = this._init
    }

    draw(config){
        const ctx = config.ctx

        ctx.font = config.font
        ctx.fillStyle = config.textFillStyle
        ctx.textAlign = config.textAlign
        ctx.textBaseline = config.textBaseline
        ctx.fillText(
            '#'+this.toString(),
            config.x,
            config.y,
        )
    }

    toString(){
        return this.steps
    }
}
