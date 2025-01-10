import {
    Location,
    colEnd,
    computer,
    damagedBlock,
    damagedCell,
    deadCell,
    deadShipBlock,
    fieldRange,
    missShotBlock,
    occupiedBlock,
    occupiedCell,
    pirate,
    player,
    realOccupiedCell,
    red,
    shipBlock,
    shipCell,
    yellow } from "../const";
import { BattleField, playerBattleField, computerBattleField } from '../class/battlefield';
import { pause, userInputNum, rl } from '../utils';


export class Battle {
    playerBoard: BattleField;
    computerBoard: BattleField;

    constructor(playerBoard: BattleField, computerBoard: BattleField) {
        this.playerBoard = playerBoard;
        this.computerBoard = computerBoard;
    }

    async playerFire() : Promise<boolean> {
        let success: boolean = false;
        let possibleMoves = this.playerBoard.possibleMoves;//выбираем возможные ходы для игрока
        let col = await userInputNum(fieldRange, `Твоя очередь производить выстрел.\nВыбирай столбец, в который будем стрелять:`,
            "К сожалению не удалось произвести выстрел в указанную клетку, введи правильную координату в диапазоне от", "");
        let row = await userInputNum(fieldRange, `Твоя очередь производить выстрел.\nВыбирай строку, куда будем стрелять:`,
            "К сожалению не удалось произвести выстрел в указанную клетку, введи правильную координату в диапазоне от", "Стреляем:");
        await pause(1000);
        if (!possibleMoves.find(coordinates => coordinates.row === row && coordinates.col === col)) {
            console.log("Эти координаты не подходят для выстрела, выбери пустое поле в пределах доски.")
            await this.playerFire(); //если выбрали неподходящие координаты - ход не переходит к оппоненту, а мы должны попытаться стрельнуть снова
        } else {
            success = this.takesDamage(row, col, computer);
            this.playerBoard.possibleMoves = possibleMoves.filter(coordinates => !(coordinates.row === row && coordinates.col === col));
        }
        return success;
    }

    computerFire() : boolean {
        let possibleMoves: Location[] = [];
        let damagedCells: Location[] = [];

        //логика стрельбы компьютера (добивание поврежденных кораблей)
        for (let row = 1; row < this.playerBoard.battleField.length; row++) {
            for (let col = 1; col < this.playerBoard.battleField.length; col++) {
                if (this.playerBoard.battleField[row][col].typeOfCell === damagedCell) {//собираем все поврежденные клетки
                    damagedCells.push({row, col});
                }
            }
        }

        if (damagedCells.length === 1) {
            //если всего одна поврежденная клетка - мы незнаем в каком направлении расположен корабль и пытаемся стрелять накрест
            possibleMoves = this.playerBoard.orthogonalSurroundings(damagedCells[0].row, damagedCells[0].col).filter(cell => 
                this.playerBoard.battleField[cell.row][cell.col].value !== missShotBlock &&
                this.playerBoard.battleField[cell.row][cell.col].typeOfCell !== occupiedCell);//отфильтровываем клетки, куда уже был произведен выстрел
            }

        if (damagedCells.length > 1) {
            //когда у нас есть несколько поврежденных клеток, то мы уже знаем направление расположения корабля
            //если мы попали по кораблю хотя бы один раз - мы не сможем стрелять по следующему пока не убьем его
            //поэтому для проверки достаточно сравнить всего две первые поврежденные клетки, остальныебудут на том же ряду или столбце
            if (damagedCells[0].row === damagedCells[1].row) {//в случае, если корабль располагается горизонтально
                //если корабль расположен горизонтально
                for (let i = 0; i < damagedCells.length; i++) {
                    let row = damagedCells[i].row;
                    let col = damagedCells[i].col;
                    //для каждой клетки находим возможные ходы
                    let movesForCell = this.playerBoard.horizontalSurroundings(row, col).filter(cell => //отфильтровываем клетки куда уже стреляли (промах и попадание)
                        this.playerBoard.battleField[cell.row][cell.col].value !== missShotBlock &&
                        this.playerBoard.battleField[cell.row][cell.col].value !== damagedBlock &&
                        this.playerBoard.battleField[cell.row][cell.col].typeOfCell !== occupiedCell
                    );
                    //добавляем в possiblemoves
                    for (let moves = 0; moves < movesForCell.length; moves++) {
                        possibleMoves.push(movesForCell[moves]);
                    }
                }
            } else {
                //если корабль расположен вертикально
                for (let i = 0; i < damagedCells.length; i++) {
                    let row = damagedCells[i].row;
                    let col = damagedCells[i].col;
                    //для каждой клетки находим возможные ходы
                    let movesForCell = this.playerBoard.verticalSurroundings(row, col).filter(cell => //отфильтровываем клетки куда уже стреляли (промах и попадание)
                        this.playerBoard.battleField[cell.row][cell.col].value !== missShotBlock &&
                        this.playerBoard.battleField[cell.row][cell.col].value !== damagedBlock &&
                        this.playerBoard.battleField[cell.row][cell.col].typeOfCell !== occupiedCell
                    );
                    //добавляем в possiblemoves
                    for (let moves = 0; moves < movesForCell.length; moves++) {
                        possibleMoves.push(movesForCell[moves]);
                    }
                }
            }
        }

        if (possibleMoves.length === 0) {//когда у нас нет поврежденных клеток, приходим сюда с 0 и выбираем случайную клетку из оставшихся ходов
            possibleMoves = this.computerBoard.possibleMoves;
        }
            
        let randomCroodinates = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]; //floor выводит правильное распределение для первого значения, выбираем случайные кординаты
        
