<template>
    <div class="wrapper">
        <Header></Header>
        <div class="games">
            <div class="games__upload">
                <!-- Прогресс анализа игр -->
                <div class="progress-container">
                    <div class="side-number">Проанализировано {{ totalGames - totalUnanalyzedGames }}</div>
                    <div class="circular-progress">
                    <svg viewBox="0 0 36 36" class="circular-chart">
                        <path
                        class="circle-bg"
                        d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                        class="circle"
                        :stroke-dasharray="progress + ', 100'"
                        d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" class="percentage">{{ totalGames }}</text>
                    </svg>
                    </div>
                    <div class="side-number">{{ totalUnanalyzedGames }} доступно для анализа</div>
                </div>
                <!-- Интерфейс для управления списком игр -->
                <div style="display: flex; gap: 20px;">
                    <button class="games__button" :class="{ 'games__button--rotate': isFormShow }" @click="addButtonClickHandler">+</button>
                    <button class="delete-games__button" @click="showDeleteForm"><img class="trashcan" src="../../public/icons/deleteWhite.svg" alt=""></button>
                </div>
                <!-- Форма загрузки игр -->
                <div class="games__form" v-show="isFormShow">
                    <div>
                        <label for="" >Lichess nickname:</label>
                        <input type="text" v-model="nickname" style="margin-left: 15px;">
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center;">
                        <label for="">Число игр:</label>
                        <input type="range" min="100" max="1000" step="50" v-model="quantity" class="games__slider">
                        <p class="games__quantity" style="margin: 0; padding-left: 20px;">{{ quantity }}</p>
                    </div>
                    <div class="form__color">
                        <label>Цвет</label>
                        <select name="" class="form__select" v-model="color">
                            <option value="both" selected>Оба цвета</option>
                            <option value="white">Белые</option>
                            <option value="black">Черные</option>
                        </select>
                    </div>
                    <button class="pagination__button" @click="buttonClickHandle">{{ isLoading ? 'Пожалуйста, подождите' : 'Загрузить' }}</button>
                    <div v-if="isError">Пользователь с таким именем не найден</div>
                </div>
                <!-- Форма удаления игр по никнейму -->
                <div class="delete__form" v-if="isDeleteFormShow">
                    <p>Удалить игры по имени пользователя</p>
                    <select name="" id="" v-model="gameNickname" style="padding: 5px;">
                        <option v-for="(nickname, index) in gameNicknames" :key="index" :value="nickname">{{ nickname }}</option>
                    </select>
                    <button class="pagination__button" @click="deleteFormHandle">Удалить</button>
                </div>
            </div>

            <table class="games__table">
                <thead class="games__thead">
                    <tr class="games__row">
                        <th class="games__item games__item--index">№</th>
                        <th class="games__item">Результат</th>
                        <th class="games__item">Контроль</th>
                        <th class="games__item">Ссылка на игру</th>
                        <th class="games__item">Статус анализа</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="games__row" v-for="(game, index) in games" :key="game.id">
                        <td class="games__item">{{ (index + 1) + (pageSize * (page - 1)) }}</td>
                        <td class="games__item">{{ game.winner == game.side ? 'Победа' : "Поражение" }}</td>
                        <td class="games__item">{{ game.speed }}</td>
                        <td class="games__item"><a target="_blank" :href="`https://lichess.org/${game.gameID}`" class="games__link">Ссылка на игру</a></td>
                        <td class="games__item games__item--status" :class="{'games__item--true-status': game.isAnalyzed, 'games__item--false-status': !game.isAnalyzed}">{{ game.isAnalyzed ? '+' : '-' }}</td>
                    </tr>
                </tbody>
            </table>

            <div class="games__pagination">
                <button :disabled="page === 1" @click="previousPage" class="pagination__button">Назад</button>
                <div class="pagination__pages">
                    <input type="number" v-model="page" :min="1" :max="totalPages" @change="onInputChange" class="pagination__input">
                    <p>/</p>
                    <p>{{ totalPages }}</p>
                </div>
                <button :disabled="page === totalPages" @click="nextPage" class="pagination__button">Вперёд</button>
                <button class="analyze-button" @click="startAnalysis">{{ isAnalyseProgress ? 'Пожалуйста, подождите' : 'Начать анализ' }}</button>
            </div>
        </div>
    </div>
</template>

