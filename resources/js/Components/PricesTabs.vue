<script setup>
import { computed } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';

const page = usePage();
const currentPath = computed(() => page.url.split('?')[0]);

const tabList = [
    { href: '/preus', label: 'Apuntar preu' },
    { href: '/preus/comparativa', label: 'Comparativa' },
    { href: '/articles', label: 'Articles' },
    { href: '/botigues', label: 'Botigues' },
];
</script>

<template>
    <ul class="nav nav-tabs mb-3">
        <li v-for="tab in tabList" :key="tab.href" class="nav-item">
            <Link
                :href="tab.href"
                class="nav-link"
                :class="{ active: currentPath === tab.href }"
                :data-prices-tab="tab.href"
            >
                {{ tab.label }}
            </Link>
        </li>
    </ul>
</template>
