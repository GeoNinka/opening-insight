<template>
    <div class="main">
        <Header />
        <div class="main__heading-wrapper">
            <h1 class="main__heading">OPENING <br> INSIGHT.</h1>
        </div>
        <div class="main__grid">
            <div class="main__grid-item main__grid-item--gallery">
                <div class="gallery__wrapper">
                    <div class="flex__blunders">
                        <div class="grid__blunders">
                            <Blunder class="blunder blunder--active" id=1 :blunderData="{id: 1, counter: null, loss: null, from: 'r1bqkb1r/p4ppp/2p2n2/nB2p1N1/8/8/PPPP1PPP/RNBQK2R', to: 'r1bqkb1r/p4ppp/2p2n2/n3p1N1/B7/8/PPPP1PPP/RNBQK2R', game: {side: 'white'}}"></Blunder>
                            <Blunder class="blunder" id=2 :blunderData="{id: 2, counter: null, loss: null, from: 'rnbqk2r/pppp1ppp/8/2b1p3/2B1P1n1/2N2N2/PPPP1PPP/R1BQK2R', to: 'rnbqk2r/pppp1ppp/8/2b1p3/2B1P1n1/2NP1N2/PPP2PPP/R1BQK2R b KQkq', game: {side: 'white'}}"></Blunder>
                            <Blunder class="blunder" id=3 :blunderData="{id: 3, counter: null, loss: null, from: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq', to: 'rnbqkbnr/ppp1pppp/8/3p4/3PP3/8/PPP2PPP/RNBQKBNR b KQkq', game: {side: 'white'}}"></Blunder>
                            <Blunder class="blunder" id=4 :blunderData="{id: 4, counter: null, loss: null, from: 'r1bqkb1r/ppp2ppp/2n2n2/3pP3/2Bp4/5N2/PPP2PPP/RNBQK2R', to: 'r1bqkb1r/ppp2ppp/2n2P2/3p4/2Bp4/5N2/PPP2PPP/RNBQK2R', game: {side: 'white'}}"></Blunder>
                        </div>
                    </div>
                    <div class="board__wrapper">
                        <div id="board" class="board"></div>
                    </div>
                </div>
            </div>
            <div class="main__grid-item main__grid-item--text">
                <p class="main__grid-text">
                    Opening Insight — бесплатный сервис для анализа шахматных партий и выявления ваших самых частых дебютных ошибок. Узнайте о слабых местах своей дебютной подготовки до того, как это сделают ваши противники. 
                </p>
            </div>
            <RouterLink class="main__grid-item main__grid-item--button" to="games">
                <div class="main__grid-button">
                    Начать
                </div>
                <svg class="main__arrow" width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.81191 14.4892L9.16604 16.8452L18.5227 8.50005L9.16604 0.155839L6.81191 2.51188L10.8504 6.54171L0.833329 6.54171L0.833329 10.4584L10.8513 10.4584L6.81191 14.4892Z" fill="white"/>
                </svg>
            </RouterLink>
        </div>
    </div>
</template>

<script setup>
    import Header from '../components/Header.vue';
    import Blunder from '@/components/Blunder.vue';
    import { ref, onMounted, onUnmounted } from 'vue';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
    import '@chrisoakman/chessboard2/dist/chessboard2.min.css'

    const positionFEN = ref('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')

    let board = null

    let currentIndex = ref(0)

    const interval = ref()

    const fenList = [
        'r1bqkb1r/p4ppp/2p2n2/nB2p1N1/8/8/PPPP1PPP/RNBQK2R',
        'rnbqk2r/pppp1ppp/8/2b1p3/2B1P1n1/2N2N2/PPPP1PPP/R1BQK2R',
        'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR',
        'r1bqkb1r/ppp2ppp/2n2n2/3pP3/2Bp4/5N2/PPP2PPP/RNBQK2R',
    ]

    onMounted( () => {
        board = Chessboard2('board', {
            position: 'r1bqkb1r/p4ppp/2p2n2/nB2p1N1/8/8/PPPP1PPP/RNBQK2R',
            draggable: false,
        })

        let blunders = [
            document.getElementById('1'), 
            document.getElementById('2'), 
            document.getElementById('3'), 
            document.getElementById('4')
        ]


        interval.value = setInterval(() => {
            blunders[currentIndex.value].classList.remove('blunder--active');
            currentIndex.value = (currentIndex.value + 1) % blunders.length;
            blunders[currentIndex.value].classList.add('blunder--active');
            board.fen(fenList[currentIndex.value])
        }, 3000)
    })

    onUnmounted(() => {
        clearInterval(interval.value);
    })
