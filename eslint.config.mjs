import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next 15 usa el formato clásico; FlatCompat lo adapta.
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", ".vercel/**"],
  },
];

export default eslintConfig;
