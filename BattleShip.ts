import * as readline from 'readline/promises';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const mapSize: number = 10;
const playerBlock: string = "⬛";
const shipBlock: string = "🚢";
const fogOfWarBlock: string = "✼ ";
const occupiedBlock:string = " +";
const damagedBlock: string = "💥";
const deadShipBlock: string = "💀";
const missShotBlock: string = "❌";
const shipSizes = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
const numberOfShips = shipSizes.length;
const horizontal: string = "horizontal";
const vertical: string = "vertical";
const player: boolean = true;
const computer: boolean = false;
const technicalCell: string = "technicalCell";
const emptyCell: string = "emptyCell";
const shipCell: string = "shipCell";
const occupiedCell: string = "occupiedCell";
const damagedCell: string = "damagedCell";
const deadCell: string = "deadCell";
const fieldRange: [number, number] = [1, 10];
const chooseRange: [number, number] = [1, 2];
const space30 = " ".repeat(30); //расстояние между полями
const space68 = " ".repeat(68); //расстояние между полями
const yellow: string = "\u001b[33m";
const green: string = "\u001b[32m";
const red: string = "\u001b[31m";
const colEnd: string = "\u001b[0m";
const pirate: string = `${red}Капитан SKOLZKIY_STAS${colEnd}`
const coins: string[] = [`${yellow}⛀${colEnd}`, `${yellow}⛁${colEnd}`, `${yellow}⛃${colEnd}`, `${yellow}⛂${colEnd}`];
const gameStart: string[] = ["Игра начнется через 3...", "Игра начнется через 2...", "Игра начнется через 1...", `${yellow}ПОЕХАЛИ!${colEnd}\n`];
const typingMessage: string[] = [`${pirate} набирает сообщение . `, `${pirate} набирает сообщение . . `, `${pirate} набирает сообщение . . . `];
const pause = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

async function blinkingMessage(message: string[], numberOfTimes: number, delay: number): Promise<void> {//честно нашел в инете эту функцию и немного переделал :D
  for (let i = 0; i < numberOfTimes; i++) {
    await pause(delay);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(message[i % message.length] + " ");//зацикливаем
  }
}

async function userInputNum(//ввод чисел
        range: [number, number],
        inputMessage: string,
        failureMessage: string,
        confirmMessage: string
        ) : Promise<number> {
    while (true) {//бесконечный цикл пока не вернем правильный ответ
        let inputNumber = Number(await rl.question(`${inputMessage}\n`));//преобразуем введенную строку в число
        if (
            !Number.isInteger(inputNumber) ||
            inputNumber < range[0] ||
            inputNumber > range[1]
            ) {//проверка на правильность введенных данных
            console.log(`${failureMessage}`);
        } else {
            console.log(confirmMessage);
            return inputNumber;
        }
    }
}

async function userInputStr(
    firstMessage: string,
    warnMessage: string,
    confirmMessage: string,
    lengthOfStr: number
    ): Promise<string> {//ввод текста
    while (true) {//бесконечный цикл пока не вернем правильный ответ
        let inputString = await rl.question(`${firstMessage}\n`);
        if (inputString.trim() == "" || inputString.length > lengthOfStr) {//проверка на правильность введенных данных (обрезаем пробелы и проверяем с пустой строкой + проверяем длину строки)
            console.log(`${warnMessage} ${lengthOfStr} символов.`);
        } else {
            console.log(confirmMessage);
            return inputString;
        }
    }
}

interface Cell {
    value: string;
    typeOfCell: string;
}

interface Location {
    row: number;
    col: number;
}

class BattleField {
    sizeOfMap: number;
    battleField: Cell[][];
    possibleMoves: Location[];

    constructor(sizeOfMap: number, isPlayer: boolean) {
        this.sizeOfMap = sizeOfMap;
        this.battleField = this.generateBattleField(isPlayer);
        this.possibleMoves = this.generatePossibleMoves();
    }

