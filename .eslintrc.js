module.exports = {
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: [
      './tsconfig.json',
      './tsconfig.node.json'
    ],
    tsconfigRootDir: __dirname
  },
  plugins: [
    "react",
  ],
  extends: [
    "airbnb-typescript",
    // "eslint:recommended", // ESLint's inbuilt "recommended" config
    "plugin:react/recommended",
    `plugin:react/jsx-runtime`,
    // "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
  ]
}
