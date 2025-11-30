const getCurrencySymbol = (code) => {
    if (code === 'ZiG') return ''
    try {
        const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).formatToParts(1)
        const symbol = parts.find(part => part.type === 'currency').value
        return symbol
    } catch (e) {
        return ''
    }
}

console.log('USD:', getCurrencySymbol('USD'))
console.log('AUD:', getCurrencySymbol('AUD'))
console.log('AED:', getCurrencySymbol('AED'))
console.log('ZAR:', getCurrencySymbol('ZAR'))
console.log('GBP:', getCurrencySymbol('GBP'))
