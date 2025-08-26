<template>
    <div class="wrapper">
        <Header></Header>
        <div class="analysis-page">
            <div class="left-table">
                <ul class="blunders__list">
                    <li class="blunders__item"  v-for="blunder in blunders" :key="blunder.id" @click="onBlunderClick(blunder)">
                        <Blunder :class="{'blunders__item--selected': selectedBlunderId == blunder.id}" :blunderData="blunder"/>
                    </li>
                </ul>
            </div>            
            <div class="right__table">
                <ChessBoard v-model:fen="positionFEN" ref="boardRef" :is-using-chess-rules="true"></ChessBoard>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import Header from '@/components/Header.vue';
    import Blunder from '@/components/Blunder.vue';
    import ChessBoard from '@/components/ChessBoard.vue';

    // Строка в FEN нотации отображает состояние игры, содержит расстановку фигур, очерёдность хода и возможность рокировки
    const positionFEN = ref('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')
    const blunders = ref([])
    const selectedBlunderId = ref(-1)
    // Ссылка на реф компонента доски
    const boardRef = ref(null)

    // let abortController

    onMounted(() => {
        fetchBlunder()
    })

    const onBlunderClick = (blunder) => {
        positionFEN.value = blunder.from
        boardRef.value.setPosition(blunder.from, blunder.game.side)
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

    // Запрос к серверу для оценки позиции движком, нужно перенести на сторону клиента
    // const getEvaluation = async () => {

    //     if (abortController) {
    //         abortController.abort();
    //     }

    //     abortController = new AbortController()

    //     await fetch('http://localhost:5000/games/bestmove', {
    //         method: 'POST',
    //         headers: {
    //             "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify({
    //             "fen": positionFEN.value
    //         }),
    //         signal: abortController.signal
    //     }).then(res => {
    //         if (res.status == 200) {
    //             res.json().then(json => {
    //                 if (game.turn() == 'b') {
    //                     evalPos.value = json.evaluation * -1
    //                 } else {
    //                     evalPos.value = json.evaluation
    //                 }
    //                 board.addArrow({
    //                     color: '#c95715',
    //                     start: json.bestMove.slice(0 ,2),
    //                     end: json.bestMove.slice(2),
    //                     size: 'large',
    //                 })
    //             })
    //         }
    //     }).catch(e => {
    //         if (e.name === 'AbortError') {
    //             console.log('Previous request aborted');
    //         } else {
    //             console.error(e);
    //         }
    //     })
    // }

    // watch(positionFEN, async () => {
        // evalPos.value = '...'
        // getEvaluation()
    // })

</script>

<style scoped>
    .analysis-page {
        width: 90%;
        margin: 40px auto;
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