import { Cell, Location, computer, emptyCell, fogOfWarBlock, horizontal, numberOfShips, occupiedBlock, occupiedCell, player, shipBlock, shipCell, shipSizes, vertical } from "../const";
import { BattleField, playerBattleField, computerBattleField } from '../class/battlefield';

export class ShipManagement {
    battleField: BattleField;

    constructor(battleField: BattleField) {
        this.battleField = battleField;
    }

    checkSpaceForTheShip(
        battleField: Cell[][],
        size: number,
        orientation: string,
        ): Location[] {
        //получаем нужное пустое поле или с уже размещенными на нем кораблями для проверки
        let positions: Location[] = [];
        let inspector = "s".repeat(size); //создаем строку размером с корабль для проверки на поле

        //row это будет подмассив(номер ряда), а col порядковый номер элемента(номер столбца) в подмассиве
        if (orientation === horizontal) {//находим горизонтальные варианты
            for (let row = 0; row < battleField.length; row++) {
                let rowString = battleField[row]
                    .map(col => col.typeOfCell === emptyCell ? "s" : "x")
                    .join(""); //делаем строку из ряда для проверки, если в ячейке корабль добавляем в строку "s", если пустая - "x"

                for (let col = 1; col <= rowString.length; col++) { // проверяем ряд не до конца, т.к корабль поместится не везде и с 1 потому что там техданные
                    let matchingString = rowString.substring(col, col + inspector.length); //вырезаем нужный участок для сравнения
                    if (matchingString === inspector) {
                        positions.push({row: row, col: col});//если в нашей строке помещается строка, обозначающая корабль - передаем координаты начала корабля
                    }
                }
            }
        } else {//находим вертикальные варианты
            for (let col = 0; col < battleField.length; col++) {
                let colString = battleField
                    .map(row => row[col].typeOfCell === emptyCell ? "s" : "x")
                    .join("");//делаем строку из колонки для проверки
    
                for (let row = 0; row < battleField.length; row++) {
                    let matchingString = colString.substring(row, row + inspector.length);
                    if (matchingString === inspector) {
                        positions.push({row: row, col: col});
                    }
                }
            }  
        }
        return positions;//возвращаем массив возможных позиций
    }

    addShip(
        battleField: Cell[][],
        row: number,
        col: number,
        size: number,
        orientation: string,
        isPlayer: boolean
        ): boolean {

        if (orientation === horizontal) {//размещаем корабль на схеме + забираем возможные клетки
            for (let i = 0; i < size; i++) {
                battleField[row][col + i].value = isPlayer ? shipBlock : fogOfWarBlock;//не видим корабли на чужом поле
                battleField[row][col + i].typeOfCell = shipCell; //присваеваем тип ship для ячейки
                this.battleField.surroundings(row, col + i).forEach(({row, col}) => {
                    if (row >= 0 && row < battleField.length && col >= 0 && col < battleField[row].length) {//проверяем, не выходят ли индексы за рамки
                        if (battleField[row][col].typeOfCell === emptyCell) {
                            battleField[row][col].value = isPlayer ? occupiedBlock : battleField[row][col].value;
                            battleField[row][col].typeOfCell = occupiedCell;//меняем содержание клетки
                        }
                    }
                });
            }
        } else if (orientation === vertical) {
            for (let i = 0; i < size; i++) {
                battleField[row + i][col].value = isPlayer ? shipBlock : fogOfWarBlock;
                battleField[row + i][col].typeOfCell = shipCell;
                this.battleField.surroundings(row + i, col).forEach(({row, col}) => {
                    if (row >= 0 && row < battleField.length && col >= 0 && col < battleField[row].length) {
                        if (battleField[row][col].typeOfCell === emptyCell) {
                            battleField[row][col].value = isPlayer ? occupiedBlock : battleField[row][col].value;
                            battleField[row][col].typeOfCell = occupiedCell;//меняем содержание клетки
                        }
                    }
                });
            }
        }
        return true;
    }
    
    randomShipPlacement(
        battleField: BattleField,
        isPlayer: boolean) {//автоматическая случайная расстановка кораблей

        for (let placedShips = 0; placedShips < numberOfShips; placedShips++) {//расставляем numberOfShips кораблей в случайном порядке циклом
            let orientation = Math.random() < 0.5 ? vertical : horizontal;
            let shipSize = shipSizes[placedShips];//проходимся по массиву кораблей и выбираем нужный размер (в зависимости от того, чему сейчас равен placedShips(номер элемента в массиве))
            let possibleCells = this.checkSpaceForTheShip(battleField.battleField, shipSize, orientation);//проверяем куда ткнуть корабль
            let randomCell = possibleCells[Math.floor(Math.random() * possibleCells.length)];//выбираем случайное место

            if (isPlayer) {//добавляем корабль куда надо
                this.addShip(battleField.battleField, randomCell.row, randomCell.col, shipSize, orientation, player);
            } else {
                this.addShip(battleField.battleField, randomCell.row, randomCell.col, shipSize, orientation, computer);
            }
        }
    }

    inputShipPlacement(battleField: BattleField, row: number, col: number, size: number, orientation: string) : boolean {//расстановка кораблей вручную для игрока
        let possibleCells = this.checkSpaceForTheShip(battleField.battleField, size, orientation);
        //сравниваем значения, потому что объект передается по ссылке и одинаковые значения в объектах еще не значат, что они равны
        let check = possibleCells.find(rowCol => rowCol.row === row && rowCol.col === col);
        if (check === undefined) {//если мы не нашли ни одной ячейки - вернет false, !false 
            return false;

        } else {
            this.addShip(battleField.battleField, row, col, size, orientation, player);
            console.log(`Корабль размещен на поле, теперь твоя карта выглядит вот так:\n`);
            console.log(battleField.displayBattleField(battleField));
            return true;
        }
    }
}

export const playerShipManager = new ShipManagement(playerBattleField);//создаем два экземпляра класса ShipManagement для управления полем ирока и полем компьютера
export const computerShipManager = new ShipManagement(computerBattleField);

computerShipManager.randomShipPlacement(computerBattleField, computer);//комп всегда рандомное расположение кораблей