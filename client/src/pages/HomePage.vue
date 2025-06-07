<template>
    <div class="main">
        <Header />
        <div class="main__heading-wrapper">
            <h1 class="main__heading">OPENING <br> INSIGHT.</h1>
        </div>
        <div class="main__grid">
            <div class="main__grid-item main__grid-item--gallery">
                
            </div>
            <div class="main__grid-item main__grid-item--text">
                <p class="main__grid-text">
                    Opening Insight — бесплатный сервис для анализа шахматных партий и выявления ваших самых частых дебютных ошибок. Узнайте о слабых местах своей дебютной подготовки до того, как это сделают ваши противники. 
                </p>
            </div>
            <div class="main__grid-item main__grid-item--button">
                <RouterLink class="main__grid-button" to="games">
                    Начать
                </RouterLink>
                <svg class="main__arrow" width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.81191 14.4892L9.16604 16.8452L18.5227 8.50005L9.16604 0.155839L6.81191 2.51188L10.8504 6.54171L0.833329 6.54171L0.833329 10.4584L10.8513 10.4584L6.81191 14.4892Z" fill="white"/>
                </svg>
            </div>
        </div>
    </div>
</template>

<script setup>
    import Header from '../components/Header.vue';
    
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
    }

    .main__grid-item--text {
        grid-area: text;
        font-size: 2rem;
        /* padding: 2rem; */
        display: flex;
        /* width: 70%; */
        align-items: end;
        border: none;
        /* text-align: center; */
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
