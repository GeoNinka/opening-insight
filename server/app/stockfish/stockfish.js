import create from 'stockfish'

const stockfish = create()

stockfish.onmessage = function(message) {
    console.log(message)
}

stockfish.postMessage('uci')

stockfish.postMessage('position fen 8/4k3/R7/8/7r/PK1R4/1PP5/r7 w - - 1 43');
stockfish.postMessage('go depth 18');

