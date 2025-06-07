<template>
    <div class="wrapper">
        <Header></Header>
        <div class="analysis-page">
            <div class="left-table">
                <p>Найденные ошибки</p>
                <ul class="blunders__list">
                    <li class="blunders__item"  v-for="blunder in blunders" :key="blunder.id" @click="onBlunderClick(blunder)">
                        <Blunder :class="{'blunders__item--selected': selectedBlunderId == blunder.id}" :blunderData="blunder"/>
                    </li>
                </ul>
            </div>

            <div class="right__table">
                <div class="board__wrapper">
                    <p class="board__eval">Оценка позиции: {{ evalPos }}</p>
                    <div class="board" id="board"></div>
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
            </div>
        </div>
    </div>
</template>

<script setup>
    import { nextTick, onMounted, ref, watch } from 'vue';
    import Header from '@/components/Header.vue';
    import Blunder from '@/components/Blunder.vue';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
    import { Chess } from 'chess.js';

    let board = null
    const game = new Chess()

    let undoStack = []
    let redoStack = []

    const positionFEN = ref('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')
    const evalPos = ref('...')

    const blunders = ref([])

    const selectedBlunderId = ref(-1)

    let abortController

    onMounted(() => {
        board = Chessboard2('board', {
            position: positionFEN.value,
            draggable: true,
            onDragStart,
            onDrop,
            onChange: onBoardChange,
        })

        fetchBlunder()
        getEvaluation()
    })

    const onBoardChange = () => {
        board.clearArrows()
    }

    function onDragStart(dragStartEvt) {
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

    function onDrop(dropEvt) {
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
                positionFEN.value = game.fen().split(' -')[0]
            })
        } catch (e) {
            console.log(e)
            board.clearCircles()
            return 'snapback'
        }
    }

    function undoMove() {
        const undone = game.undo()
        if (undone) {
            redoStack.push(undone)
            board.fen(game.fen())
            positionFEN.value = game.fen()
        }
    }

    function redoMove() {
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
            positionFEN.value = game.fen()
            }
        }
    }

    function handleKeydown(event) {
        if (event.key === 'ArrowLeft') {
            event.preventDefault()
            undoMove()
        } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            redoMove()
        }
    }

    function isWhitePiece(piece) { return /^w/.test(piece) }
    function isBlackPiece(piece) { return /^b/.test(piece) }

    function resetGame() {
        game.reset()
        board.fen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')
        positionFEN.value = game.fen()
        undoStack = []
        redoStack = []
    }

    const onBlunderClick = (blunder) => {
        positionFEN.value = blunder.from
        game.load(blunder.from)
        board.fen(blunder.from)
        board.orientation(blunder.game.side)

        console.log(blunder)

        selectedBlunderId.value = blunder.id
    }

    const fetchBlunder = async () => {
        await fetch('http://localhost:5000/games/blunders', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
            }

        }).then(res => {
            if (res.status == 200) {
                res.json().then(json => {
                    blunders.value = json.filter(blunder => blunder.counter > 1)
                })
            }
        })
    }

    const getEvaluation = async () => {

        if (abortController) {
            abortController.abort();
        }

        abortController = new AbortController()

        await fetch('http://localhost:5000/games/bestmove', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "fen": positionFEN.value
            }),
            signal: abortController.signal
        }).then(res => {
            if (res.status == 200) {
                res.json().then(json => {
                    if (game.turn() == 'b') {
                        evalPos.value = json.evaluation * -1
                    } else {
                        evalPos.value = json.evaluation
                    }
                    board.addArrow({
                        color: '#c95715',
                        start: json.bestMove.slice(0 ,2),
                        end: json.bestMove.slice(2),
                        size: 'large',
                    })
                })
            }
        }).catch(e => {
            if (e.name === 'AbortError') {
                console.log('Previous request aborted');
            } else {
                console.error(e);
            }
        })
    }

    watch(positionFEN, async () => {
        evalPos.value = '...'
        getEvaluation()
    })

</script>

<style scoped>
    .analysis-page {
        width: 90%;
        margin: 0 auto;
        display: flex;
        flex-direction: row;
    }

    .left-table {
        width: 40%;
    }

    .blunders__list {
        list-style-type: none;
        width: 100%;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
        row-gap: 40px;
        margin: 0;
        max-height: 80vh;
        overflow-y: scroll;
    }

    .blunders__item--selected {
        border: 2px solid var(--accent-color-light);
    }

    .right__table {
        width: 60%;
    }

    .board__wrapper {
        width: 650px;
        margin: 0 auto;
    }

    .board {
        width: 650px;
    }

    .board__eval {
        display: inline-block;
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