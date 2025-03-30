<template>
    <button @click="changeItems">Обновить список</button>
    <Sidebar />
</template>

<script>
    import { useListStore } from '@/stores/list'; // путь к вашему хранилищу
    import Sidebar from '@/components/Sidebar.vue';

    export default {
        components: { Sidebar },
        setup() {
        const listStore = useListStore();

        const changeItems = () => {
            listStore.updateItems('GeoNinka');
        };

        return { changeItems };
        },
    };
</script>