import { defineStore } from 'pinia'


// export const useGameListStore = defineStore('gameList', {
//     state: () => ({
//         games: [],
//     }),
//     actions: {
//         async fetchGames(nickName) {
//             fetch(`https://lichess.org/api/games/user/${nickName}?max=20`, {
//                     method: 'GET',
//                     headers: {
//                         'Accept': 'application/x-ndjson',
//                     }
//                 }).then(response => {
//                     if (!response.ok) {
//                         throw new Error('Not OK')
//                     } else {
//                         return response.text()
//                     }
//                 }).then(data => {
//                     const lines = data.trim().split('\n');

//                     const jsonArray = lines.map(line => JSON.parse(line));

//                     console.log(jsonArray)

//                     // gamesStore.jsonsToObjects(ndjsonToJson(data))
//                     // console.log('Done!')
//                 })
//         },
//     },
// });
