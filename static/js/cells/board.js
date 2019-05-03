
export class Board {

    constructor(size){
        this.rows = size[0]
        this.cols = size[1]
        this._board = Array(this.cols * this.rows)
        
        for(let i = 0; i < this.length; i++){
            this._board[i] = new Cell()
        }
    }

    get length(){
        return this._board.length
    }

    _toIndex(coord){
        const [row, col] = coord

        if(row < 0 || row >= this.rows || col < 0 || col >= this.cols){
            throw RangeError(`Board: item [${ row }, ${ col }] is out of \
range, it must be >= [0, 0] and < [${ this.rows }, ${ this.cols }]`)
        }

        return row * this.cols + col
    }

    getCell(coord){
        return this._board[ this._toIndex(coord) ]
    }

    getItem(coord){
        return this.getCell(coord).token
    }

    setItem(coord, token){
        this.getCell(coord).token = token
    }

    destroy(){
        this._board.forEach((cell, i, board) => { 
            cell.destroy()
            board[i] = null 
        })
    }

    toString(){
        let res = ''
        
        this._board.forEach((cell, i) => {
            
            if(i && i % this.cols === 0){
                res += '\n'
            }
            
            res += ` ${ String(cell) }`
        })

        return res
    }
}


class Cell {

    constructor(label = null, token = null){
        this.capacity = 100
        this.label = label
        this.token = token

        this.x = null
        this.y = null
    }

    destroy(){
        this.token = null
    }

    toString(){
        return String(this.token)
    }

    draw(config){
        const ctx = config.ctx

        ctx.font = config.font
        ctx.fillStyle = config.textFillStyle
        ctx.textAlign = config.textAlign
        ctx.textBaseline = config.textBaseline
        ctx.shadowBlur = config.textShadowBlur
        ctx.shadowColor = config.textShadowColor
        ctx.fillText(
            String(this.label || ''),
            this.x + config.localTextX,
            this.y + config.localTextY,
            config.textMaxWidth
        )
        // reset shadow effect
        ctx.shadowBlur = 0
    }
}
