import { defineStore } from 'pinia'

export const useRatesStore = defineStore('rates', {
    state: () => ({
        fxRates: null, // ZiG rates
        oeRates: null, // Global rates
        loading: false,
        error: null,
        lastUpdated: null,
    }),

    getters: {
        // Combine all available currencies
        availableCurrencies: (state) => {
            const currencies = ['USD', 'ZiG']
            if (state.oeRates && state.oeRates.rates && state.oeRates.rates.rates) {
                state.oeRates.rates.rates.forEach(rateObj => {
                    Object.keys(rateObj).forEach(key => {
                        if (!currencies.includes(key)) currencies.push(key)
                    })
                })
            }
            return currencies.sort()
        },

        // Helper to get rate for a specific currency against USD
        getRate: (state) => (currency) => {
            if (currency === 'USD') return 1

            // Standard Mid rate for reference
            if (currency === 'ZiG') {
                return state.fxRates?.rates?.ZiG_Mid || 0
            }

            // Check OE Rates
            if (state.oeRates && state.oeRates.rates && state.oeRates.rates.rates) {
                const rateObj = state.oeRates.rates.rates.find(r => Object.keys(r)[0] === currency)
                if (rateObj) return rateObj[currency]
            }

            return 0
        },

        // Cash rate getter
        zigCashRate: (state) => {
            return state.fxRates?.rates?.ZiG_Cash || 0
        },

        // Business rates getter
        businessRates: (state) => {
            return state.fxRates?.rates?.business_rates || []
        }
    },

    actions: {
        async fetchRates() {
            this.loading = true
            this.error = null

            try {
                // Use a fixed date or today logic as needed. 
                // User mentioned 2025-11-29 in previous context, but let's try dynamic first or fallback.
                const today = new Date().toISOString().split('T')[0]

                // Fetch in parallel
                const [fxRes, oeRes] = await Promise.all([
                    fetch(`https://api.clientemails.xyz/api/rates/fx-rates?day=${today}`),
                    fetch(`https://api.clientemails.xyz/api/rates/oe-rates/raw?day=${today}`)
                ])

                if (!fxRes.ok) throw new Error(`FX Rates API Error: ${fxRes.status}`)
                if (!oeRes.ok) throw new Error(`OE Rates API Error: ${oeRes.status}`)

                this.fxRates = await fxRes.json()
                this.oeRates = await oeRes.json()
                this.lastUpdated = new Date()

            } catch (err) {
                console.error('Failed to fetch rates:', err)
                this.error = err.message
            } finally {
                this.loading = false
            }
        },

        convert(amount, fromCurrency, toCurrency) {
            if (!amount) return 0

            // 1. Get USD value of the "From" currency
            let usdAmount = 0

            if (fromCurrency === 'USD') {
                usdAmount = amount
            } else if (fromCurrency === 'ZiG') {
                // ZiG -> Other (Buying Foreign Currency)
                // Use ZiG_BMBuy: How much ZiG to get 1 USD
                const buyRate = this.fxRates?.rates?.ZiG_BMBuy || this.getRate('ZiG')
                usdAmount = amount / buyRate
            } else {
                // Other -> USD
                const fromRate = this.getRate(fromCurrency)
                usdAmount = amount / fromRate
            }

            // 2. Convert USD to "To" currency
            if (toCurrency === 'USD') {
                return usdAmount
            } else if (toCurrency === 'ZiG') {
                // Other -> ZiG (Selling Foreign Currency)
                // Use ZiG_BMSell: How much ZiG you get for 1 USD
                const sellRate = this.fxRates?.rates?.ZiG_BMSell || this.getRate('ZiG')
                return usdAmount * sellRate
            } else {
                // USD -> Other
                const toRate = this.getRate(toCurrency)
                return usdAmount * toRate
            }
        }
    }
})
