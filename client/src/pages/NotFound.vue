<template>
    <div class="main">
        <Header></Header>
        <div class="wrapper">
            <p class="p404">404</p>
            <div id="board" class="board"></div>
            <RouterLink class="p404" to="/">Вернуться <br> на главную</RouterLink>
        </div>

    </div>
</template>

<script setup>
    import Header from '@/components/Header.vue';
    import { onMounted } from 'vue';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';

    let board = null

    onMounted(() => {
        board = Chessboard2('board', {
            draggable: true,
            position: '8/8/8/4N3/8/8/8/8'
        })
    })

</script>

<style scoped>
    .wrapper {
        height: 90vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .board {
        width: 400px;
    }

    .p404 {
        font-size: 4rem;
        margin: 20px;
        margin-bottom: 10px;
        font-weight: 800;
        font-style: italic;
        color: var(--accent-color-light);
        text-decoration: none;
    }

    .text {
        font-size: 1.2rem;
        margin: 0;
    }

    .link {
        margin-top: 20px;
        color: white;
        background-color: var(--accent-color-light);
        padding: 20px;
        border-radius: 5px;
        text-decoration: none;
        font-size: 1.2rem;
        transition: 0.5s;
    }

    .link:hover {
        background-color: var(--accent-color-dark);
        transition: 0.5s;
    }
</style>