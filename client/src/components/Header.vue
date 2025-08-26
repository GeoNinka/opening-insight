<template>
    <header class="header">

        <div>
            <ul class="header__navigation-list">
                <li class="header__navigation-item-wrapper">
                    <RouterLink class="header__navigation-item" to="/">Главная</RouterLink>
                    <div class="header__navigation-underline"></div>
                </li>
                <li class="header__navigation-item-wrapper">
                    <RouterLink class="header__navigation-item" to="games">Загрузить партии</RouterLink>
                    <div class="header__navigation-underline"></div>
                </li>
                <li class="header__navigation-item-wrapper">
                    <RouterLink class="header__navigation-item" to="analysis">Анализ партий</RouterLink>
                    <div class="header__navigation-underline"></div>
                </li>
                <li class="header__navigation-item-wrapper">
                    <RouterLink class="header__navigation-item" to="theory">База дебютов</RouterLink>
                    <div class="header__navigation-underline"></div>
                </li>
                <!-- <li class="header__navigation-item-wrapper">
                    <RouterLink class="header__navigation-item" to="theory">О приложении</RouterLink>
                    <div class="header__navigation-underline"></div>
                </li> -->
            </ul>
        </div>

        <div class="header__auth">
            <div v-if="!isAuthorized" class="header__auth-wrapper">
                <div class="header__navigation-item-wrapper">
                    <button class="header__navigation-item" @click="toggleMenu">Войти</button>
                    <div class="header__navigation-underline"></div>
                </div>
                <div class="header__navigation-item-wrapper">
                    <button class="header__navigation-item" @click="toggleMenuReg">Регистрация</button>
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
                        <button class="form__toggle-button" :class="{'form__toggle-button--active': !isFormTranslate}" @click="untranslateForm">
                            Войти
                        </button>
                        <button class="form__toggle-button" :class="{'form__toggle-button--active': isFormTranslate}" @click="translateForm">
                            Зарегистрироваться
                        </button>
                    </div>
                    <div class="form__wrapper">
                        <form @submit.prevent="submitLoginForm" method="post" class="form" :class="{'form--translate': isFormTranslate}">
                            <div class="form--login">
                                <div class="form__pair">
                                    <label class="form__label">Электронная почта</label>
                                    <input class="form__input" type="text" v-model="email" />
                                </div>
                                <div class="form__pair">
                                    <label class="form__label">Пароль</label>
                                    <input class="form__input" type="password" v-model="password" />
                                </div>
                            </div>
                            <button type="submit" class="form__button">
                                Войти
                            </button>
                        </form>
                        <form @submit.prevent="submitRegistrationForm" method="post" class="form" :class="{'form--translate': isFormTranslate}">
                            <div>
                                <div class="form__pair">
                                    <label class="form__label">Электронная почта</label>
                                    <input class="form__input" type="text" v-model="emailReg" />
                                </div>                                <div class="form__pair">
                                    <label class="form__label">Логин</label>
                                    <input class="form__input" type="text" v-model="nameReg" />
                                </div>                                
                                <div class="form__pair">
                                    <label class="form__label">Пароль</label>
                                    <input class="form__input" type="password" v-model="passwordReg" />
                                </div>                                <div class="form__pair">
                                    <label class="form__label">Подтверждение пароля</label>
                                    <input class="form__input" type="password" v-model="confirmPassowrdReg" />
                                </div>
                            </div>
                            <button type="submit" class="form__button">
                                Зарегистрироваться
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

    let emailReg = ref('')
    let nameReg = ref('')
    let passwordReg = ref('')
    let confirmPassowrdReg = ref('')

    let isAuthorized = ref(false)
    let userName = ref()

    let isFormTranslate = ref(false)

    function toggleMenu() {
        isFormTranslate.value = false
        isMenuVisible.value = !isMenuVisible.value
    }

    function toggleMenuReg() {
        isFormTranslate.value = true
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(email.value)) {
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
        } else {
            // emailError.value = ''
        }
        
    }   

    async function submitRegistrationForm() {
        
        if (passwordReg.value == confirmPassowrdReg.value) {
            const response = await fetch('http://localhost:5000/api/auth/registration', {
                method: 'POST',
                body: JSON.stringify({
                    email: emailReg.value,
                    name: nameReg.value,
                    password: passwordReg.value,
                    role: 'admin'
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            }).then(res => {
                console.log(res)
            })
        }
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
        height: 500px;
        border-radius: 10px;
        padding: 30px;
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
        margin: 0 auto;
        width: 80%;
        height: 100%;
        overflow: hidden;
    }

    .form {
        display: flex;
        flex-shrink: 0;
        flex-direction: column;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        transition: 0.5s ease-in-out;
    }

    .form__heading {
        font-size: 2rem;
        margin: 0;
        color: var(--accent-color-light);
    }

    .form__label {
        font-size: 1.5rem;
        margin-bottom: 10px;
    }

    .form__input {
        height: 40px;
        font-size: 1.2rem;
        width: 80%;
    }

    .form--translate {
        transition: 0.5s ease-in-out;
        transform: translatex(-100%);
    }

    .form__pair {
        position: relative;
        display: flex;
        flex-direction: column;
        margin: 0 auto;
        align-items: center;
        margin-top: 10px;
    }

    .form__button {
        padding: 25px;
        margin: 0 auto;
        width: 80%;
        font-size: 1.2rem;
        color: white;
        background-color: var(--accent-color-light);
        cursor: pointer;
        border: none;
        border-radius: 5px;
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

    .form__toggler {
        margin: 0 auto;
        display: flex;
        width: 60%;
        justify-content: space-around;
    }

    .form__toggle-button {
        background: none;
        border: none;
        font-size: 1.1rem;
        cursor: pointer;
    }

    .form__toggle-button--active {
        color: var(--accent-color-light);
    }

    .form--login {
        margin-top: 70px;
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