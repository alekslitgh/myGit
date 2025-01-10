import { Cell, Location, colEnd, computer, emptyCell, fogOfWarBlock, green, mapSize, pirate, player, playerBlock, space30, space68, technicalCell } from "../const";

export class BattleField {
    sizeOfMap: number;
    battleField: Cell[][];
    possibleMoves: Location[];

    constructor(sizeOfMap: number, isPlayer: boolean) {
        this.sizeOfMap = sizeOfMap;
        this.battleField = this.generateBattleField(isPlayer);
        this.possibleMoves = this.generatePossibleMoves();
    }

    generateBattleField(isPlayer: boolean): Cell[][] { //создаем поле боя
        const map: Cell[][] = []; // создаем массив, куда будем пушить нашу карту
        for (let numberOfRow = 0; numberOfRow < this.sizeOfMap + 1; numberOfRow++) {//+ 1 потому что поле 11х11 (один ряд и столбец под нумерацию)
            const row: Cell[] = [];
            for (let numberOfCol = 0; numberOfCol < this.sizeOfMap + 1; numberOfCol++) {
                //задаем видимые значения и технические характеристики игрового поля, заполняя ряд постепенно
                if (numberOfRow === 0 && numberOfCol === 0) {
                    row.push({
                        value: " ",
                        typeOfCell: technicalCell});
                } else if (numberOfRow === 0) {//нумерация колонок в 0 раду
                    row.push({
                        value: (" " + numberOfCol.toString()),
                        typeOfCell: technicalCell
                    });
                } else if (numberOfCol === 0) {//нумерация рядов в 0 колонке
                    row.push({
                        value: (numberOfRow.toString() + (numberOfRow < 10 ? ' ' : '')),
                        typeOfCell: technicalCell
                    });
                } else {//игровое поле
                    row.push({
                        value: isPlayer ? playerBlock : fogOfWarBlock, // туман войны для компьютера
                        typeOfCell: emptyCell
                    });
                }
            }
            map.push(row);//заполняем карту готовым рядом (массивом с объектами значений)
        }
        return map;
    }

    generatePossibleMoves(): Location[] {//создаем список возможных ходов
            const possibleMoves: Location[] = [];
            for (let x = 1; x < this.sizeOfMap + 1; x++) {
                for (let y = 1; y < this.sizeOfMap + 1; y++) {
                    possibleMoves.push({row: x, col: y});//добавляем 1, потому что 1й ряд и столбец заняты под нумерацию
                }
            }
        return possibleMoves;
        }

    displayBattleField(battleField: BattleField): string {
        let battleMap = battleField.battleField.map(row =>
            row.map(cell => cell.value).join(' ')).join('\n');//проходимся по каждому ряду > по каждому элементу ряда, соединяем через пробел чтоб карта была чуть больше визуально, добавляем перенос строки
        return battleMap;
        }

    displayBothBattleFields(nick: string, playerBattleField: BattleField, computerBattleField: BattleField): string {
        let resultMap: string = " ".repeat(12) + green + nick + colEnd + "\n"; //первая строка - выводим ник игрока
        for (let i = 0; i < this.sizeOfMap + 1; i++) {//соединяем карту по кусочкам
            let playerRow = playerBattleField.battleField[i].map(cell => cell.value).join(' ');
            let computerRow = computerBattleField.battleField[i].map(cell => cell.value).join(' ');

            resultMap += playerRow + space30 + computerRow + "\n";
        }
        resultMap += space68 + pirate;//последняя строка выводим ник пирата
        return resultMap;
        }
        
    displayBattleFieldCellInfo(battleField: BattleField): string {//вспомогательный метод для отладки работы
        let battleMap = battleField.battleField.map(row =>
            row.map(cell => cell.typeOfCell).join(' ')).join('\n');
        return battleMap;
        }
    
    surroundings(row: number, col: number): Location[] {//окружение клетки с координатами row col (сделано абы как)
        let surroundings = [
            {row: row -1, col: col - 1},
            {row: row -1, col},
            {row: row -1, col: col + 1},

            {row: row, col: col - 1},
            {row: row, col: col + 1},
            
            {row: row + 1, col: col - 1},
            {row: row + 1, col},
            {row: row + 1, col: col + 1},
        ];
        return surroundings.filter(cell => 
            cell.row > 0 && cell.row <= 10 && cell.col > 0 && cell.col <= 10
            );   
    }

    orthogonalSurroundings(row: number, col: number): Location[] {//диагональное окружение клетки с координатами row col
        let surroundings = [
            {row: row -1, col},
            {row: row +1, col},
            
            {row, col: col - 1},
            {row, col: col + 1},
        ];
        return surroundings.filter(cell => 
            cell.row > 0 && cell.row <= 10 && cell.col > 0 && cell.col <= 10
            );    
    }

    crossSurroundings(row: number, col: number): Location[] {//ортогональное окружение клетки с координатами row col
        let surroundings = [
            {row: row -1, col: col - 1},
            {row: row -1, col: col + 1},
            
            {row: row + 1, col: col - 1},
            {row: row + 1, col: col + 1},
        ];
        return surroundings.filter(cell => 
            cell.row > 0 && cell.row <= 10 && cell.col > 0 && cell.col <= 10
            );    
    }

    horizontalSurroundings(row: number, col: number): Location[] {//горизонтальное окружение клетки с координатами row col
        let surroundings = [
            {row, col: col - 1},
            {row, col: col + 1},
        ];
        return surroundings.filter(cell => 
            cell.row > 0 && cell.row <= 10 && cell.col > 0 && cell.col <= 10
            );    
    }

    verticalSurroundings(row: number, col: number): Location[] {//вертикальное окружение клетки с координатами row col
        let surroundings = [
            {row: row -1, col},
            {row: row +1, col},
        ];
        return surroundings.filter(cell => 
            cell.row > 0 && cell.row <= 10 && cell.col > 0 && cell.col <= 10
            );    
    }
}

export const playerBattleField = new BattleField(mapSize, player);//создаем два экземпляра класса BattleField, один для игрока, второй для компьютера
export const computerBattleField = new BattleField(mapSize, computer);
playerBattleField.generatePossibleMoves();
computerBattleField.generatePossibleMoves();