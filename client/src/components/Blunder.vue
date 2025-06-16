<template>
    <div class="blunder" @mouseenter="mouseEnterHandler" @mouseleave="mouseLeaveHandler">
        <div :id="blunderData.id" ref="boardContainer" class="blunder__board"></div>
        <p class="blunder__text" v-if="blunderData.counter != null">Встретилось раз: {{ blunderData.counter }}</p>
        <p class="blunder__text" v-if="blunderData.loss != null">Потеря сантипешек: {{ blunderData.loss != null ?  blunderData.loss.toFixed(2) : null }}</p>
        {{ side }}
    </div>
</template>

<script setup>
    import { onMounted, defineProps, ref } from 'vue';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';

    const props = defineProps({
        blunderData: {
            type: Object,
            required: true
        }
    }) 

    const boardContainer = ref(null)
    const fromFEN = ref('')
    const toFEN = ref('')

    let board = null

    onMounted(() => {
        fromFEN.value = props.blunderData.from
        toFEN.value = props.blunderData.to

        board = Chessboard2(boardContainer.value, {
            position: fromFEN.value,
            orientation: props.blunderData.game.side
        })

        let ranks = document.getElementsByClassName('notation-ranks-d3f97')
        let files = document.getElementsByClassName('notation-files-c3c0a')
        for (let i = 0; i < ranks.length; i++) {
            ranks[i].style = "display: none"
            files[i].style = "display: none"
        }
    })

    const mouseEnterHandler = () => {
        board.fen(toFEN.value)
    }

    const mouseLeaveHandler = () => {
        board.fen(fromFEN.value)
    }


</script>

<style scoped>
    .blunder {
        width: 200px;
        border: 2px solid rgb(175, 175, 175);
        border-radius: 5px;
        transition: 0.3s;
        cursor: pointer;
    }

    .blunder__board {
        width: 100%;
    }

    .blunder__text {
        font-size: 0.9rem;
        margin: 0;
        padding: 5px;
    }
</style>
