<template>
    <header class="header">

        <div>
            <ul class="header__navigation-list">
                <!-- <li class="header__navigation-item-wrapper">
                    <RouterLink class="header__navigation-item" to="/">
                        <img src="../../public/icons/logo.svg" class="header__logo" alt="">
                    </RouterLink>
                </li> -->
                <li class="header__navigation-item-wrapper">
                    <RouterLink class="header__navigation-item" to="/">Главная</RouterLink>
                    <div class="header__navigation-underline"></div>
                </li>
                <li class="header__navigation-item-wrapper">
                    <RouterLink class="header__navigation-item" to="">Загрузить партии</RouterLink>
                    <div class="header__navigation-underline"></div>
                </li>
                <li class="header__navigation-item-wrapper">
                    <RouterLink class="header__navigation-item" to="theory">Анализ партий</RouterLink>
                    <div class="header__navigation-underline"></div>
                </li>
                <li class="header__navigation-item-wrapper">
                    <RouterLink class="header__navigation-item" to="theory">База дебютов</RouterLink>
                    <div class="header__navigation-underline"></div>
                </li>
                <li class="header__navigation-item-wrapper">
                    <RouterLink class="header__navigation-item" to="theory">О приложении</RouterLink>
                    <div class="header__navigation-underline"></div>
                </li>
            </ul>
        </div>

        <div class="header__auth">
            <div v-if="!isAuthorized" class="header__auth-wrapper">
                <div class="header__navigation-item-wrapper">
                    <button class="header__navigation-item" @click="toggleMenu">Войти</button>
                    <div class="header__navigation-underline"></div>
                </div>
                <div class="header__navigation-item-wrapper">
                    <button class="header__navigation-item" @click="toggleMenu">Регистрация</button>
                    <div class="header__navigation-underline"></div>
                </div>
            </div>
            <div v-if="isAuthorized" class="header__auth-wrapper">
                <div class="header__navigation-item-wrapper">
                    <button class="header__navigation-item" @click="toggleMenu">{{ userName }}</button>
                    <div class="header__navigation-underline"></div>
                </div>
                <div class="header__navigation-item-wrapper">
                    <button class="header__navigation-item" @click="logOut">Выйти</button>
                    <div class="header__navigation-underline"></div>
                </div>
            </div>

            <div v-if="isMenuVisible" class="header__form-wrapper" @click="toggleMenu">
                <div @click="handleFormClick" class="header__form">
                    <button @click="toggleMenu" class="form__close-button">X</button>
                    <div class="form__toggler">
                        <button @click="untranslateForm">
                            Войти
                        </button>
                        <button @click="translateForm">
                            Зарегистрироваться
                        </button>
                    </div>
                    <div class="form__wrapper">
                        <form @submit.prevent="submitLoginForm" method="post" class="form" :class="{'form--translate': isFormTranslate}">
                            <p class="form__heading">
                                Войти в аккаунт
                            </p>
                            <div class="form__pair">
                                <label>Email</label>
                                <input type="text" v-model="email" />
                            </div>
                            <div class="form__pair">
                                <label>Password</label>
                                <input type="password" v-model="password" />
                            </div>
                            <button type="submit" class="form__button">
                                Отправить
                            </button>
                        </form>
                        <form @submit.prevent="submitRegistrationForm" method="post" class="form" :class="{'form--translate': isFormTranslate}">
                            <p class="form__heading">
                                Создать аккаунт
                            </p>
                            <button type="submit" class="form__button">
                                Отправить
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </header>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    let isMenuVisible = ref(false)
    let email = ref('admin@admin.ru')
    let password = ref('password')

    let isAuthorized = ref(false)
    let userName = ref()

    let isFormTranslate = ref(false)

    function toggleMenu() {
        isMenuVisible.value = !isMenuVisible.value
    }

    function handleFormClick(e) {
        e.stopPropagation()
    }

    function translateForm() {
        isFormTranslate.value = true
    }

    function untranslateForm() {
        isFormTranslate.value = false
    }

    async function submitLoginForm() {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: email.value,
                password: password.value
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(res => {
            if (res.status == 200) {
                res.json().then(json => {
                    localStorage.setItem('jwtToken', json.token)
                    isMenuVisible.value = false
                    location.reload()
                })
            }
            
        })
    }   

    async function getUsername() {
        if (localStorage.getItem('jwtToken')) {
            const response = await fetch('http://localhost:5000/user/profile', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                }
            }).then(resp => resp.json()).then(user => {
                isAuthorized.value = true
                userName.value = user.name
            })
        }
    }

    function logOut() {
        localStorage.removeItem('jwtToken')
        isAuthorized.value = false
        userName.value = undefined
        location.reload()
    }

    onMounted(() => {
        getUsername()
    })

</script>

<style scoped>
    .header {
        display: flex;
        width: 100%;
        justify-content: space-between;
        align-items: center;
        width: 90%;
        margin: 0 auto;
        height: 10vh;
    }

    .header__logo {
        height: 40px;
        padding: 20px;
    }

    .header__navigation-list {
        display: flex;
        flex-direction: row;
        list-style: none;    
        padding-left: 0;
        align-items: center;
        gap: 40px;
        margin: 0;
    }

    .header__navigation-item-wrapper {
        position: relative;
        /* margin-left: 10px; */
    }

    .header__navigation-item {
        text-decoration: none;
        cursor: pointer;
        color: black;
        padding: 0;
        border: none;
        background-color: white;

        font-size: 1.1rem;
        font-weight: 500;
        font-family: 'Inter';
    }

    .header__navigation-underline {
        position: absolute;
        width: 0%;
        height: 0px;
        background-color: var(--accent-color-light);
        height: 2px;
        transition: 0.3s ease;
        z-index: 1;
    }

    .header__navigation-item:hover+div {
        transition: 0.3s;
        width: 20px;
    }

    .header__form-wrapper {
        z-index: 10;
        width: 100%;
        height: 100vh;
        position: absolute;
        left: 0;
        top: 0;
        backdrop-filter: brightness(60%);
        display: flex;
        align-items: center;
        align-content: center;
        /* animation: Appearance 0.2s; */
    }

    .header__form {
        background-color: var(--main-light);
        width: min(600px, 60%);
        margin: 0 auto;
        height: 600px;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .form__close-button {
        font-size: 14px;
        cursor: pointer;
        background: transparent;
        border: none;
        position: absolute;
        right: 15px;
        top: 15px;
    }

    .form__wrapper {
        display: flex;
        flex-direction: row;
        border: 1px red solid;
        margin: 0 auto;
        width: 80%;
        overflow: hidden;
    }

    .form {
        display: flex;
        flex-shrink: 0;
        flex-direction: column;
        width: 100%;
        height: 100%;
        transition: 0.5s ease-in-out;
    }

    .form--translate {
        transition: 0.5s ease-in-out;
        transform: translatex(-100%);
    }

    .form__pair {
        position: relative;
    }

    .header__auth {
        display: flex;
        flex-direction: row;
        gap: 40px;
    }

    .header__auth-wrapper {
        display: flex;
        flex-direction: row;
        gap: 20px;
    }

    @keyframes Appearance {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
</style>