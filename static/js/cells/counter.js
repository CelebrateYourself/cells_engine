
export class Counter {

    constructor(){
        this.steps = 0
    }

    incr(){
        this.steps += 1
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
