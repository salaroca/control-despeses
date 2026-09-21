<script setup>
import { computed } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';
import { PiggyBank, Tags, Wallet } from 'lucide-vue-next';

const page = usePage();
const currentPath = computed(() => page.url.split('?')[0]);

const navItems = [
    { href: '/despeses', label: 'Despeses', icon: Wallet },
    { href: '/categories', label: 'Categories', icon: Tags },
    { href: '/pressupostos', label: 'Pressupostos', icon: PiggyBank },
];
</script>

<template>
    <nav class="navbar navbar-expand navbar-dark bg-primary mb-4">
        <div class="container d-flex align-items-center" style="max-width: 900px;">
            <span class="navbar-brand d-flex align-items-center gap-2 mb-0">
                <Wallet :size="20" />
                Control de despeses
            </span>
            <div class="navbar-nav flex-row gap-3 ms-auto">
                <Link
                    v-for="item in navItems"
                    :key="item.href"
                    :href="item.href"
                    class="nav-link d-flex align-items-center gap-1"
                    :class="currentPath === item.href ? 'fw-bold text-white' : 'text-white-50'"
                >
                    <component :is="item.icon" :size="16" />
                    {{ item.label }}
                </Link>
            </div>
        </div>
    </nav>
    <slot />
</template>
