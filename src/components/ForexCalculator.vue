<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRatesStore } from '../stores/rates'
import { storeToRefs } from 'pinia'
import { ArrowsRightLeftIcon } from '@heroicons/vue/24/solid'
import CurrencySelect from './CurrencySelect.vue'
import cc from 'currency-codes'

import okLogo from '../assets/ok_supermarket.svg'
import pnpLogo from '../assets/pick_n_pay.svg'
import saiMartLogo from '../assets/sai_mart.svg'
import liquidHomeLogo from '../assets/liquid_home.svg'

const ratesStore = useRatesStore()
const { availableCurrencies, loading, error, lastUpdated, zigCashRate, businessRates } = storeToRefs(ratesStore)

const amount = ref(1)
const currencyA = ref('USD')
const currencyB = ref('ZiG')
const lastChanged = ref('A')

// Ensure one side is always ZiG
watch(currencyA, (newVal) => {
  if (newVal !== 'ZiG' && currencyB.value !== 'ZiG') {
    currencyB.value = 'ZiG'
  }
  calculate()
})

watch(currencyB, (newVal) => {
  if (newVal !== 'ZiG' && currencyA.value !== 'ZiG') {
    currencyA.value = 'ZiG'
  }
  calculate()
})

// Fix initial load zero result
watch(lastUpdated, () => {
  calculate()
})

const result = ref(0)

const calculate = () => {
  result.value = ratesStore.convert(amount.value, currencyA.value, currencyB.value)
}

watch(amount, calculate)

const swap = () => {
  const temp = currencyA.value
  currencyA.value = currencyB.value
  currencyB.value = temp
  calculate()
}

const formattedResult = computed(() => {
  const isZiG = currencyB.value === 'ZiG'
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currencyB.value,
    minimumFractionDigits: isZiG ? 0 : 2,
    maximumFractionDigits: isZiG ? 0 : 4
  }).format(result.value)
})

const currentRate = computed(() => {
  const rate = ratesStore.convert(1, currencyA.value, currencyB.value)
  const decimals = currencyB.value === 'ZiG' ? 0 : 4
  return `1.00 ${currencyA.value} = ${rate.toFixed(decimals)} ${currencyB.value}`
})

const dynamicRateText = computed(() => {
  const formattedAmount = new Intl.NumberFormat('en-US').format(amount.value)
  if (currencyB.value === 'ZiG') {
    // Foreign -> ZiG
    // "How much ZiG for 10 US Dollars" (Plural if amount != 1)
    return `How much ZiG for ${formattedAmount} ${getCurrencyName(currencyA.value, amount.value)}`
  } else {
    // ZiG -> Foreign
    // "How much US Dollars 100 ZiG gets you" (Always Plural)
    return `How much ${getCurrencyName(currencyB.value, 1, true)} ${formattedAmount} ZiG gets you`
  }
})

const cashValueDisplay = computed(() => {
  if (!zigCashRate.value) return 'N/A'
  
  // Determine the foreign amount
  let foreignAmount = 0
  if (currencyA.value !== 'ZiG') {
    foreignAmount = amount.value
  } else {
    foreignAmount = result.value
  }

  // Calculate Cash Value in ZiG
  // Assuming Cash Rate is ZiG per 1 USD (or equivalent foreign unit normalized)
  // But zigCashRate is likely based on USD.
  // If foreign is NOT USD, we might need to convert foreign to USD first?
  // The store's zigCashRate is just a number (e.g. 40).
  // Let's assume it's ZiG per USD.
  
  // We need the USD value of the foreign amount.
  // ratesStore.convert(foreignAmount, foreignCurrency, 'USD')
  
  const foreignCurrency = currencyA.value !== 'ZiG' ? currencyA.value : currencyB.value
  const usdValue = ratesStore.convert(foreignAmount, foreignCurrency, 'USD')
  
  const cashValue = usdValue * zigCashRate.value
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZiG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(cashValue)
})

const getCurrencyName = (code, count = 1, forcePlural = false) => {
  if (code === 'ZiG') return 'Zimbabwe Gold'
  
  const currency = cc.code(code)
  let name = currency ? currency.currency : code
  
  // Pluralize if forcePlural is true OR count is not 1
  if ((forcePlural || count != 1) && !name.endsWith('s')) {
    name += 's'
  }
  
  return name
}


const getBusinessLogo = (name) => {
  const n = name.toLowerCase()
  if (n.includes('ok')) return okLogo
  if (n.includes('pick')) return pnpLogo
  if (n.includes('sai')) return saiMartLogo
  if (n.includes('liquid')) return liquidHomeLogo
  return null
}

const businessRatesTableData = computed(() => {
  if (!businessRates.value.length) return []
  
  const foreignCurrency = currencyA.value === 'ZiG' ? currencyB.value : currencyA.value
  const foreignAmount = currencyA.value === 'ZiG' ? result.value : amount.value
  
  // Get USD value of 1 unit of foreign currency
  const usdPerUnit = ratesStore.convert(1, foreignCurrency, 'USD')
  
  return businessRates.value.map(shop => {
    const impliedRate = shop.rate * usdPerUnit
    const totalValue = foreignAmount * impliedRate
    
    return {
      name: shop.name,
      rateDisplay: `1 ${foreignCurrency} = ${impliedRate.toFixed(2)}`,
      valueDisplay: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ZiG',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(totalValue)
    }
  })
})

onMounted(() => {
  ratesStore.fetchRates()
})
</script>

