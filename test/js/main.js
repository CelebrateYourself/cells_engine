import Cells from '../../index'


const size = [3, 4]
const map = [
    1, 2, 3, 4,
    null, 'new', 5, 6,
    7, 8, 'light', null,
]

const cells = new Cells('#app', size, { cellSize: 80 })
cells.load(map)
cells.run()
