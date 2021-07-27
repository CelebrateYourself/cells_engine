import { Cells, CellsBuilder } from '../../index';

const isMapBuilder = confirm('Хотите сами создать карту?');

let cells;

if(isMapBuilder) {
    cells = new CellsBuilder(null, { cellSize: 80 });

    let game, config;

    cells.onsave = function(data){
        config = data
        game = new Cells([data.rows, data.cols], { cellSize: 80 })
    }

    cells.onclose = () => {
        if(game && config){
            game.onclose = () => { window.location.reload() }; 
            game.mount('#app')
            game.load(config.map)
            game.run()
        } else {
            window.location.reload(); 
        }
    }

    cells.onerror = errors => alert(`Ошибка\n\n${ errors.join('\n') }`)
    cells.onwarning = warnings => confirm(
`Внимание

${ warnings.join('\n') }

Все равно сохранить карту?
`);

    cells.mount('#app');
    cells.load();
    cells.run();
} else {
    const size = [5, 5];

    const map = [
        1, 2, 3, 4, 5,
        6, null, 'bottom', 7, 'top',
        8, 'vertical', null, 9, 10,
        11, null, 'none', null, 12,
        13, 14, 'horizontal',15,16,
    ];

    cells = new Cells(size, { cellSize: 80 });
    cells.onclose = () => { window.location.reload() }; 
    cells.mount('#app');
    cells.load(map);
    cells.run();
}

