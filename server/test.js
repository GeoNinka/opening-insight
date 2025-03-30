import { stockfish } from 'stockfish';

async function evaluateMultiplePositionSets(positionSets) {
    return new Promise((resolve, reject) => {
        const stockfish = stockfish();

        const evaluations = positionSets.map(() => []); // Инициализируем массивы для оценок
        let totalPositions = 0;
        let processedCount = 0;

        // Обработчик для получения сообщений от Stockfish
        stockfish.onmessage = function (message) {
            if (message.startsWith('info')) {
                const parts = message.split(' ');
                const scoreIndex = parts.indexOf('score');
                if (scoreIndex !== -1) {
                    const score = parts[scoreIndex + 2]; // Получаем оценку
                    const currentSetIndex = Math.floor(processedCount / positionSets[0].length);
                    evaluations[currentSetIndex].push(score);
                }
            }

            // Проверяем, обработаны ли все позиции
            processedCount++;
            if (processedCount === totalPositions) {
                resolve(evaluations);
                stockfish.postMessage('quit'); // Завершаем работу Stockfish
            }
        };

        // Запускаем Stockfish
        stockfish.postMessage('uci');

        // Оценка каждой позиции
        positionSets.forEach((positions) => {
            totalPositions += positions.length; // Увеличиваем общее количество позиций

            positions.forEach((position) => {
                stockfish.postMessage(`position fen ${position}`);
                stockfish.postMessage('go depth 10'); // Уровень глубины анализа
            });
        });
    });
}

// Пример использования
const positionSets = [
    [
        'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',
    ],
    [
        'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',
        'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    ],
    // Добавьте другие наборы позиций FEN по вашему желанию
];

evaluateMultiplePositionSets(positionSets)
    .then((evaluations) => {
        console.log('Оценки позиций:', evaluations);
    })
    .catch((error) => {
        console.error('Ошибка:', error);
    });

