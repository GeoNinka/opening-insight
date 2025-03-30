<template>
    <ul>
        <li v-for="item in listStore.items" :key="item">
            <element :elem="item"></element>
        </li>
    </ul>
</template>

<script>
import { useListStore } from '@/stores/list'; // путь к вашему хранилищу
import element from '@/components/element.vue'

export default {
    components: {element},
    setup() {
        const listStore = useListStore();
        return { listStore };
    },
};
</script>