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
    "import",
    "react",
  ],
  extends: [
    "airbnb-typescript",
    // "eslint:recommended", // ESLint's inbuilt "recommended" config
    "plugin:react/recommended",
    // "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
  ],
  settings: {
    react: {
      pragma: 'React',
      version: "detect"
    }
  },
  rules: {
    "import/no-extraneous-dependencies": ["error", {"devDependencies": true}]
  }
}
