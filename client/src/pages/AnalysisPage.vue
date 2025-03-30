<script>
    export default {
        data() {
            return {
                nickName: 'GeoNinka',
            }
        },      
        // components: {
        //     SideMenu
        // },
        methods: {
            startAnalysis() {
                fetchGames(this.nickName)
            }
        },
    }
</script>

<template>
    <div>
        Analysis Page
        <form @submit.prevent="startAnalysis">
            <input v-model="nickName" placeholder="Введите никнейм"/> 
            <button type="submit">Анализировать</button> 
        </form>
        <SideMenu />
    </div>
</template>

<style scoped>

</style>
