

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

    fill(data){
        
        if(!Array.isArray(data) || data.length !== this.length){
            throw Error(`Board.fill: a given data must be an Array[${ this.length }]`)
        }
        
        this._board.forEach((cell, i) => { 
            cell.token = data[i]
        })
    }

    getCell(coord){
        return this._board[ this._toIndex(coord) ]
    }

    getItem(coord){
        console.log(`coord ${coord}, index ${this._toIndex(coord)}, token ${this.getCell(coord).token}`)
        return this.getCell(coord).token
    }

    setItem(coord, token){
        this.getItem(coord).token = token
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
        this._capacity = 100
        this.label = label
        this.token = token
    }

    get capacity(){
        return this._capacity - (this.token ? this.token.weight : 0)
    }

    toString(){
        return String(this.token)
    }
}