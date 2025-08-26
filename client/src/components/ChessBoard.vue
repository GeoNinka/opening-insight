<template>
    <div class="board-wrapper">
        <div id="board" class="board"></div>
        <p class="board__fen">FEN: {{ positionFEN }}</p>
        <div class="board__buttons">
            <div class="board__buttons-pair">
                <div class="board__buttons-wrapper">
                    <img class="board__icon board__icon--reverse" src="../../public/icons/next.svg" alt="">
                    <button class="board__button" @click="undoMove">Отменить ход</button>
                </div>
                <div class="board__buttons-wrapper">
                    <button class="board__button" @click="redoMove" :disabled="redoStack.length === 0">Вернуть ход</button>
                    <img class="board__icon" :class="{ 'board__icon--disabled': redoStack.length === 0 }" src="../../public/icons/next.svg" alt="">
                </div>
            </div>
            <div class="board__buttons-wrapper board__buttons-wrapper--last">
                <button class="board__button" @click="resetGame">Начальная позиция</button>
                <img class="board__icon"  src="../../icons/refresh-button.svg" alt="">
            </div>
        </div>
    </div>  
</template>

<script setup>
    import { onMounted } from 'vue';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
    import { Chess } from 'chess.js';

    let board = null
    const game = new Chess()

    // Два стэка со сделанными и отменёнными ходами, можно переделать в двусвязный список 
    let undoStack = []
    let redoStack = []

    const positionFEN = defineModel('fen')
    // const selectedTurn = defineModel('turn')

    const props = defineProps({
        isUsingChessRules: {
            type: Boolean,
            required: true
        }
    })

    onMounted(() => {
        // Инициализация доски
        board = Chessboard2('board', {
            position: positionFEN.value,
            draggable: true,
            // Если ходы подчиняются шахматным правилам добавляем обработку ходов
            onDragStart: props.isUsingChessRules ? onDragStart : () => {},
            onDrop: props.isUsingChessRules ? onDrop : () => {},
            showNotation: true,
        })
        // Обработка нажатия на стрелочки
        window.addEventListener('keydown', handleKeydown)
    })

    // Обработка нажатия на фигуру
    const onDragStart = (dragStartEvt) => {
        if (game.isGameOver()) return false

        if (game.turn() === 'w' && !isWhitePiece(dragStartEvt.piece)) return false
        if (game.turn() === 'b' && !isBlackPiece(dragStartEvt.piece)) return false

        const legalMoves = game.moves({
            square: dragStartEvt.square,
            verbose: true
        })

        legalMoves.forEach((move) => {
            board.addCircle(move.to)
        })
    }

    // Обработка хода
    const onDrop = (dropEvt) => {
        try {
            const move = game.move({
                from: dropEvt.source,
                to: dropEvt.target,
                promotion: 'q'
            })

            if (move) {
                undoStack.push(move)
                redoStack.length = 0
            }

            board.clearCircles()
            board.fen(game.fen(), () => {
                positionFEN.value = game.fen().split(' -')[0] // Обрезаем часть строки в которой хранится количество ходов без взятий и продвижения пешек
            })
        } catch (e) {
            console.log(e)
            board.clearCircles()
            // snapbak откатывает доску к изначальному состоянию
            return 'snapback' 
        }
    }

    const undoMove = () => {
        const undone = game.undo()
        if (undone) {
            redoStack.push(undone)
            board.fen(game.fen())
            positionFEN.value = game.fen().split(' -')[0]
        }
    }

    const redoMove = () => {
        const redo = redoStack.pop()
        if (redo) {
            const moveObj = {
                from: redo.from,
                to: redo.to,
                promotion: redo.promotion
            }
            const moved = game.move(moveObj)
            if (moved) {
            undoStack.push(moved)
            board.fen(game.fen())
            positionFEN.value = game.fen().split(' -')[0]
            }
        }
    }

    // Определение очерёдности хода при совершении ходов не учитываются шахматные правила
    const changeTurnSide = () => {
        if (!isUsingChessRules) {
            if (selectedTurn.value == 'w') {
                selectedTurn.value = 'b'
            } else {
                selectedTurn.value = 'w'
            }
        }
    }

    const handleKeydown = (event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault()
            undoMove()
        } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            redoMove()
        }
    }

    // Функция установки позиции из родительского компонента
    const setPosition = (fen, side = 'white') => {
        game.load(fen)
        board.fen(fen)
        board.orientation(side)
    }

    // Функция совершения хода из родительского компонента
    const makeMove = (item) => {
        const move = game.move(item.move)
        if (move) {
            undoStack.push(move)
            redoStack.length = 0 
        }
        board.fen(game.fen(), () => {
            positionFEN.value = game.fen().split(' -')[0]
            // PGN на данный момент не используется
            // positionPGN.value = game.pgn().replace(/\[.*?\]\s*/g, '').replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '')
        })
    }

    // Определение цвета выбранной фигуры
    const isWhitePiece = (piece) => { return /^w/.test(piece) }
    const isBlackPiece = (piece) => { return /^b/.test(piece) }

    // Сброс доски к стартовой позиции
    function resetGame() {
        game.reset()
        board.fen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')
        positionFEN.value = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq'
        undoStack = []
        redoStack = []
    }

    defineExpose({
        setPosition,
        makeMove
    })
</script>

<style scoped>
    .board-wrapper {
        width: 600px;
        margin: 0 auto;
    }

    .board__buttons {
        display: flex;
        flex-direction: row;
        margin-top: 20px;
        width: 100%;
        justify-content: space-between;
        margin-bottom: 20px;
    }

    .board__button {
        font-size: 1.3rem;
        font-weight: 500;
        border: none;
        transition: 0.2s;
        background-color: white;
        cursor: pointer;
    }

    .board__button:focus-visible {
        outline: none;
    }

    .board__button:hover {
        color: var(--accent-color-light);
    }

    .board__icon--disabled {
        opacity: 0.4;
        filter: grayscale(100%);
    }

    .board__button:hover:disabled {
        color: rgb(158, 158, 158);
    }

    .board__buttons-pair {
        display: flex;
    }

    .board__buttons-wrapper {
        display: flex;
    }

    .board__icon {
        width: 25px;
    }

    .board__icon--reverse {
        transform: rotate(180deg);
    }

    .board__fen {
        font-size: 0.8rem;
        color: grey;
    }
</style>