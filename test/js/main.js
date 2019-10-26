/*
import Cells from '../../index'


const size = [3, 4]
const map = [
    1, 2, 3, 4,
    null, 'all', 5, 6,
    7, 8, 'left', null,
]

const cells = new Cells('#app', size, { cellSize: 80 })
cells.load(map)
cells.run()
*/
import { Cells, CellsBuilder } from '../../index'


const cells = new CellsBuilder(null, { cellSize: 80 })

let game, config


cells.onsave = function(data){
    config = data
    game = new Cells([data.rows, data.cols], { cellSize: 80 })
}

cells.onclose = function(){
    if(game && config){
        game.mount('#app')
        game.load(config.map)
        game.run()
    }
}

cells.onerror = errors => alert(`Ошибка\n\n${ errors.join('\n') }`)
cells.onwarning = warnings => confirm(
`Внимание

${ warnings.join('\n') }

Все равно сохранить карту?
`)

cells.mount('#app')
cells.load()
cells.run()

