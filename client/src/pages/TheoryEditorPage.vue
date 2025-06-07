<template>
    <div>
        <Header></Header>
        <div class="theory">
            <div class="theory__left-table left-table">
                <input class="left-table__opening-name" v-model="openingName"></input>
                <div class="left-table__divider"></div>
                <textarea class="left-table__description" v-model="openingDescription">{{ openingDescription }}</textarea>
                <button class="left-table__button" @click="updatePosition">Сохранить изменения</button>
            </div>

            <div class="theory__board--wrapper">
                <div id="board" class="board"></div>
                <div class="theory__buttons">
                    <div class="board__buttons-wrapper">
                        <button class="board__button" @click="undoMove" :disabled="movesStack.length == 1">Вернуть ход</button>
                        <button class="board__button" @click="resetGame">Начальная позиция </button>
                        <img class="board__icon"  src="../../icons/refresh-button.svg" alt="">
                    </div>
                </div>
            </div>
            
            <div class="theory__right-table right-table">
                <div class="right-table__top-bar">
                    <div class="right-table__preview-board" id="preview-board"></div>
                    <div class="right-table__settings">
                        <label>Порядок хода</label>
                        <select v-model="selectedTurn" @change="boardChange" class="right-table__select">
                            <option value="w">Белые</option>
                            <option value="b">Черные</option>
                        </select>
                        <div>
                            <label>Рокировка белых</label>
                            <div>
                                <label>0-0</label>
                                <input type="checkbox" v-model="castlingWK" @change="boardChange">
                                <label>0-0-0</label>
                                <input type="checkbox" v-model="castlingWQ" @change="boardChange">
                            </div>
                            <label>Рокировка черных</label>
                            <div>
                                <label>0-0</label>
                                <input type="checkbox" v-model="castlingBK" @change="boardChange">
                                <label>0-0-0</label>
                                <input type="checkbox" v-model="castlingBQ" @change="boardChange">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="right-table__buttons">
                    <button class="right-table__button" @click="toggleEditor">Открыть редактор</button>
                    <!-- <button class="right-table__button right-table__button--colored">Удалить позицию</button> -->
                </div>
                <p class="right-table__fen">
                    {{ positionFEN }}
                </p>
                <ul class="right-table__list">
                    <p>Продолжения</p>
                    <li class="right-table__item" v-for="(item, index) in continuations" :key="index" @mousemove="handleMouseEnter(item)" @mouseleave="handleMouseLeave" @click="handleContinuationClick(item)">
                        <p class="right-table__move">{{ item.move }}</p>
                        <div class="right-table__pair">
                            <p class="right-table__name">{{ item.toPositionName }}</p>
                            <!-- <p class="right-table__fen">{{ item.toFen }}</p> -->
                        </div>
                        <button class="delete-button" @click.stop="deleteContinuation(item)"><img src="../../icons/deleteWhite.svg" style="max-width: 25px; max-height: 25px;" alt=""></button>
                    </li>
                    <p>Частые ошибки</p>
                    <li class="right-table__item" v-for="(item, index) in blunders" :key="index" @mouseenter="handleMouseEnter(item)" @mouseleave="handleMouseLeave" @click="handleContinuationClick(item)">
                        <p class="right-table__move">{{ item.move }}</p>
                        <div class="right-table__pair">
                            <p class="right-table__name">{{ item.toPositionName }}</p>
                            <!-- <p class="right-table__fen">{{ item.toFen }}</p> -->
                        </div>
                        <button class="delete-button" @click.stop="deleteContinuation(item)"><img src="../../icons/deleteWhite.svg" style="max-width: 25px; max-height: 25px;" alt=""></button>
                    </li>
                </ul>
            </div>
        </div>

        <div v-show="isEditorOpen" @click="toggleEditor" class="editor">
            <div @click="handleFormClick" class="editor__wrapper">
                <button @click="toggleEditor" class="editor__exit">X</button>
                <div id="editorBoard" class="editor__board"></div>

                <div class="editor__forms">
                    <div class="editor__form">
                        <label class="editor__label">Позиция FEN</label>
                        <p>{{ editorPositionFEN }}</p>
                        <label class="editor__label">Ход</label>
                        <p class="editor__move">{{ editorMove }}</p>
                        <label class="editor__label">Тип позиции</label>
                        <select class="editor__input" v-model="continuationType">
                            <option value="continuation">
                                Продолжение
                            </option>
                            <option value="blunder">
                                Ошибка
                            </option>
                        </select>
                        <button class="editor__button" @click="addPosition">Добавить</button>
                        <p style="color: black;">{{ editorMessage }}</p>
                    </div>
                    <!-- <div class="editor__divider"/> -->
                    <!-- <div class="editor__form" action="">
                        <p class="editor__label">Стрелки</p>
                        <button class="editor__button">Изменить</button>
                    </div> -->
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, onUnmounted, ref } from 'vue';
    import { useRoute } from 'vue-router';
    import { Chess } from 'chess.js';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
    import '@chrisoakman/chessboard2/dist/chessboard2.min.css'
    import Header from '@/components/Header.vue';

    const route = useRoute();

    const isValidated = ref(false)
    const isEditorOpen = ref(true)

    const game = new Chess()

    let board = null
    let previewBoard = null
    let editorBoard = null

    let arrowsJSON = ref({})

    let movesStack = ref(['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq'])

    let editorMessage = ref('')

    let continuations = ref([])
    let blunders = ref([])
    let continuationType = ref('continuation')

    const selectedTurn = ref('w')
    const castlingWK = ref(true)
    const castlingWQ = ref(true)
    const castlingBK = ref(true)
    const castlingBQ = ref(true)

    const positionFEN = ref('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')
    const previewPositionFEN = ref('')
    const editorPositionFEN = ref('')
    const editorPositionPGN = ref('')

    const openingName = ref('')
    const openingDescription = ref('')
    const editorMove = ref('')


    onMounted(async () => {
        isEditorOpen.value = false
        positionFEN.value = route.query.positionFEN || ''

        board = Chessboard2('board', {
            position: `${positionFEN.value.split(' ')[0]}`,
            draggable: true,
            showNotation: true,
            onChange: boardChange
        })

        previewPositionFEN.value = positionFEN.value
        previewBoard = Chessboard2('preview-board', {
            position: `${previewPositionFEN.value.split(' ')[0]}`,
            draggable: false,
            showNotation: false,
        })

        editorPositionFEN.value = positionFEN.value
        game.load(editorPositionFEN.value)
        editorBoard = Chessboard2('editorBoard', {
            position: `${editorPositionFEN.value.split(' ')[0]}`,
            onDragStart,
            onDrop,
            draggable: true
        })

        getContinuations()
        const ranks = document.getElementsByClassName('rank-3d54c')
    })

    function boardChange() {
        let CWK = castlingWK.value ? 'K' : ''  
        let CWQ = castlingWQ.value ? 'Q' : '' 
        let CBK = castlingBK.value ? 'k' : '' 
        let CBQ = castlingBQ.value ? 'q' : '' 

        positionFEN.value = `${board.position('fen')} ${selectedTurn.value} ${CWK}${CWQ}${CBK}${CBQ}`
        previewPositionFEN.value = positionFEN.value
        previewBoard.fen(previewPositionFEN.value)

        editorPositionFEN.value = positionFEN.value
        game.reset()
        game.load(editorPositionFEN.value)
        editorBoard.fen(editorPositionFEN.value)
        getContinuations()
    }

    function undoMove() {
        movesStack.value.pop()
        positionFEN.value = movesStack.value[movesStack.value.length - 1]
        selectedTurn.value == 'w' ? selectedTurn.value = 'b' : selectedTurn.value = 'w'
        board.fen(positionFEN.value)
    }

    function onDragStart (dragStartEvt) {
        if (game.isGameOver()) return false

        if (game.turn() === 'w' && !isWhitePiece(dragStartEvt.piece)) return false
        if (game.turn() === 'b' && !isBlackPiece(dragStartEvt.piece)) return false

        const legalMoves = game.moves({
            square: dragStartEvt.square,
            verbose: true
        })

        legalMoves.forEach((move) => {
            editorBoard.addCircle(move.to)
        })
    }

    function onDrop (dropEvt) {
        try {
            const move = game.move({
                from: dropEvt.source,
                to: dropEvt.target,
                promotion: 'q'
            })

            if (move) {
                editorMove.value = move.lan
            }

            editorBoard.clearCircles()
            editorBoard.fen(game.fen(), () => {
                editorPositionFEN.value = game.fen()
                editorPositionPGN.value = game.pgn().replace(/\[.*?\]\s*/g, '').replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '')
            })
        } catch (e) {
            console.log(e)
            editorBoard.clearCircles()
            return 'snapback'
        }
    }

    function isWhitePiece (piece) { return /^w/.test(piece) }
    function isBlackPiece (piece) { return /^b/.test(piece) }

    function resetGame () {
        game.reset()
        selectedTurn.value = 'w'
        board.fen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
        positionFEN.value = game.fen()
        positionPGN.value = game.pgn().replace(/\[.*?\]\s*/g, '').replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '')
    }

    function toggleEditor() {
        isEditorOpen.value = !isEditorOpen.value
        editorPositionFEN.value = positionFEN.value
        game.reset()
        game.load(editorPositionFEN.value)
        editorBoard.fen(editorPositionFEN.value)
        editorMove.value = ''
        getContinuations()
    }

    function handleFormClick(e) {
        e.stopPropagation()
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
            blunders.value = []
            openingName.value = ''
            openingDescription.value = ''
        }
    }

    async function updatePosition() {
        try {
            const response = await fetch('http://localhost:5000/theory/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                },
                body: JSON.stringify({
                    fen: positionFEN.value,
                    positionName: openingName.value,
                    positionDescription: openingDescription.value
                })
            })
        } catch(error) {

        }
    }

    async function addPosition() {
        try {
            const response = await fetch('http://localhost:5000/theory/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                },
                body: JSON.stringify({
                    from: positionFEN.value,
                    to: editorPositionFEN.value.split(' -')[0],
                    move: editorMove.value,
                    type: continuationType.value
                })
            })

            if (!response.ok) {
                const errorData = await response.json();
                editorMessage.value = errorData.message
                        editorPositionFEN.value = positionFEN.value
                game.reset()
                game.load(editorPositionFEN.value)
                editorBoard.fen(editorPositionFEN.value)
                editorMove.value = ''
                return
            }

            const data = await response.json()
            editorMessage.value = data.message

            editorPositionFEN.value = positionFEN.value
            game.reset()
            game.load(editorPositionFEN.value)
            editorBoard.fen(editorPositionFEN.value)
            editorMove.value = ''

        } catch(error) {

        }
    }

    async function deleteContinuation(item) {
        try {
            const response = await fetch('http://localhost:5000/theory/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                },
                body: JSON.stringify({
                    from: positionFEN.value,
                    to: item.toFen
                })
            }).then(() => {
                getContinuations()
            })
        } catch(error) {
            
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
            selectedTurn.value == 'w' ? selectedTurn.value = 'b' : selectedTurn.value = 'w'
        }
        board.fen(game.fen(), () => {
            positionFEN.value = game.fen().split(' -')[0]
        })
        movesStack.value.push(positionFEN.value)
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
        grid-template-columns: 30% 600px 1fr;
        grid-gap: 40px;
        padding-top: 5vh;
    }

    .left-table {
        display: flex;
        flex-direction: column;
        max-width: 100%;
    }

    .left-table__opening-name {
        width: 100%;
        font-size: 3rem;
        margin-bottom: 15px;
        margin-top: 0;
        box-sizing: border-box;
        padding: 5px;
    }

    .left-table__divider {
        width: 100%;
        height: 0px;
        box-sizing: border-box;
        border: 2px var(--accent-color-light) solid;
        border-radius: 2px;
    }

    .left-table__description {
        margin-top: 20px;
        width: 100%;
        font-size: 1.2rem;
        white-space: pre-line;
        height: 60vh;
        resize: none;
        box-sizing: border-box;
        padding: 5px;
    }

    .left-table__button {
        cursor: pointer;
        color: white;
        background-color: var(--accent-color-light);
        border: none;
        margin-top: 20px;
        width: 50%;
        text-decoration: none;
        font-size: 1rem;
        border-radius: 5px;
        padding: 10px;
        transition: 0.3s;
    }

    .left-table__button:hover {
        background-color: var(--accent-color-dark);
    }

    .board {
        width: 100%;
        overflow: visible;
    }  

    .board__buttons-wrapper {
        margin-top: 20px;
        display: flex;
        align-items: center;
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

    .board__button:hover+.board__icon {
        transform: rotate(15deg);
    }

    .board__icon {
        width: 25px;
        transform: rotate(0deg);
        transition: 0.5s;
    }

    .right-table {
        /* border: 1px solid black; */
        margin-bottom: 40px;   
    }

    .right-table__top-bar {
        display: flex;
        flex-direction: row;
        width: 100%;
        justify-content: space-between;
    }

    .right-table__preview-board {
        width: 70%;
        min-width: 20px;
    }    

    .right-table__settings {
        display: flex;
        flex-direction: column;
        width: 100%;
        margin: 10px;
        margin-left: 20px;
        gap: 20px;
        /* justify-content: space-around; */
    }

    .right-table__buttons {
        display: flex;
        flex-direction: row;
        width: 100%;
        margin-top: 20px;
        margin-bottom: 10px;
        gap: 20px;
    }

    .right-table__button {
        cursor: pointer;
        color: white;
        background-color: var(--accent-color-light);
        border: none;
        width: 40%;
        text-decoration: none;
        font-size: 1rem;
        border-radius: 5px;
        padding: 10px;
        transition: 0.3s;
    }

    .right-table__button--colored {
        background-color: rgb(180, 3, 3);
    }

    .right-table__button:hover {
        background-color: var(--accent-color-dark);
    }

    .right-table__button--colored:hover {
        background-color: rgb(139, 2, 2);
    }

    .right-table__fen {
        font-size: 0.8rem;
        margin: 0;
        margin-top: 20px;
        color: rgb(94, 94, 94);
        margin: 0;
    }

    .editor {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        backdrop-filter: brightness(60%);
        display: flex;
        align-items: center;
    }

    .editor__wrapper {
        width: 70%;
        margin: 0 auto;
        padding: 40px;
        background-color: white;
        border-radius: 10px;
        display: grid;
        grid-template-columns: 40% 1fr;
        position: relative;
    }

    .editor__forms {
        display: flex;
        flex-direction: column;
        height: 100%;
        justify-content: space-around;
    }

    .editor__board {
        width: 100%;
    }

    .editor__divider {
        width: 80%;
        margin: 20px auto;
        border-radius: 1px;
        border: 1px solid var(--accent-color-light);
    }

    .editor__form {
        display: flex;
        flex-direction: column;
        margin: 0 auto;
        width: 80%;
        justify-content: space-around;
    }

    .editor__label {
        font-size: 1.3rem;
        margin-top: 15px;
    }

    .editor__input {
        width: 40%;
        padding: 10px;
        margin-top: 10px;
    }

    .editor__button {
        width: 40%;
        /* margin: 0 auto; */
        background-color: var(--accent-color-light);
        color: white;
        border: none;
        padding: 10px;
        border-radius: 5px;
        font-size: 1.3rem;
        transition: 0.3s;
        cursor: pointer;
        margin-top: 20px;
    }

    .editor__button:hover {
        background-color: var(--accent-color-dark);
    }

    .editor__exit {
        position: absolute;
        right: 40px;
        top: 40px;
        border: none;
        cursor: pointer;
    }

    .right-table__list {
        overflow-y: scroll;
        max-height: 50vh;
        padding-left: 0;
        margin: 0;
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
        position: relative;
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

    .right-table__select {
        width: 40%;
        padding: 10px;
    }

    .editor__move {
        margin: 0;
        height: 20px;
    }

    .delete-button {
        cursor: pointer;
        width: 40px;
        height: 40px;
        position: absolute;
        right: 20px;
        background-color: var(--accent-color-light);
        border: none;
        border-radius: 5px;
    }

    .delete-button:hover {
        background-color: var(--accent-color-dark);
    }
</style>

<style> 
    .right-table__preview-board .rank-3d54c {
        display: none; 
    }
    .right-table__preview-board .file-44ae4 {
        display: none; 
    }
    .circle-a0266 {
        background-color: #181818 !important;
    }
</style>