    generateBattleField(isPlayer: boolean): Cell[][] { //создаем поле боя
        const map = []; // создаем массив, куда будем пушить нашу карту
        for (let numberOfRow = 0; numberOfRow < this.sizeOfMap + 1; numberOfRow++) {//+ 1 потому что поле 11х11 (один ряд и столбец под нумерацию)
            const row = [];
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
}

class ShipManagement {
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
        let inputOrientation = orientation;
        let randomCell = {row, col};
        let possibleCells = this.checkSpaceForTheShip(battleField.battleField, size, orientation);
        //сравниваем значения, потому что объект передается по ссылке и одинаковые значения в объектах еще не значат, что они равны
        let check = possibleCells.find(rowCol => rowCol.row === row && rowCol.col === col);
        if (check === undefined) {//если мы не нашли ни одной ячейки - вернет false, !false 
            return false;

        } else {
            this.addShip(battleField.battleField, randomCell.row, randomCell.col, size, inputOrientation, player);
            console.log(`Корабль размещен на поле, теперь твоя карта выглядит вот так:\n`);
            console.log(battleField.displayBattleField(battleField));
            return true;
        }
    }
}

class Battle {
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

        //логика стрельбы компьютера (добивание поврежденных кораблей)
        for (let row = 1; row < this.playerBoard.battleField.length; row++) {
            for (let col = 1; col < this.playerBoard.battleField.length; col++) {
                if (this.playerBoard.battleField[row][col].typeOfCell === damagedCell) {//если на поле есть поврежденные клетки, то пытаемся стрельнуть накрест по вертикали и горизонтали от них
                    this.playerBoard.orthogonalSurroundings(row, col).forEach(cell => {
                        if (this.playerBoard.battleField[cell.row][cell.col].value !== missShotBlock &&//проверяем на повторный выстрел в ту же клетку, либо
                            this.playerBoard.battleField[cell.row][cell.col].value !== damagedBlock//уже поврежденный корабль, в случае нескольких палуб
                        ) {possibleMoves.push(cell)};
                    });
                }
            }
        } 
        
        if (possibleMoves.length === 0) {
            possibleMoves = this.computerBoard.possibleMoves;//выбираем возможные ходы для компьютера в случае, если нет поврежденных клеток
        }
        
        let randomNum = Math.floor(Math.random() * possibleMoves.length);// floor выводит правильное распределение для первого значения
        let randomRowCol = possibleMoves[randomNum];
        
        //убираем координаты выстрела из возможных ходов в дальнейшем
        this.computerBoard.possibleMoves = this.computerBoard.possibleMoves.filter(coordinates => !(coordinates.row === randomRowCol.row && coordinates.col === randomRowCol.col));
        //проверяем надамажилась ли пустая клетка или корабль
        let success = this.takesDamage(randomRowCol.row, randomRowCol.col, player);

        if (success) {//если попали
            this.playerBoard.crossSurroundings(randomRowCol.row, randomRowCol.col).forEach(cell => {
                this.playerBoard.battleField[cell.row][cell.col].typeOfCell = occupiedCell;
                });//убираем клетки накрест от места попадания из возможных ходов - там не может быть корабля
            this.playerBoard.battleField[randomRowCol.row][randomRowCol.col].value = damagedBlock;//изменяем клетку на подбитую
            this.playerBoard.battleField[randomRowCol.row][randomRowCol.col].typeOfCell = damagedCell;
            //проверяем, мертв ли корабль
            let dead = this.isDead(randomRowCol.row, randomRowCol.col, this.playerBoard);
            if (dead) {
                // если корабль мертв, блокируем клетки вокруг всего корабля
                let ship = this.checkShip(randomRowCol.row, randomRowCol.col, this.playerBoard);
                for (let cell of ship) {
                    this.playerBoard.battleField[cell.row][cell.col].value = deadShipBlock;//обновляем отображение
                    this.playerBoard.battleField[cell.row][cell.col].typeOfCell = deadCell;//обновляем содержание
                    this.playerBoard.surroundings(cell.row, cell.col).forEach(location => {
                        let surroundingCell = this.playerBoard.battleField[location.row][location.col];
                        if (surroundingCell.value !== damagedBlock &&
                            surroundingCell.value !== deadShipBlock && 
                            surroundingCell.value !== missShotBlock) {//обновляем окружение корабля (для каждой клетки если это не сам корабль), промахи оставляем без изменения
                            surroundingCell.value = occupiedBlock;
                            surroundingCell.typeOfCell = occupiedCell;
                        }
                    });
                }
            }
            return true;
        } else {
            this.playerBoard.battleField[randomRowCol.row][randomRowCol.col].value = missShotBlock; // метим клетку как промах
            this.playerBoard.battleField[randomRowCol.row][randomRowCol.col].typeOfCell = occupiedCell;
        }
        return false;
    }
  
