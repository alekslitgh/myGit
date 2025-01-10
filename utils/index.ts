import { battle } from '../class/Battle';
import { playerBattleField, computerBattleField } from '../class/battlefield';
import * as readline from 'readline/promises';
import { playerShipManager } from '../class/ShipManagement'
import {
    chooseRange,
    coins,
    colEnd,
    emptyCell,
    green,
    horizontal,
    mapSize,
    numberOfShips,
    occupiedCell,
    pirate,
    player,
    playerBlock,
    red,
    shipSizes,
    typingMessage,
    vertical,
    yellow
} from "../const";

export const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export const pause = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

export async function blinkingMessage(message: string[], numberOfTimes: number, delay: number): Promise<void> {//честно нашел в инете эту функцию и немного переделал :D
    for (let i = 0; i < numberOfTimes; i++) {
      await pause(delay);
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(message[i % message.length] + " ");//зацикливаем
    }
  }

export async function userInputNum(//ввод чисел
        range: [number, number],
        inputMessage: string,
        failureMessage: string,
        confirmMessage: string
        ) : Promise<number> {
    while (true) {//бесконечный цикл пока не вернем правильный ответ
        let inputM = await rl.question(`${inputMessage}\n`);
        if (inputM === "iseeships") battle.cheat()
        let inputNumber = Number(inputM);
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


export async function userInputStr(
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

export async function sayNickname() {
    console.log(`Добро пожаловать в игру ${yellow}морской бой${colEnd}!`);
    await pause(1000);
    let nick = await userInputStr(`Для начала введи свой ник:`, "В строке должна быть хотя бы одна буква и она не должна быть длиннее", `Мы определились с тем, как тебя называть, продолжаем.`, 25);
    await pause(1000);
    console.log(`Разместим корабли на твоем поле, но будь осторожен, оппонент ${pirate} - матерый пират, приготовься к бою.`);
    return nick;    
}

export async function placeShips(nick: string) {//размещаем корабли
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

export function changeBoard() {//размещаем корабли
    let battleField = playerBattleField.battleField;
    for (let row = 1; row <= mapSize; row++) {
        for (let col = 1; col <= mapSize; col++) {
            if (battleField[row][col].typeOfCell === occupiedCell) {
                battleField[row][col].typeOfCell = emptyCell;
                battleField[row][col].value = playerBlock;
            }
        }
    }
}

export async function firstMove(nick: string) {//выбираем кто ходит первый
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

export async function playerShot(nick: string) : Promise<boolean> {
    console.log(`Ход ${green}${nick}${colEnd}:`);
    let success = await battle.playerFire();
    console.log(playerBattleField.displayBothBattleFields(nick, playerBattleField, computerBattleField));
    //если попали - ходим еще раз
    return success;        

}

export function computerShot(nick: string) {
    console.log(`Ход ${pirate}:`);
    let success = battle.computerFire(); 
    console.log(playerBattleField.displayBothBattleFields(nick, playerBattleField, computerBattleField));
    return success;
}

export async function fiveAlive() {
    await blinkingMessage(typingMessage, 8, 800);
    console.log(`\nУ ТЕБЯ ВСЕ НОРМАЛЬНО???? МХ ОФФ ЗАЕБАЛ!!!!!!`);
}

export async function oneAlive() {
    await blinkingMessage(typingMessage, 8, 800);
    console.log(`\nZAEBAL VIRUBAI CHITI NORMALNO IGRAT MOJESH??????`);
}
