<template>
    <div class="">
        <Header></Header>
        <div class="theory">
            <div id="board1" class="board"></div>
            <div>FEN: {{ positionFEN }}</div>
            <div>PGN: {{ positionPGN }}</div>
            <div v-if="isValidated">
                <RouterLink class="header__navigation-item" :to="{ path: '/theory-editor', query: { positionFEN: positionFEN } }">Редактировать базу</RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import { Chess } from 'chess.js';
    import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
    import '@chrisoakman/chessboard2/dist/chessboard2.min.css'
    import Header from '@/components/Header.vue';
    import { validateUserRole } from '@/utils/validateUserRole';

    const game = new Chess()

    let board = null
    
    const isValidated = ref(false)
    const positionFEN = ref('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const positionPGN = ref()

    onMounted(async () => {
        isValidated.value = await validateUserRole()

        board = Chessboard2('board1', {
            position: 'start',
            draggable: true,
            onDragStart,
            onDrop
        })
    })  

    function onDragStart (dragStartEvt) {
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

    function onDrop (dropEvt) {
        try {
            const move = game.move({
                from: dropEvt.source,
                to: dropEvt.target,
                promotion: 'q'
            })

            board.clearCircles()

            board.fen(game.fen(), () => {
                positionFEN.value = game.fen()
                positionPGN.value = game.pgn().replace(/\[.*?\]\s*/g, '').replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '')
                console.log(positionPGN.value)
            })
        } catch (e) {
            console.log(e)
            board.clearCircles()
            return 'snapback'
        }
    }

    function isWhitePiece (piece) { return /^w/.test(piece) }
    function isBlackPiece (piece) { return /^b/.test(piece) }

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