    takesDamage(row: number, col: number, isPlayer: boolean) : boolean {//проверка на удачный выстрел
        let board = isPlayer ? this.playerBoard : this.computerBoard;
        if (board.battleField[row][col].typeOfCell === shipCell) {//проверка на попадание по кораблю
            console.log("Попал по кораблю.");
            board.battleField[row][col].value = damagedBlock;
            board.battleField[row][col].typeOfCell = damagedCell;
            let dead = this.isDead(row,col, this.computerBoard);
            if (dead) {//если корабль мертв
                console.log("УБИЛ!!!")
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
            } else {
                console.log("РАНИЛ!!!")
            }
            return true;
        } else {
            console.log("ПРОМАХ!!!");//todo
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
        for (let cell of shipArr) {//проверяем все клетки
            if (battleField.battleField[cell.row][cell.col].typeOfCell !== damagedCell) {
                return false; //корабль жи если есть хотя бы одна живая клетка
            }
        }
        return true; //если все надамажены - мертв
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
            console.log(`В этот раз победу одержал ${pirate}, ничего страшного, тебе повезет в следующий раз. Или не повезет.`);
            rl.close;
            return "computerWin";//мы проиграли
        }
        
        if (computerShips === 0) {
            console.log(`Поздравляю, ты бился как настоящий морской волк и одержал победу, ${pirate} униженно ретируется.`);
            rl.close;
            return "playerWin";//мы победили
        }
        return "";//продолжаем игру если нет победителя
    }
}

const playerBattleField = new BattleField(mapSize, player);//создаем два экземпляра класса BattleField, один для игрока, второй для компьютера
const computerBattleField = new BattleField(mapSize, computer);
playerBattleField.generatePossibleMoves();
computerBattleField.generatePossibleMoves();

const playerShipManager = new ShipManagement(playerBattleField);//создаем два экземпляра класса ShipManagement для управления полем ирока и полем компьютера
const computerShipManager = new ShipManagement(computerBattleField);

computerShipManager.randomShipPlacement(computerBattleField, computer);//комп всегда рандомное расположение кораблей

const battle = new Battle(playerBattleField, computerBattleField);

async function sayNickname() {
    console.log(`Добро пожаловать в игру ${yellow}морской бой${colEnd}!`);
    await pause(1000);
    let nick = await userInputStr(`Для начала введи свой ник:`, "В строке должна быть хотя бы одна буква и она не должна быть длиннее", `Мы определились с тем, как тебя называть, продолжаем.`, 25);
    await pause(1000);
    console.log(`Разместим корабли на твоем поле, но будь осторожен, оппонент ${pirate} - матерый пират, приготовься к бою.`);
    return nick;    
}

async function placeShips(nick: string) {//размещаем корабли
    let shipPlacementAnswer = await userInputNum(
        chooseRange,
        `Выбери один из вариантов:
        Я могу расставить корабли в случайном порядке за тебя - [1],
        или ты можешь сделать это сам, вводя координаты - [2],
        выбирай, ${yellow}[1]${colEnd} или ${yellow}[2]${colEnd}?`,
         "К сожалению, можно выбрать только из двух вариантов, [1] - я заполняю за тебя, [2] - ты заполняешь сам",
         `Хороший выбор.`);

         //автоматическое размещение
    if (shipPlacementAnswer === 1) {
        playerShipManager.randomShipPlacement(playerBattleField, player);
        console.log(playerBattleField.displayBattleField(playerBattleField));
        //размещение вручную
    } else {
        let placedShips = 0
        console.log("На твоем поле пока что нет ни одного корабля.");
        console.log(playerBattleField.displayBattleField(playerBattleField));
        while (placedShips < numberOfShips) {
            let size = shipSizes[placedShips]
            console.log(`Сейчас мы будем размещать ${size}-палубный корабль, всего осталось ${10 - placedShips} кораблей.`)
            let col = await userInputNum([1, 10], `Введи координату ${yellow}столбца${colEnd}, куда ты хочешь поместить корабль:`,
                "К сожалению, ты ввел координату, которую я не могу использовать, введи число от 1 до 10",
                "Ты сделал свой выбор.");
            let row = await userInputNum([1, 10], `Введи координату ${yellow}строки${colEnd}, куда ты хочешь поместить корабль:`,
                "К сожалению, ты ввел координату, которую я не могу использовать, введи число от 1 до 10",
                "Ты сделал свой выбор.");
            let orientation = horizontal;
            if (size !== 1) {//спрашиваем ориентацию у всех кроме однопалубных
                let orientationInput = await userInputNum(chooseRange, `Теперь определись как будет располагаться твой корабль,
                    горизонтально - [1],
                    вертикально - [2],
                    ${yellow}[1]${colEnd} или ${yellow}[2]${colEnd}?`,
                    "К сожалению, можно выбрать только из двух вариантов, [1] - горизонтально, [2] - вертикально.",
                    "Продолжаем.");
                orientation = orientationInput === 1 ? horizontal : vertical;
            }
            let placed = playerShipManager.inputShipPlacement(playerBattleField, row, col, size, orientation);
            if (placed) {
                placedShips++;//увеличиваем счетчик если корабль размещен успешно
            } else {
                console.log(playerBattleField.displayBattleField(playerBattleField));
                console.log(`К сожалению, ${size}-палубный корабль не удалось разместить в заданных тобой координатах.
                    Убедись, что он помещается на поле и не пересекается с другими кораблями.`);//в случае неудачного размещения
            };
        }
    }
    console.log(`Поздравляю, ${green}${nick}${colEnd}, твое поле боя готово, мы можем прололжать!`);
}

