module.exports = {
  root: true,
  env: {browser: true, es2020: true},
  extends: [
    // 'airbnb',
    // 'airbnb-typescript',
    // 'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    "vite.config.ts"
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: [
      "tsconfig.eslint.json",
      "tsconfig.json"
    ]
  },
  plugins: [
    // 'react',
    'import',
    'react-refresh',
    '@typescript-eslint'
  ],
  rules: {
    "indent": ["error", 2],
    "object-curly-spacing": ["error", "always"],
    "array-bracket-spacing": ["error", "always"],
    "import/prefer-default-export": "off",
    "import/extensions": [
      "error",
      "never",
    ],
    "react/react-in-jsx-scope": "off",
    "consistent-return": "off",
    "react-hooks/exhaustive-deps": "off",
    'react-refresh/only-export-components': [
      'warn',
      {allowConstantExport: true},
    ],
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn', {
        args: "after-used",
        ignoreRestSiblings: false,
        vars: "local",
        varsIgnorePattern: "(?:_ref|key|_key|style|children|_)$",
        argsIgnorePattern: "(?:_ref|key|_key|style|children|_)$"
      }],
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {'ts-ignore': 'allow-with-description'},
    ],
  },
}
