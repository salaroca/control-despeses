<script setup>
import { computed } from 'vue';
import { Link, router, usePage } from '@inertiajs/vue3';
import { IconLogout, IconPigMoney, IconTags, IconWallet } from '@tabler/icons-vue';

const page = usePage();
const currentPath = computed(() => page.url.split('?')[0]);

const navItems = [
    { href: '/despeses', label: 'Despeses', icon: IconWallet },
    { href: '/categories', label: 'Categories', icon: IconTags },
    { href: '/pressupostos', label: 'Pressupostos', icon: IconPigMoney },
];

function logout() {
    router.post('/logout');
}
</script>

<template>
    <div class="page">
        <header class="navbar navbar-expand-md navbar-dark d-print-none bg-primary">
            <div class="container-xl">
                <Link href="/despeses" class="navbar-brand d-flex align-items-center gap-2">
                    <IconWallet :size="24" />
                    Control de despeses
                </Link>
                <div class="navbar-nav flex-row ms-auto">
                    <div v-for="item in navItems" :key="item.href" class="nav-item">
                        <Link
                            :href="item.href"
                            class="nav-link d-flex align-items-center gap-1"
                            :class="{ active: currentPath === item.href }"
                        >
                            <span class="nav-link-icon">
                                <component :is="item.icon" :size="18" />
                            </span>
                            <span class="nav-link-title">{{ item.label }}</span>
                        </Link>
                    </div>
                    <div class="nav-item">
                        <button
                            type="button"
                            class="nav-link d-flex align-items-center gap-1 btn btn-link"
                            @click="logout"
                        >
                            <span class="nav-link-icon">
                                <IconLogout :size="18" />
                            </span>
                            <span class="nav-link-title">Surt</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
        <div class="page-wrapper">
            <slot />
        </div>
    </div>
</template>
