<template>
    <div class="">
        <Header></Header>
        <div class="theory">
            <div id="board1" class="board"></div>
            {{ positionFEN }}

        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import { useRoute } from 'vue-router';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
    import '@chrisoakman/chessboard2/dist/chessboard2.min.css'
    import Header from '@/components/Header.vue';


    let board = null

    const route = useRoute();
    const positionFEN = ref('')

    onMounted(async () => {
        positionFEN.value = route.query.positionFEN || ''

        board = Chessboard2('board1', {
            position: `${positionFEN.value.split(' ')[0]}`,
            draggable: true
        })
    })

</script>

<style scoped>
    .theory {
        width: 90%;
        margin: 0 auto;
    }

    .board {
        width: 40%;
    }
</style>