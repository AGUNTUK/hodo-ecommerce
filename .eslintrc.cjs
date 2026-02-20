module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["@typescript-eslint", "import"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:import/recommended", "plugin:import/typescript", "prettier"],
  rules: {
    "no-unused-vars": "warn",
    "no-undef": "off",
    "no-empty": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "off"
  },
  globals: {
    supabaseClient: "readonly"
  },
  overrides: [
    {
      files: ["**/*.js"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off"
      }
    },
    {
      files: ["api/**/*.{ts,js}"],
      env: {
        node: true
      }
    },
    {
      files: ["tests/**/*.{ts,js}"],
      env: {
        node: true
      },
      globals: {
        describe: "readonly",
        test: "readonly",
        expect: "readonly"
      }
    }
  ],
  ignorePatterns: ["node_modules/", "dist/", "build/", "*.min.js"]
};
