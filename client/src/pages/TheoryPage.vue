<template>
    <div class="wrapper">
        <Header></Header>
        <div class="theory">
            <div class="theory__left-table left-table">
                <p class="left-table__opening-name">{{ openingName }}</p>
                <div class="left-table__divider"></div>
                <p class="left-table__description">{{ openingDescription }}</p>
            </div>

            <div class="theory__board--wrapper">
                <div id="board1" class="theory__board board"></div>
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
                <div style="font-size: 0.8rem; color: grey;">FEN: {{ positionFEN }}</div>
                <div class="board__PGN">PGN: {{ positionPGN }}</div>

                <div v-if="isValidated">
                    <RouterLink class="header__editor-link" :to="{ path: '/theory-editor', query: { positionFEN: positionFEN.split(' -')[0] } }">Редактировать базу</RouterLink>
                </div>
            </div>

            <div class="theory__right-table right-table">
                <div class="right-table__topbar">
                    <div class="right-table__preview-board" id="preview-board"></div>
                </div>
                <ul class="right-table__list">
                    <p>Продолжения</p>
                    <li class="right-table__item" v-for="(item, index) in continuations" :key="index" @mouseenter="handleMouseEnter(item)" @mouseleave="handleMouseLeave" @click="handleContinuationClick(item)">
                        <p class="right-table__move">{{ item.move }}</p>
                        <div class="right-table__pair">
                            <p class="right-table__name">{{ item.toPositionName }}</p>
                            <!-- <p class="right-table__fen">{{ item.toFen }}</p> -->
                        </div>
                    </li>
                    <p>Частые ошибки</p>
                    <li class="right-table__item" v-for="(item, index) in blunders" :key="index" @mouseenter="handleMouseEnter(item)" @mouseleave="handleMouseLeave" @click="handleContinuationClick(item)">
                        <p class="right-table__move">{{ item.move }}</p>
                        <div class="right-table__pair">
                            <p class="right-table__name">{{ item.toPositionName }}</p>
                            <!-- <p class="right-table__fen">{{ item.toFen }}</p> -->
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { nextTick, onMounted, onUnmounted, ref } from 'vue';
    import { Chess } from 'chess.js';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
    import '@chrisoakman/chessboard2/dist/chessboard2.min.css'
    import Header from '@/components/Header.vue';
    import { validateUserRole } from '@/utils/validateUserRole';

    const game = new Chess()

    let board = null
    let previewBoard = null

    let undoStack = []
    let redoStack = []

    let continuations = ref([])
    let blunders = ref([])
    
    const isValidated = ref(false)
    const positionFEN = ref('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')
    const positionPGN = ref('')
    const previewPositionFEN = ref('')

    const openingName = ref('')
    const openingDescription = ref('')

    onMounted(async () => {
        isValidated.value = await validateUserRole()

        board = Chessboard2('board1', {
            position: 'start',
            draggable: true,
            onDragStart,
            onDrop,
            showNotation: true,
            onChange: onBoardChange,
        })

        previewPositionFEN.value = positionFEN.value
        previewBoard = Chessboard2('preview-board', {
            position: `${previewPositionFEN.value.split(' ')[0]}`,
            draggable: false,
        })

        window.addEventListener('keydown', handleKeydown)

        const ranks = document.getElementsByClassName('rank-3d54c')
        for (let i = 0; i < ranks.length; i++) {
            ranks[i].innerHTML = parseInt(ranks[i].innerHTML) + 1 
        }   
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 1);
        getContinuations()
    })  

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeydown)
    })

    async function onBoardChange() {
        const currentFEN = game.fen().split(' -')[0];
        positionFEN.value = currentFEN;
        previewPositionFEN.value = currentFEN
        previewBoard.fen(previewPositionFEN.value)
        getContinuations();
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
                positionPGN.value = game.pgn().replace(/\[.*?\]\s*/g, '').replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '')
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
            positionPGN.value = game.pgn().replace(/\[.*?\]\s*/g, '').replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '')
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
                positionPGN.value = game.pgn().replace(/\[.*?\]\s*/g, '').replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '')
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
        positionPGN.value = game.pgn().replace(/\[.*?\]\s*/g, '').replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '')
        undoStack = []
        redoStack = []
    }
    
    async function getContinuations() {
        try {
            const response = await fetch('http://localhost:5000/theory/get', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({"fen": positionFEN.value}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch continuations');
            }

            const data = await response.json();
            continuations.value = data.continuations
            blunders.value = data.blunders
            openingName.value = data.positionName
            openingDescription.value = data.positionDescription
        } catch (error) {
            console.error('Error fetching continuations:', error.message);
            continuations.value = []
            openingName.value = ''
            openingDescription.value = ''
        }
    }

    function handleMouseEnter(item) {
        previewPositionFEN.value = item.toFen
        previewBoard.fen(previewPositionFEN.value)
    }

    function handleMouseLeave() {
        previewPositionFEN.value = positionFEN.value
        previewBoard.fen(previewPositionFEN.value)
    }

    function handleContinuationClick(item) {
        const move = game.move(item.move)
        if (move) {
            undoStack.push(move)
            redoStack.length = 0 
        }
        board.fen(game.fen(), () => {
            positionFEN.value = game.fen().split(' -')[0]
            positionPGN.value = game.pgn().replace(/\[.*?\]\s*/g, '').replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '')
        })
    }

</script>

<style scoped>
    .wrapper {
        height: 100vh;
        background-color: #ffffff;
        opacity: 1;
        background-size: 21px 21px;
    }

    .theory {
        width: 90%;
        margin: 0 auto;
        height: 85vh;
        display: grid;
        grid-template-columns: 30% minmax(30%, 600px) 1fr;
        grid-gap: 40px;
        padding-top: 5vh;
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

    .board__PGN {
        margin-bottom: 20px;
    }

    .header__editor-link {
        color: white;
        background-color: var(--accent-color-light);
        text-decoration: none;
        font-size: 1.5rem;
        border-radius: 5px;
        padding: 10px;
    }

    .left-table {
        max-width: 100%;
    }

    .left-table__opening-name {
        font-size: 3rem;
        margin-bottom: 15px;
        margin-top: 0;
    }

    .left-table__divider {
        width: 100%;
        height: 0px;
        box-sizing: border-box;
        border: 2px var(--accent-color-light) solid;
        border-radius: 2px;
    }

    .left-table__description {
        font-size: 1.2rem;
        white-space: pre-line;
    }

    .board {
        width: 100%;
        overflow: visible;
    }  

    .right-table {
    }

    .right-table__list {
        overflow-y: scroll;
        padding-left: 0;
        max-height: 55vh;
    }


    .right-table__item {
        list-style-type: none;
        margin-top: 10px;
        border: 1px solid rgb(173, 173, 173);
        border-radius: 5px;
        padding: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;
        transition: 0.4s;
        cursor: pointer;
        user-select: none;
    }

    .right-table__item:hover {
        border-color: black;
    }

    .right-table__move {
        font-size: 1.6rem;
        margin: 0;
    }

    .right-table__pair {
        margin-left: 10px;
    }

    .right-table__name {
        margin: 0;
    }

    .right-table__fen {
        margin: 0;
        font-size: 0.8rem;
    }

    .right-table__topbar {
        display: grid;
        grid-template-columns: 40% 1fr;
    }

</style>