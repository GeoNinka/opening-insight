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
                <ChessBoard v-model:fen="positionFEN" ref="boardRef" :is-using-chess-rules="true"></ChessBoard>
                <div v-if="isValidated">
                    <!-- Передаём по ссылке текущее состояние доски -->
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
                        </div>
                    </li>
                    <p>Частые ошибки</p>
                    <li class="right-table__item" v-for="(item, index) in blunders" :key="index" @mouseenter="handleMouseEnter(item)" @mouseleave="handleMouseLeave" @click="handleContinuationClick(item)">
                        <p class="right-table__move">{{ item.move }}</p>
                        <div class="right-table__pair">
                            <p class="right-table__name">{{ item.toPositionName }}</p>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref, watch } from 'vue';
    import ChessBoard from '@/components/ChessBoard.vue';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
    import Header from '@/components/Header.vue';
    import { validateUserRole } from '@/utils/validateUserRole';

    let previewBoard = null

    const boardRef = ref(null)
    const positionFEN = ref('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')
    const continuations = ref([])
    const blunders = ref([])
    const isValidated = ref(false)
    const previewPositionFEN = ref('')
    const openingName = ref('')
    const openingDescription = ref('')

    onMounted(async () => {
        isValidated.value = await validateUserRole()

        previewPositionFEN.value = positionFEN.value
        previewBoard = Chessboard2('preview-board', {
            position: `${previewPositionFEN.value.split(' ')[0]}`,
            draggable: false,
        })

        getContinuations()
    })  
    
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

    // При выборе продолжения совершается ход, что позволяет использовать вункционал отмены и возврата ходов
    function handleContinuationClick(item) {
        boardRef.value.makeMove(item)
    }

    // При изменении состояния доски обновляем миниатюру доски и список продолжений
    watch(positionFEN, () => {
        previewPositionFEN.value = positionFEN.value
        previewBoard.fen(positionFEN.value)
        getContinuations();
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
        grid-template-columns: 30% minmax(30%, 600px) 1fr;
        grid-gap: 40px;
        padding-top: 5vh;
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