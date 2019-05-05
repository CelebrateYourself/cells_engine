
export class Timer {

    constructor(){
        this.startStamp = 0
        this.currentStamp = 0

        this.pauseTime = 0
    }

    start(){
        this.startStamp = new Date().getTime()
        this.currentStamp = this.startStamp
    }

    pause(){
        this.pauseTime += new Date().getTime()
    }

    draw(config){
        const ctx = config.ctx

        ctx.font = config.font
        ctx.fillStyle = config.textFillStyle
        ctx.textAlign = config.textAlign
        ctx.textBaseline = config.textBaseline
        ctx.fillText(
            this.toString(),
            config.x,
            config.y,
        )
    }

    update(){
        this.currentStamp = new Date().getTime()
    }

    getSeconds(){
        return Math.floor((this.currentStamp - this.startStamp - this.pauseTime) / 1000)
    }

    getTimeArray(){
        const s = this.getSeconds()
        
        return [
            Math.floor(s / 3600),
            Math.floor(s / 60),
            s % 60,
        ]
    }

    toString(){
        const time = this.getTimeArray()

        const strTimeArray = time.map((chunk, i) => {
            return (i && chunk < 10) ? `0${ chunk }` : `${ chunk }`
        })

        return strTimeArray.join(':')
    }
}