<template>
  <div class="w-full max-w-5xl mx-auto px-4 py-8">
    <!-- Header Section -->
    <div class="text-center mb-10">
      <h1 class="text-3xl md:text-5xl font-bold text-gray-800 mb-3 tracking-tight">
        {{ amount }} {{ currencyA }} to {{ currencyB }}
      </h1>
      <p class="text-gray-500 text-lg md:text-xl font-medium opacity-90">
        {{ dynamicRateText }}
      </p>
    </div>

    <!-- Main Card -->
    <div class="bg-white rounded-[2rem] shadow-2xl p-6 md:p-10 relative z-10 border border-white/50 backdrop-blur-sm">
      
      <div v-if="loading" class="flex justify-center py-16">
        <span class="loading loading-spinner loading-lg text-orange-500"></span>
      </div>

      <div v-else-if="error" class="alert alert-error mb-6 shadow-md rounded-xl">
        <span>{{ error }}</span>
        <button class="btn btn-sm btn-ghost" @click="ratesStore.fetchRates()">Retry</button>
      </div>

      <div v-else>
        <!-- Converter Row -->
        <div class="flex flex-col md:flex-row items-center gap-4 mb-10 relative">
          
          <!-- From Box -->
          <div class="w-full relative group">
            <label class="label pt-0 pb-2 px-1">
              <span class="label-text font-bold text-gray-500 text-sm uppercase tracking-wide">Amount</span>
            </label>
            <div class="flex items-center border-2 border-gray-200 rounded-2xl hover:border-orange-500 transition-all duration-300 bg-white p-1 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 shadow-sm group-hover:shadow-md relative">
              <input 
                type="number" 
                v-model="amount" 
                class="input input-ghost w-full text-3xl font-bold text-gray-800 focus:outline-none focus:bg-transparent h-16 placeholder:text-gray-300 pl-5" 
                placeholder="0.00"
              />
              <div class="divider divider-horizontal m-0 h-10 self-center opacity-50"></div>
              <CurrencySelect 
                v-model="currencyA" 
                :currencies="availableCurrencies.filter(c => c !== currencyB)"
                :disabled="currencyA === 'ZiG'"
              />
            </div>
          </div>

          <!-- Swap Button -->
          <div class="mt-8 md:mt-8 shrink-0 z-20">
            <button 
              @click="swap" 
              class="btn btn-circle btn-lg bg-white border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 text-orange-500 shadow-md hover:shadow-lg hover:rotate-180 transition-all duration-500"
            >
              <ArrowsRightLeftIcon class="w-7 h-7" />
            </button>
          </div>

          <!-- To Box -->
          <div class="w-full relative group">
            <label class="label pt-0 pb-2 px-1">
              <span class="label-text font-bold text-gray-500 text-sm uppercase tracking-wide">Converted to</span>
            </label>
            <div class="flex items-center border-2 border-gray-200 rounded-2xl hover:border-orange-500 transition-all duration-300 bg-gray-50 p-1 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 shadow-sm group-hover:shadow-md">
              <div class="w-full text-3xl font-bold text-gray-800 px-5 h-16 flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
                {{ formattedResult }}
              </div>
              <div class="divider divider-horizontal m-0 h-10 self-center opacity-50"></div>
              <CurrencySelect 
                v-model="currencyB" 
                :currencies="availableCurrencies.filter(c => c !== currencyA)"
                :disabled="currencyB === 'ZiG'"
              />
            </div>
          </div>

        </div>

        <!-- Info & Actions Row -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pt-4">
          
          <!-- Rate Info -->
          <div class="space-y-2">
            <p class="text-2xl font-bold text-gray-800 tracking-tight">
              {{ currentRate }}
            </p>
            <div class="flex items-center gap-2 text-sm text-orange-600 font-medium">
               <span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">Live</span>
               <span>Mid-market rate</span>
               <span class="text-orange-400">•</span>
               <span>Updated: {{ lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...' }}</span>
            </div>
          </div>

          <!-- Cash Rate Display -->
          <div class="w-full md:w-auto">
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-4 px-6 shadow-lg shadow-gray-300 flex items-center gap-4 transform transition-transform hover:scale-105">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Cash Value</span>
                <span class="text-2xl font-bold text-orange-400">{{ cashValueDisplay }}</span>
              </div>
              <div class="h-8 w-px bg-gray-600"></div>
              <div class="text-sm font-medium text-gray-300 leading-tight">
                Exchange Rate<br>Value
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    
    <!-- Footer Note -->
    <p class="text-center text-orange-500 mt-8 text-sm font-medium">
      This is for informational purposes only.
    </p>

    <!-- Business Rates Table -->
    <div v-if="businessRatesTableData.length > 0" class="mt-16">
      <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Live Business Rates</h2>
      <div class="overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-white">
        <table class="table w-full">
          <!-- head -->
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th class="py-4 pl-6">Business</th>
              <th class="py-4 text-right">Rate</th>
              <th class="py-4 pr-6 text-right">Value</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(item, index) in businessRatesTableData" :key="index" class="hover:bg-orange-50/50 transition-colors">
              <td class="py-4 pl-6 font-bold text-gray-700 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center overflow-hidden p-1 shadow-sm">
                  <img 
                    v-if="getBusinessLogo(item.name)" 
                    :src="getBusinessLogo(item.name)" 
                    :alt="item.name" 
                    class="w-full h-full object-contain"
                  />
                  <span v-else class="text-xs font-bold text-gray-400">{{ item.name.charAt(0) }}</span>
                </div>
                {{ item.name }}
              </td>
              <td class="py-4 text-right font-medium text-gray-600">
                {{ item.rateDisplay }}
              </td>
              <td class="py-4 pr-6 text-right font-bold text-gray-800 text-lg">
                {{ item.valueDisplay }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Remove spinner from number input */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
</style>
