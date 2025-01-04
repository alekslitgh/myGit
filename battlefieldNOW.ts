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
            console.log(confirmMessage)
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
            console.log(confirmMessage)
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
        let resultMap: string = " ".repeat(12) + yellow + nick + colEnd + "\n"; //первая строка - выводим ник игрока
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
                //battleField[row][col + i].value = isPlayer ? shipBlock : battleField[row][col + i].value;//на нашем поле появляется кораблик, на поле компьютера остается туман войны
                battleField[row][col + i].value = isPlayer ? shipBlock : shipBlock;//todo delete
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
                //battleField[row + i][col].value = isPlayer ? shipBlock : battleField[row + i][col].value;//todo
                battleField[row + i][col].value = isPlayer ? shipBlock : shipBlock;
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

    async playerFire() {
        let possibleMoves = this.playerBoard.possibleMoves;//выбираем возможные ходы для игрока
        let col = await userInputNum(fieldRange, "КУДА СТРЕЛЯЕМ СТОЛБЕЦ?", "Вы ввели не то, введите правильное число в диапазоне от", "");
        let row = await userInputNum(fieldRange, "КУДА СТРеляЕМ СТРОКА?", "Вы ввели не то, введите правильное число в диапазоне от", "Пытаюсь выстрелить:");
        if (!possibleMoves.find(coordinates => coordinates.row === row && coordinates.col === col)) {
            console.log("Эти координаты не подходят для выстрела, выбери пустое поле в пределах доски.")
            await this.playerFire(); //если выбрали неподходящие координаты - ход не переходит к оппоненту, а мы должны попытаться стрельнуть снова
        } else {
            this.takesDamage(row, col, computer);
            this.playerBoard.possibleMoves = possibleMoves.filter(coordinates => !(coordinates.row === row && coordinates.col === col));
        }
    }

    computerFire() {
        let possibleMoves = this.computerBoard.possibleMoves;//выбираем возможные ходы для компьютера
        let randomNum = Math.floor(Math.random() * possibleMoves.length);// floor выводит правильное распределение для первого значения
        let randomRowCol = possibleMoves[randomNum];
        //убираем координаты выстрела из возможных ходов в дальнейшем
        this.computerBoard.possibleMoves = this.computerBoard.possibleMoves.filter(coordinates => !(coordinates.row === randomRowCol.row && coordinates.col === randomRowCol.col));
        //проверяем надамажилась ли пустая клетка или корабль
        let success = this.takesDamage(randomRowCol.row, randomRowCol.col, player);

        if (success) {//если попали
            this.computerBoard.crossSurroundings(randomRowCol.row, randomRowCol.col).forEach(cell => {
                this.computerBoard.battleField[cell.row][cell.col].typeOfCell = occupiedCell;
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
                    this.playerBoard.surroundings(cell.row, cell.col).forEach(location => {
                        let surroundingCell = this.playerBoard.battleField[location.row][location.col];
                        if (surroundingCell.value !== damagedBlock &&
                            surroundingCell.value !== deadShipBlock && 
                            surroundingCell.value !== missShotBlock) {
                            surroundingCell.value = occupiedBlock;
                            surroundingCell.typeOfCell = occupiedCell;
                        }
                    });
                }
            }
        } else {
            this.playerBoard.battleField[randomRowCol.row][randomRowCol.col].value = missShotBlock; // метим клетку как промах
            this.playerBoard.battleField[randomRowCol.row][randomRowCol.col].typeOfCell = occupiedCell;
        }
    }

  
    takesDamage(row: number, col: number, isPlayer: boolean) : boolean {//проверка на удачный выстрел
        let board = isPlayer ? this.playerBoard : this.computerBoard;
        if (board.battleField[row][col].typeOfCell === shipCell) {//проверка на попадание по кораблю
            console.log("ПОПАЛ ПО КОРАБЛЮ)) RANIL");
            board.battleField[row][col].value = damagedBlock;
            board.battleField[row][col].typeOfCell = damagedCell;
            let dead = this.isDead(row,col, this.computerBoard);
            if (dead) {//если корабль мертв
                console.log("YBIL KORABL")
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
                console.log("RANIL")
            }
            return true;
        } else {
            console.log("MAZILA )))))00");//todo
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

    checkShipsAlive(battleField: BattleField) {
        for (let row of battleField.battleField) {
            for (let cell of row) {
                if (cell.typeOfCell === "ship") { // если есть клетка с кораблем
                    return true;
                }
            }
        }
        return false; // Если нет клеток с кораблями, значит все уничтожены
    }

    isWinner() {
        // Проверяем, есть ли живые корабли у игрока и компьютера
        const playerShipsAlive = this.checkShipsAlive(this.playerBoard);
        const computerShipsAlive = this.checkShipsAlive(this.computerBoard);
        
        if (!playerShipsAlive) {
            console.log("Победил компьютер!");
            return computer;  // Компьютер победил
        }
        
        if (!computerShipsAlive) {
            console.log("Победил игрок!");
            return player;  // Игрок победил
        }
        
        return null;  // Нет победителя, продолжаем игру
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
    await pause(1);
    let nick = await userInputStr(`Для начала введи свой ник:`, "В строке должна быть хотя бы одна буква и она не должна быть длиннее", `Мы определились с тем, как тебя называть, продолжаем.`, 25);
    await pause(1);
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
        console.log(playerBattleField.displayBattleField(playerBattleField)); // Поле игрока
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
                    выбирай, [1] или [2]?`,
                    "К сожалению, можно выбрать только из двух вариантов, [1] - горизонтально, [2] - вертикально.",
                    "Продолжаем.");
                orientation = orientationInput === 1 ? horizontal : vertical;
            }
            let placed = playerShipManager.inputShipPlacement(playerBattleField, row, col, size, orientation);
            if (placed) {
                placedShips++;  //увеличиваем счетчик если корабль размещен успешно
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
    await pause(600);
    let random = Math.random() > 0.5 ? true : false;
    if (random) {
        console.log(`\nВ этот раз ${nick} повезло, право первого хода за тобой.
            Желаю удачи, ${red}бой начинается!!!${colEnd}`);
    } else {
        console.log(`\nВ этот раз удача повернулась лицом к ${pirate}, ${red}бой начинается!!!${colEnd}`)
    }
    return random;
}

async function crossfire(nick: string, isPlayer: boolean) {

    
}


async function startGame() {
    let nick = await sayNickname();
    await placeShips(nick);
    await pause(1);
    let first = await firstMove(nick);    
    await blinkingMessage(gameStart, 4, 1);
    
    await battle.playerFire();
    await pause(1000);
    console.log(playerBattleField.displayBothBattleFields(nick, playerBattleField, computerBattleField));
    await pause(1000);
    battle.computerFire();



    


    

    console.log(playerBattleField.displayBothBattleFields(nick, playerBattleField, computerBattleField));
}

startGame()



