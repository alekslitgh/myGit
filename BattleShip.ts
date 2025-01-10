import { battle } from './class/Battle';
import { computerBattleField } from './class/battlefield';
import { gameStart } from './const';
import { sayNickname, placeShips } from './utils';
import {
    blinkingMessage,
    changeBoard,
    computerShot,
    firstMove,
    fiveAlive,
    oneAlive,
    pause,
    playerShot
} from './utils';

async function startGame() {
    let winner = "";
    let nick = await sayNickname();
    await placeShips(nick);
    changeBoard();
    await pause(1000);
    let first = await firstMove(nick);    
    await blinkingMessage(gameStart, 4, 1000);

    let fiveAliveMessage = false, oneAliveMessage = false;//задаем false чтобы ф-я вызывалась только один раз

    if (first) {//если мы ходим первые
        let anotherShot = true; //стреляем пока не промажем
        while (anotherShot) {
            let aliveShips = battle.checkAlive(computerBattleField);
            anotherShot = await playerShot(nick);//true, если попадание
            winner = battle.isWinner();
            if (aliveShips === 5 && !fiveAliveMessage) {
                await fiveAlive();
                fiveAliveMessage = true;//удаляем повторный вызов
            }
        if (aliveShips === 1 && !oneAliveMessage) {
                await oneAlive();
                oneAliveMessage = true;
            }
            if (winner) return//проверка на победу
        }
    } 

    while (!winner) {//пока не определится победитель игра продолжается(пустая строка не будет считаться)
        let anotherShotComp = true;
        while (anotherShotComp) {
            await pause(1000);
            anotherShotComp = computerShot(nick);//true, если попадание
            winner = battle.isWinner();
            if (winner) return; //проверка на победу
        }

        let anotherShot = true;//стреляем пока не промажем
        while (anotherShot) {
            await pause(100);
            let aliveShips = battle.checkAlive(computerBattleField);
            anotherShot = await playerShot(nick);//true, если попадание
            winner = battle.isWinner();

            if (aliveShips === 5 && !fiveAliveMessage) {
                await fiveAlive();
                fiveAliveMessage = true;
            }
        if (aliveShips === 2 && !oneAliveMessage) {
                await oneAlive();
                oneAliveMessage = true;
            }
            if (winner) return;//пповерка на победу
            }
    }
}

startGame();