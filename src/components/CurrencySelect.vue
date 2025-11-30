<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  currencies: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')
const dropdownRef = ref(null)

import cc from 'currency-codes'

// ... (props and emits remain same)

// Map currency codes to country codes for flags
const getFlagClass = (currency) => {
  // Manual overrides for common currencies or where code != country
  const map = {
    USD: 'us',
    ZiG: 'zw',
    EUR: 'eu',
    GBP: 'gb',
    ZAR: 'za',
    BWP: 'bw',
    CNY: 'cn',
    JPY: 'jp',
    AUD: 'au',
    CAD: 'ca',
    CHF: 'ch',
    INR: 'in',
    RUB: 'ru',
    BRL: 'br',
    AED: 'ae',
    AFN: 'af',
    ALL: 'al',
    AMD: 'am',
    ANG: 'nl', // Dutch Guilder -> Netherlands (approx)
    AOA: 'ao',
    ARS: 'ar',
    ZMW: 'zm',
    MZN: 'mz',
    NAD: 'na',
    NZD: 'nz',
  }
  if (map[currency]) return `fi fi-${map[currency]}`
  
  // Try to guess from currency code (first 2 chars usually work)
  return `fi fi-${currency.slice(0, 2).toLowerCase()}`
}

const getCurrencyName = (code) => {
  if (code === 'ZiG') return 'Zimbabwe Gold'
  const currency = cc.code(code)
  return currency ? currency.currency : code
}

const popularCodes = ['USD', 'AUD', 'AED', 'ZAR', 'GBP', 'EUR', 'ZMW', 'NZD', 'CNY', 'JPY', 'MZN', 'BWP', 'NAD', 'CAD']

const groupedCurrencies = computed(() => {
  let list = props.currencies
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(c => 
      c.toLowerCase().includes(query) || 
      getCurrencyName(c).toLowerCase().includes(query)
    )
  }

  const popular = []
  const others = []

  list.forEach(c => {
    if (popularCodes.includes(c)) {
      popular.push(c)
    } else {
      others.push(c)
    }
  })

  // Sort popular by index in popularCodes to maintain desired order
  popular.sort((a, b) => popularCodes.indexOf(a) - popularCodes.indexOf(b))
  
  // Sort others alphabetically
  others.sort()

  return { popular, others }
})

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    // Focus search input next tick?
  }
}

const selectCurrency = (currency) => {
  emit('update:modelValue', currency)
  isOpen.value = false
}

const closeDropdown = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <!-- Trigger -->
    <div 
      @click="toggleDropdown"
      class="flex items-center gap-2 cursor-pointer h-14 px-3 hover:bg-gray-50 transition-colors rounded-r-xl select-none"
      :class="{ 'cursor-default hover:bg-transparent': disabled }"
    >
      <span :class="getFlagClass(modelValue)" class="text-xl rounded-sm shadow-sm shrink-0"></span>
      <div class="flex flex-col leading-tight">
        <span class="font-bold text-gray-800 text-lg">{{ modelValue }}</span>
        <span class="text-xs text-gray-500 font-medium truncate max-w-[100px] md:max-w-[140px]">
          {{ getCurrencyName(modelValue) }}
        </span>
      </div>
      <ChevronDownIcon 
        v-if="!disabled" 
        class="w-5 h-5 text-gray-400 ml-1 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </div>

    <!-- Dropdown -->
    <div 
      v-if="isOpen" 
      class="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-96"
    >
      <!-- Search -->
      <div class="p-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div class="relative">
          <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search currencies..." 
            class="input input-sm input-bordered w-full pl-10 bg-gray-50 focus:bg-white transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            autofocus
          />
        </div>
      </div>

      <!-- List -->
      <div class="overflow-y-auto flex-1 p-1">
        
        <!-- Popular Section -->
        <div v-if="groupedCurrencies.popular.length > 0">
          <div class="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Popular</div>
          <div 
            v-for="currency in groupedCurrencies.popular" 
            :key="currency"
            @click="selectCurrency(currency)"
            class="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors"
            :class="{ 'bg-orange-50': currency === modelValue }"
          >
            <span :class="getFlagClass(currency)" class="text-xl rounded-sm shadow-sm shrink-0"></span>
            <div class="flex flex-col leading-tight">
              <span class="font-bold text-gray-800">{{ currency }}</span>
              <span class="text-xs text-gray-500">{{ getCurrencyName(currency) }}</span>
            </div>
          </div>
          <div class="h-px bg-gray-100 my-1 mx-3"></div>
        </div>

        <!-- Others Section -->
        <div v-if="groupedCurrencies.others.length > 0">
          <div v-if="groupedCurrencies.popular.length > 0" class="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">All Currencies</div>
          <div 
            v-for="currency in groupedCurrencies.others" 
            :key="currency"
            @click="selectCurrency(currency)"
            class="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors"
            :class="{ 'bg-orange-50': currency === modelValue }"
          >
            <span :class="getFlagClass(currency)" class="text-xl rounded-sm shadow-sm shrink-0"></span>
            <div class="flex flex-col leading-tight">
              <span class="font-bold text-gray-800">{{ currency }}</span>
              <span class="text-xs text-gray-500">{{ getCurrencyName(currency) }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="groupedCurrencies.popular.length === 0 && groupedCurrencies.others.length === 0" class="p-4 text-center text-gray-400 text-sm">
          No currencies found
        </div>
      </div>
    </div>
  </div>
</template>