<script setup>
    import Header from '@/components/Header.vue';
    import { onMounted, ref, watch } from 'vue';

    const games = ref()
    const page = ref(1)
    const pageSize = ref(15)
    const totalPages = ref(1)
    const totalGames = ref(0)
    const totalUnanalyzedGames = ref(0)
    const isFormShow = ref(false)
    const isDeleteFormShow = ref(false)
    const quantity = ref(200)
    const progress = ref(0)
    const color = ref('both')
    const nickname = ref('')
    const errorMessage = ref('')
    const isError = ref(false)
    const isLoading = ref(false)
    const gameNicknames = ref([])
    const gameNickname = ref('')
    const isAnalyseProgress = ref(false)

    onMounted(() => {
        fetchGames()
        getUniqNicknames()
    })

    const fetchGames = async () => {
        if (page.value > 0) {
            try {
                const response = await fetch('http://localhost:5000/games/get', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                    },
                    body: JSON.stringify({
                        page: page.value,
                        pageSize: pageSize.value,
                    }),
                })
                const data = await response.json()
                if (data.games) {
                    games.value = data.games
                    if (data.games.length < 15) {
                        const diff = 15 - data.games.length
                        for (let j = 0; j < diff; j++) {
                            games.value.push({
                                id: 0,
                                winner: '',
                                speed: '',
                                isAnalyzed: ''
                            })
                        }
                    }
                    totalPages.value = data.pagination.totalPages || 1
                    totalGames.value = data.pagination.totalGames
                    totalUnanalyzedGames.value = data.pagination.totalUnanalyzedGames
                    progress.value = ((totalGames.value - totalUnanalyzedGames.value) * 100) / totalGames.value
                }
            } catch (error) {
                console.error('Ошибка при получении игр:', error)
            }
        }
        getUniqNicknames()
    }

    // Формирование выпадающего списка уникальных никнеймов для формы удаления
    const getUniqNicknames = async () => {
        try {
            const response = await fetch('http://localhost:5000/games/usernames', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                },
            }).then(res => {
                res.json().then(js => {
                    gameNicknames.value = js
                })
            })
        } catch {

        }
    }

    const deleteFormHandle = async () => {
        try {
            const response = await fetch('http://localhost:5000/games/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                },
                body: JSON.stringify({
                        nickname: gameNickname.value,
                    }),
            }).then(res => {
                console.log(res)
                if (res.status == 200) {
                    isDeleteFormShow.value = false
                    fetchGames()
                    getUniqNicknames()
                }
            })
        } catch {

        }
    }

    // Отправка на сервер запроса для загрузки игр
    const buttonClickHandle = async () => {
        isLoading.value = true
        try {
            const response = fetch('http://localhost:5000/games/fetch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                },
                body: JSON.stringify({
                    nickname: nickname.value,
                    quantity: quantity.value,
                    color: color.value
                }),
            }).then(res => {
                console.log(res.status)
                        isLoading.value = false
                if (res.status == 500) {
                    isError.value = true
                    setTimeout(() => {
                        isError.value = false
                    }, 3000)
                } else {
                    isFormShow.value = false
                    fetchGames()
                }
            })
        } catch {

        }
    }

    const showDeleteForm = () => {
        isDeleteFormShow.value = !isDeleteFormShow.value
        isFormShow.value = false
    }

    // Отправка запроса на сервер для старта анализа
    const startAnalysis = async () => {
        isAnalyseProgress.value = true
        try {
            const interval = setInterval(() => {
                fetchGames()
            }, 1000) // Костыль, заменяющий соединение по вебсокету для отслеживания прогресса анализа, нужно переделать
            const response = fetch('http://localhost:5000/games/analyse', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                },
            }).then(res => {
                console.log(res)
                clearInterval(interval)
                fetchGames()
                isAnalyseProgress.value = false
            })
        } catch {
            clearInterval(interval)
            fetchGames()
            isAnalyseProgress.value = false
        }
    }

    const onInputChange = () => {
        if(page.value < 1) {
            page.value = 1
        } else if (page.value > totalPages.value) {
            page.value = totalPages.value
        }
    }

    const nextPage = () => {
        if (page.value < totalPages.value) {
            page.value = page.value + 1
        }
    }

    const previousPage = () => {
        if (page.value > 1) {
            page.value = page.value - 1
        }
    }

    const addButtonClickHandler = () => {
        isFormShow.value = !isFormShow.value
        isDeleteFormShow.value = false
    }

    watch(page, fetchGames)