        //убираем координаты выстрела из возможных ходов в дальнейшем
        this.computerBoard.possibleMoves = this.computerBoard.possibleMoves.filter(coordinates => !(coordinates.row === randomCroodinates.row && coordinates.col === randomCroodinates.col));
        //проверяем надамажилась ли пустая клетка или корабль
        let success = this.takesDamage(randomCroodinates.row, randomCroodinates.col, player);

        if (success) {//если попали
            this.playerBoard.crossSurroundings(randomCroodinates.row, randomCroodinates.col).forEach(cell => {
                this.playerBoard.battleField[cell.row][cell.col].typeOfCell = occupiedCell;
                });//убираем клетки накрест от места попадания из возможных ходов - там не может быть корабля
            this.playerBoard.battleField[randomCroodinates.row][randomCroodinates.col].value = damagedBlock;//изменяем клетку на подбитую
            this.playerBoard.battleField[randomCroodinates.row][randomCroodinates.col].typeOfCell = damagedCell;
            //проверяем, мертв ли корабль
            let dead = this.isDead(randomCroodinates.row, randomCroodinates.col, this.playerBoard);
            if (dead) {
                // если корабль мертв, блокируем клетки вокруг всего корабля
                let ship = this.checkShip(randomCroodinates.row, randomCroodinates.col, this.playerBoard);
                for (let cell of ship) {
                    this.playerBoard.battleField[cell.row][cell.col].value = deadShipBlock;//обновляем отображение
                    this.playerBoard.battleField[cell.row][cell.col].typeOfCell = deadCell;//обновляем содержание
                    this.playerBoard.surroundings(cell.row, cell.col).forEach(location => {
                        let surroundingCell = this.playerBoard.battleField[location.row][location.col];
                        if (surroundingCell.value !== damagedBlock &&
                            surroundingCell.value !== deadShipBlock && 
                            surroundingCell.value !== missShotBlock &&
                            surroundingCell.value !== occupiedBlock) {//обновляем окружение корабля (для каждой клетки если это не сам корабль), промахи оставляем без изменения
                            surroundingCell.value = occupiedBlock;
                            surroundingCell.typeOfCell = realOccupiedCell;
                        }
                    });
                }
            }
            this.computerBoard.possibleMoves = this.computerBoard.possibleMoves.filter(coordinates => 
                this.playerBoard.battleField[coordinates.row][coordinates.col].typeOfCell !== realOccupiedCell //исключаем клетки с типом realOccupiedCell
            );

            return true;
        } else {
            this.playerBoard.battleField[randomCroodinates.row][randomCroodinates.col].value = missShotBlock; // метим клетку как промах
            this.playerBoard.battleField[randomCroodinates.row][randomCroodinates.col].typeOfCell = occupiedCell;
        }
        return false;
    }
  
    takesDamage(row: number, col: number, isPlayer: boolean) : boolean {//проверка на удачный выстрел
        let board = isPlayer ? this.playerBoard : this.computerBoard;
        if (board.battleField[row][col].typeOfCell === shipCell) {//проверка на попадание по кораблю
            console.log(`${yellow}Попадание!!!${colEnd}`);
            board.battleField[row][col].value = damagedBlock;
            board.battleField[row][col].typeOfCell = damagedCell;
            let dead = this.isDead(row,col, this.computerBoard);
            if (dead) {//если корабль мертв
                let ship = this.checkShip(row,col, this.computerBoard);//собираем его почастям
                for (let cell of ship) {
                    board.battleField[cell.row][cell.col].value = deadShipBlock;//корабль погиб, обновляем его отображение
                    board.surroundings(cell.row, cell.col).forEach(location => {//убираем все клетки вокруг мертвого корабля
                        let surroundingCell = board.battleField[location.row][location.col];
                        if (surroundingCell.value !== damagedBlock &&
                            surroundingCell.value !== deadShipBlock && //оставляем черепушку
                            surroundingCell.value !== missShotBlock) {//если в клетку уже стреляли - оставляем value выстрела
                                surroundingCell.value = occupiedBlock;
                                surroundingCell.typeOfCell = occupiedCell;
                        }
                    });
                }
                console.log(`${red}УБИЛ!!!${colEnd}`)
            } else {
                console.log(`${red}РАНИЛ!!!${colEnd}`)
            }
            return true;
        } else {
            console.log(`${yellow}ПРОМАХ!!!${red}`);
            board.battleField[row][col].value = missShotBlock;
            board.battleField[row][col].typeOfCell = occupiedCell;
        }
        return false;
    }

    checkShip(row: number, col: number, battleField: BattleField, shipArr: Location[] = []): Location[] {
        let surroundingCells = battleField.orthogonalSurroundings(row, col);
        if (!shipArr.some(cell => cell.row === row && cell.col === col)) {//если этой клетки еще нет в корабле - добавляем
            shipArr.push({row, col});
        }

        for (let i = 0; i < surroundingCells.length; i++) {//проходим по клеткам окружения
            let r = surroundingCells[i].row;
            let c = surroundingCells[i].col;
            let cell = battleField.battleField[r][c]; 
    
            if (cell.typeOfCell === 'shipCell' || cell.typeOfCell === 'damagedCell') {//если в соседних клетках есть часть корабля - добавляем
                if (!shipArr.some(cell => cell.row === r && cell.col === c)) {//проверяем корабль на наличие там клетки чтобы не ходить туда-сюда и не создавать бесконечный цикл
                    shipArr.push({row: r, col: c});  //добавляем клетку в массив, если ее там еще нет
                    this.checkShip(r, c, battleField, shipArr);//рекурсивно проверяем соседние клетки
                }
            }
        }       
        return shipArr;//возвращаем корабль(координаты)
    }

    isDead(row: number, col: number, battleField: BattleField): boolean {
        let shipArr = this.checkShip(row, col, battleField);//собираем корабль, клетка которого ранена

        let allDamaged = shipArr.every(cell => //проверяем все клетки
            battleField.battleField[cell.row][cell.col].typeOfCell === damagedCell
        );
        return allDamaged;//корабль жи если есть хотя бы одна живая клетка
    }

    checkAlive(battleField: BattleField) : number {
        let aliveShips = 0;
        for (let row of battleField.battleField) {//проверяем строку
            for (let cell of row) {//провереяем элементы в строке на наличие живого корабля
                if (cell.typeOfCell === shipCell) {//считаем количество живых клеток
                    aliveShips++;
                }
            }
        }
        return aliveShips;//если нет, то все мертвы
    }

    isWinner() {
        const playerShips = this.checkAlive(this.playerBoard);
        const computerShips = this.checkAlive(this.computerBoard);
        //проверяем есть ли живые        
        if (playerShips === 0) {
            rl.close();
            console.log(`В этот раз победу одержал ${pirate}, ничего страшного, тебе повезет в следующий раз. Или не повезет.`);

            return "computerWin";//мы проиграли
        }
        
        if (computerShips === 0) {
            rl.close();
            console.log(`Поздравляю, ты бился как настоящий морской волк и одержал победу, ${pirate} униженно ретируется.`);
            return "playerWin";//мы победили
        }
        return "";//продолжаем игру если нет победителя
    }
    cheat() {
        for (let row = 0; row < this.computerBoard.battleField.length; row++) {
            for (let col = 0; col < this.computerBoard.battleField[row].length; col++) {
                if (this.computerBoard.battleField[row][col].typeOfCell === shipCell) {
                    this.computerBoard.battleField[row][col].value = shipBlock;
                }
            }
        }
        console.log(`${red}НУ ТЫ ЧИТАК, ПО-ЧЕСТНОМУ НЕ МОЖЕШЬ?${colEnd}`);
        console.log(this.computerBoard.displayBattleField(this.computerBoard));
    }
}

export const battle = new Battle(playerBattleField, computerBattleField);