</script>

<style scoped>
    .main {
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .main__heading {
        color: var(--accent-color-light);
        line-height: 10rem;
        font-size: 11.5rem;
        margin: 0;
        margin-left: 4.5%;
        animation: slideIn 1.5s forwards;
        opacity: 0;
        font-weight: 700;
    }

    .main__heading-wrapper {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
    }

    .main__heading-description {
        margin: 0;
        margin-top: auto;
        margin-bottom: 2vh;
        width: 20%;
        font-size: 1.2rem;
        margin-left: 10px;
        font-weight: 300;
        opacity: 0;
        animation: fadeIn 0.4s ease-in-out 1.5s forwards;
    }

    .main__grid {
        margin: 0 auto;
        width: 90%;
        display: grid;
        grid-template-columns: 55% auto;
        grid-template-rows: 75%;
        grid-template-areas: 
            "gallery text"
            "gallery button"
        ;
        gap: 2rem;
        margin-top: 5vh;
        flex-grow: 1;
        margin-bottom: 5vh;
        margin-top: 3vh;
    }

    .main__grid-item {
        border: 5px solid var(--accent-color-light);
        border-radius: 10px;
    }

    .main__grid-item--gallery {
        grid-area: gallery;
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 100%;
    }

    .gallery__wrapper {
        margin: 0 auto;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 93%;
    }

    .board {
        width: 427px;
    }

    .board__wrapper {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .main__grid-item--text {
        grid-area: text;
        font-size: 2rem;
        display: flex;
        align-items: end;
        border: none;
    }

    .main__grid-text {
        margin: 0;
    }

    .main__grid-item--button {
        grid-area: button;
        width: 100%;
        font-size: 2rem;
        color: white;
        font-weight: 600;
        display: flex;
        flex-direction: row;
        align-items: center;
        cursor: pointer;
        background-color: var(--accent-color-light);
        text-decoration: none;
    }

    .main__grid-button {
        flex: 1;
        max-width: fit-content;
        padding-left: 2rem;
        padding-right: 0.5rem;
        margin: 0;
        cursor: pointer;
        color: white;
        text-decoration: none;
    }

    .main__arrow {
        width: 30px;
        height: 30px;
        transform: translateX(0rem);
        transition: 0.5s;
    }

    .main__grid-item--button:hover>.main__arrow {
        transform: translateX(1rem);
    }

    .flex__blunders {
        height: 100%;
        justify-content: center;
        display: flex;
        flex-direction: column;
        width: 50%;
    }

    .grid__blunders {
        max-width: 420px;
        gap: 20px; 
        width: 50%;
        display: grid;
        grid-template-columns: 1fr 1fr;
    }

    .blunder {
        border: 3px solid grey;
        filter: grayscale(1);
        transition: 0.5s;
        cursor: default;
    }

    .blunder--active {
        border: 3px solid var(--accent-color-light);
        filter: grayscale(0);
        transition: 0.5s;

    }

    @keyframes fadeIn {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }

    @keyframes slideIn {
        0% {
            transform: translateX(-100%);
            opacity: 0;
        }
        100% {
            transform: translateX(0); 
            opacity: 1;
        }
    }
</style>