async function firstMove(nick: string) {//выбираем кто ходит первый
    console.log(`Сейчас я брошу монетку и мы определимся кто ходит первым`)
    await blinkingMessage(coins, 24, 100);
    await pause(1000);
    let random = Math.random() > 0.5 ? true : false;
    if (random) {
        console.log(`\nВ этот раз ${green}${nick}${colEnd} повезло, право первого хода за тобой.
            Желаю удачи, ${red}бой начинается!!!${colEnd}`);
    } else {
        console.log(`\nВ этот раз удача повернулась лицом к ${pirate}, ${red}бой начинается!!!${colEnd}`)
    }
    return random;
}

async function playerShot(nick: string) : Promise<boolean> {
    console.log(`Ход ${green}${nick}${colEnd}:`);
    let success = await battle.playerFire();
    console.log(playerBattleField.displayBothBattleFields(nick, playerBattleField, computerBattleField));
    //если попали - ходим еще раз
    return success;        

}

function computerShot(nick: string) {
    console.log(`Ход ${pirate}:`);
    let success = battle.computerFire(); 
    console.log(playerBattleField.displayBothBattleFields(nick, playerBattleField, computerBattleField));
    return success;
}

async function fiveAlive() {
    await blinkingMessage(typingMessage, 8, 800);
    console.log(`\nУ ТЕБЯ ВСЕ НОРМАЛЬНО???? МОЖЕТ ХВАТИТ ПО МНЕ СТРЕЛЯТЬ??!?`);
}

async function oneAlive() {
    await blinkingMessage(typingMessage, 8, 800);
    console.log(`\nОЙ ВСЕ, Я СЕЛ НА ПОСЛЕДНИЙ КОРАБЛЬ И УПЛЫЛ, МОЖЕШЬ НЕ ИСКАТЬ`);
}

async function startGame() {
    let winner = "";
    let nick = await sayNickname();
    await placeShips(nick);
    await pause(1000);
    let first = await firstMove(nick);    
    await blinkingMessage(gameStart, 4, 1000);
    
    while (!winner) {//пока не определится победитель игра продолжается(пустая строка не будет считаться)
        if (first) {//если мы ходим первые
            let anotherShot = true; //стреляем пока не промажем
            while (anotherShot) {
                let aliveShips = battle.checkAlive(computerBattleField);
                anotherShot = await playerShot(nick);//true, если попадание
                winner = battle.isWinner();
                if (aliveShips === 5) {
                    fiveAlive();
                }
            if (aliveShips === 1) {
                    oneAlive();
                }
                if (winner) return;//проверка на победу
            }

            await pause(1000);

            let anotherShotComp = true;
            while (anotherShotComp) {
                anotherShotComp = computerShot(nick);//true, если попадание
                winner = battle.isWinner();
                if (winner) return; // Проверка на победу
            }

            await pause(1000);

        } else {//если компьютер ходит первый
            let anotherShotComp = true;
            while (anotherShotComp) {
                anotherShotComp = computerShot(nick);//true, если попадание
                winner = battle.isWinner();
                if (winner) return;//пповерка на победу
            }

            await pause(1000);

            let anotherShot = true;//стреляем пока не промажем
            while (anotherShot) {
                let aliveShips = battle.checkAlive(computerBattleField);
                anotherShot = await playerShot(nick);//true, если попадание
                winner = battle.isWinner();
                if (aliveShips === 5) {
                    fiveAlive();
                }
            if (aliveShips === 1) {
                    oneAlive();
                }
                if (winner) return;//пповерка на победу
            }

        await pause(1000);
        }
    }
}

startGame();