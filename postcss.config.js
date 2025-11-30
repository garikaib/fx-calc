export default {
    plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {},
        'postcss-prefix-selector': {
            prefix: '#zp-fx-calc',
            transform(prefix, selector, prefixedSelector, filePath, rule) {
                if (selector === ':root') {
                    return prefix;
                }
                if (selector.match(/^(html|body)/)) {
                    return selector.replace(/^([^\s]*)/, `$1 ${prefix}`);
                }

                if (filePath.match(/node_modules/)) {
                    return prefixedSelector;
                }

                return prefixedSelector;
            },
        },
    },
}
