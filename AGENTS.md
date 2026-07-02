# 项目约定

## Tailwind CSS — 颜色透明度修饰符

优先使用简写 `/N` 语法（N = 0–100，表示百分比透明度），而非任意方括号值。
适用于所有支持透明度修饰符的工具类（`bg-`、`border-`、`text-`、`ring-` 等）。

| 避免                  | 推荐             |
| --------------------- | ---------------- |
| `border-white/[0.08]` | `border-white/8` |
| `bg-white/[0.04]`     | `bg-white/4`     |
| `bg-white/[0.05]`     | `bg-white/5`     |
| `bg-white/[0.06]`     | `bg-white/6`     |

项目中已在多处使用简写形式（如 `border-white/10`、`text-white/55`、`bg-white/10`）。
编辑或新增样式时请保持一致，不要引入新的 `[0.N]` 任意透明度值。
