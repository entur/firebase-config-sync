module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'prettier'],
    extends: [
        'eslint:recommended',
        'plugin:node/recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    env: {
        node: true,
    },
    rules: {
        'node/no-unsupported-features/es-syntax': 'off',
        'node/no-missing-import': 'off',
        'node/shebang': [
            'error',
            {
                convertPath: {
                    'src/**/*.ts': ['^src/(.+?).ts$', 'dist/$1.js'],
                },
            },
        ],
        'prefer-const': 'error',
        'prettier/prettier': 'error',
    },
}
