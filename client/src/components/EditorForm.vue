<template>
    <div>
        <div @click="handleFormClick" class="editor__wrapper">
                <!-- <button @click="toggleEditor" class="editor__exit">X</button> -->
                <div id="editorBoard" class="editor__board"></div>
                <div class="editor__forms">
                    <div class="editor__form">
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
                        <button class="editor__button" @click="resetPosition">Сбросить</button>
                        <p style="color: black;">{{ editorMessage }}</p>
                    </div>
                </div>
        </div>
    </div>
</template>

<script setup>
    import { Chess } from 'chess.js';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
    import { onMounted, ref } from 'vue';

    const game = new Chess()
    let editorBoard = null
    // Булевая переменная которая разрешает делать только один ход
    let isMoved = false

    let editorMessage = ref('')
    let continuationType = ref('continuation')
    let lastPos = ''
    const editorPositionFEN = ref('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')
    const editorMove = ref('')

    onMounted(() => {
        game.load(editorPositionFEN.value)
        console.log(editorPositionFEN.value)
        editorBoard = Chessboard2('editorBoard', {
            position: `${editorPositionFEN.value.split(' ')[0]}`,
            onDragStart,
            onDrop,
            draggable: true
        })
    })

    // Нужно добавить в компонент ChessBoard возможность установки различных id досок, обновить обработчики ходов и удалить переиспользуемый код
    function onDragStart (dragStartEvt) {
        // Если ход уже был сделан то никак не реагируем на действия пользователя
        if (isMoved) return false
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
        // Если ход уже был сделан то никак не реагируем на действия пользователя
        if (isMoved) return false
        try {
            const move = game.move({
                from: dropEvt.source,
                to: dropEvt.target,
                promotion: 'q'
            })

            if (move) {
                editorMove.value = move.lan
                isMoved = true
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

    async function addPosition() {
        try {
            const response = await fetch('http://localhost:5000/theory/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                },
                body: JSON.stringify({
                    from: lastPos,
                    to: editorPositionFEN.value.split(' -')[0],
                    move: editorMove.value,
                    type: continuationType.value
                })
            })

            if (!response.ok) {
                const errorData = await response.json();
                editorMessage.value = errorData.message
                editorPositionFEN.value = lastPos
                game.reset()
                game.load(editorPositionFEN.value)
                isMoved = false
                editorBoard.fen(editorPositionFEN.value)
                editorMove.value = ''
                return
            }

            const data = await response.json()
            editorMessage.value = data.message

            // Сброс доски к изначальному состоянию 
            editorPositionFEN.value = lastPos
            game.reset()
            game.load(editorPositionFEN.value)
            editorBoard.fen(editorPositionFEN.value)
            editorMove.value = ''
            isMoved = false
        } catch(error) {

        }
    }

    const resetPosition = () => {
            editorPositionFEN.value = lastPos
            game.reset()
            game.load(editorPositionFEN.value)
            editorBoard.fen(editorPositionFEN.value)
            editorMove.value = ''
            isMoved = false
    }

    // Установка позиции доски из родительского компонента
    const setupForm = (position) => {
        lastPos = position
        editorPositionFEN.value = position
        game.load(position)
        editorBoard.fen(position.split(' ')[0])
    }

    defineExpose({
        setupForm
    })

</script>

<style scoped>
    .editor__wrapper {
        width: 100%;
        margin: 0 auto;
        padding: 40px;
        background-color: white;
        border-radius: 10px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .editor__move {
        margin: 0;
        height: 20px;
    }

    .editor__forms {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 300px;
        justify-content: space-around;
    }

    .editor__board {
        width: 400px;
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
        width: 100%;
        justify-content: space-around;
    }

    .editor__label {
        font-size: 1.3rem;
        margin-top: 15px;
    }

    .editor__input {
        width: 100%;
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
</style>