</script>

<style scoped>
    .games {
        width: 60%;
        margin: 0 auto;
    }

    .games__upload {
        align-items: center;
        display: flex;
        flex-direction: row;
        width: 100%;
        margin: 0 auto;
        justify-content: space-between;
        margin-bottom: 20px;
        position: relative;
    }

    .games__stats {
        display: flex;
        flex-direction: row;
        gap: 20px;
    }

    
    .games__form {
        position: absolute;
        background-color: white;
        display: flex;
        flex-direction: column;
        border: 1px solid rgb(126, 126, 126);
        padding: 30px;
        border-radius: 5px;
        right: 0;
        top: 70px;
        gap: 20px;
    }

    .delete__form {
        position: absolute;
        background-color: white;
        display: flex;
        flex-direction: column;
        border: 1px solid rgb(126, 126, 126);
        padding: 30px;
        border-radius: 5px;
        right: 0;
        top: 70px;
        gap: 20px;
    }

    .form__color {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .form__select {
        padding: 5px;
        margin-left: 15px;
    }

    .games__slider {
        accent-color: var(--accent-color-light);
    }

    .games__quantity {
        width: 50px;
    }

    .games__table {
        margin: 0 auto;
        width: 100%;
        border-spacing: 0;
    }

    .games__item {
        text-align: left;
    }

    .games__thead {
        background-color: var(--accent-color-light);
        color: white;
    }

    .games__item--index {
        width: 50px;
    }

    .games__item {
        padding: 10px;
        text-align: center;
        border-bottom: 1px solid rgb(173, 173, 173);
    }

    .games__link {
        color: var(--accent-color-light);
    }

    .games__pagination {
        display: flex;
        margin: 0 auto;
        flex-direction: row;
        justify-content: center;
        margin-top: 20px;
        gap: 30px;
        position: relative;
        align-items: center;
    }

    .pagination__pages {
        display: flex;
        flex-direction: row;
        align-items: center;
        height: 40px;
    }

    .pagination__input {
        width: 40px;
        border: 1px solid rgb(182, 182, 182);
        border-radius: 3px;
    }

    .pagination__button {
        background-color: var(--accent-color-light);
        color: white;
        border-radius: 5px;
        border: none;
        padding: 10px;
        cursor: pointer;
        transition: 0.5s;
    }

    .pagination__button:hover {
        background-color: var(--accent-color-dark);
    }

    .games__button {
        width: 50px;
        height: 50px;
        border: 0;
        border-radius: 100%;
        background-color: var(--accent-color-light);
        color: white;
        font-size: 2rem;
        font-weight: 600;
        cursor: pointer;
        transition: 0.5s;
    }

    .games__button:hover {
        background-color: var(--accent-color-dark);
    }

    .games__button--rotate {
        transform: rotate(45deg);
    }

    .analyze-button {
        font-size: 1.5rem;
        position: absolute;
        right: 0;
        background-color: var(--accent-color-light);
        color: white;
        padding: 10px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    .progress-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
    }

    .side-number {
        font-size: 1rem;
        text-align: center;
    }

    .circular-progress {
        width: 80px;
        height: 80px;
    }

    .circular-chart {
        display: block;
        max-width: 100%;
        max-height: 100%;
    }

    .circle-bg {
        fill: none;
        stroke: rgb(218, 218, 218);
        stroke-width: 3.8;
    }

    .circle {
        fill: none;
        stroke: var(--accent-color-light);
        stroke-width: 2.8;
        stroke-linecap: round;
        transform: rotate(-90deg);
        transform-origin: center;
        transition: stroke-dasharray 0.6s ease;
    }

    .percentage {
        font-size: 0.5em;
        text-anchor: middle;
        z-index: -1;
    }

    .games__item--status {
        font-size: 2rem;
        font-weight: 500;
        padding: 0;
    }

    .games__item--true-status {
        color: #32a523;
    }

    .games__item--false-status {
        color: #da1515;
    }

    .delete-games__button {
        background-color: var(--accent-color-light);
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        cursor: pointer;
        transition: 0.5s;
    }

    .trashcan {
        width: 30px;
    }

    .delete-games__button:hover {
        background-color: var(--accent-color-dark);
    }
</style>