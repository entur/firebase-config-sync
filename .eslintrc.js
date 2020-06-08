module.exports = {
    extends: ['eslint:recommended', 'plugin:node/recommended'],
    plugins: ['prettier'],
    parserOptions: {
        ecmaVersion: 2020,
    },
    env: {
        node: true,
    },
    rules: {
        'prefer-const': 'error',
        'prettier/prettier': 'error',
    },
}
