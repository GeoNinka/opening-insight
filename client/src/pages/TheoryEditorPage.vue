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
                <ChessBoard v-model:fen="positionFEN" ref="boardRef" :is-using-chess-rules="true"></ChessBoard>
            </div>
            
            <div class="theory__right-table right-table">
                <div class="right-table__top-bar">
                    <div class="right-table__preview-board" id="preview-board"></div>
                    
                </div>
                <div class="right-table__buttons">
                    <button class="right-table__button" @click="toggleEditor">Открыть редактор</button>
                </div>
                <p class="right-table__fen">
                    {{ previewPositionFEN }}
                </p>
                <ul class="right-table__list">
                    <p>Продолжения</p>
                    <li class="right-table__item" v-for="(item, index) in continuations" :key="index" @mousemove="handleMouseEnter(item)" @mouseleave="handleMouseLeave" @click.stop="handleContinuationClick(item)">
                        <p class="right-table__move">{{ item.move }}</p>
                        <div class="right-table__pair">
                            <p class="right-table__name">{{ item.toPositionName }}</p>
                        </div>
                        <button class="delete-button" @click.stop="deleteContinuation(item)"><img src="../../icons/deleteWhite.svg" style="max-width: 25px; max-height: 25px;" alt=""></button>
                    </li>
                    <p>Частые ошибки</p>
                    <li class="right-table__item" v-for="(item, index) in blunders" :key="index" @mouseenter="handleMouseEnter(item)" @mouseleave="handleMouseLeave" @click="handleContinuationClick(item)">
                        <p class="right-table__move">{{ item.move }}</p>
                        <div class="right-table__pair">
                            <p class="right-table__name">{{ item.toPositionName }}</p>
                        </div>
                        <button class="delete-button" @click.stop="deleteContinuation(item)"><img src="../../icons/deleteWhite.svg" style="max-width: 25px; max-height: 25px;" alt=""></button>
                    </li>
                </ul>
            </div>
        </div>

        <div v-show="isEditorOpen" @click.stop="toggleEditor" class="editor">
            <EditorForm @click="handleFormClick" ref="formRef"></EditorForm>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
    import '@chrisoakman/chessboard2/dist/chessboard2.min.css'
    import Header from '@/components/Header.vue';
    import ChessBoard from '@/components/ChessBoard.vue';
    import EditorForm from '@/components/EditorForm.vue';

    let previewBoard = null

    const route = useRoute();
    const boardRef = ref(null)
    const isEditorOpen = ref(true) // Нужно открыть форму для правильной отрисовки доски внутри 
    const continuations = ref([])
    const blunders = ref([])
    const formRef = ref(null)

    const positionFEN = ref('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
    const previewPositionFEN = ref('')

    const openingName = ref('')
    const openingDescription = ref('')


    onMounted(async () => {
        isEditorOpen.value = false // Моментально закрываем форму
        positionFEN.value = route.query.positionFEN || ''
        boardRef.value.setPosition(positionFEN.value) // Расставляем фигуры на доске в форме в зависимости от расстановки на основной доске

        previewPositionFEN.value = positionFEN.value
        previewBoard = Chessboard2('preview-board', {
            position: `${previewPositionFEN.value.split(' ')[0]}`,
            draggable: false,
            showNotation: false,
        })
        getContinuations()
    })

    function toggleEditor() {
        isEditorOpen.value = !isEditorOpen.value
        getContinuations()
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

    // Обновление названия позиции и описания
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
        boardRef.value.makeMove(item)
    }

    function handleFormClick(e) {
        e.stopPropagation()
    }
    
    // Изменение состояния формы при совершении каждого хода
    watch(positionFEN, (newFEN) => {
        formRef.value.setupForm(newFEN)
        previewPositionFEN.value = newFEN.split('-')[0]
        previewBoard.fen(previewPositionFEN.value)
        getContinuations()
    })
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
        width: 35%;
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
        justify-content: center;
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