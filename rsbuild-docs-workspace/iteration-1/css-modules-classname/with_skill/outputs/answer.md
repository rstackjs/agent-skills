# 修改 CSS Modules 生成的类名格式

在 Rsbuild 中，通过 `output.cssModules.localIdentName` 配置项即可自定义 CSS Modules 生成的类名格式。

## 配置方法

在 `rsbuild.config.ts` 中设置：

```ts
export default {
  output: {
    cssModules: {
      localIdentName: '[name]__[local]',
    },
  },
};
```

这样生成的类名就会是 `App__red`、`Header__title` 这种 `[文件名]__[原始类名]` 的格式。

## 默认值

Rsbuild 在不同环境下有不同的默认值：

- **开发环境**：`[path][name]__[local]-[hash:base64:6]`，例如 `.src-App-module__red-hiQIE4`
- **生产环境**：`[local]-[hash:base64:6]`，例如 `.red-hiQIE4`（更短，减小产物体积）

## 可用的占位符

| 占位符                       | 含义                     |
| ---------------------------- | ------------------------ |
| `[name]`                     | 文件名（不含扩展名）     |
| `[local]`                    | 原始类名                 |
| `[hash]` / `[hash:base64:N]` | 哈希值，N 为长度         |
| `[path]`                     | 文件相对路径             |
| `[folder]`                   | 文件所在文件夹的相对路径 |
| `[file]`                     | 文件名和路径             |
| `[ext]`                      | 扩展名（带前导点）       |

## 实际建议

如果你只使用 `[name]__[local]` 而不加 hash，在不同文件中出现相同类名时可能会产生冲突。建议至少保留一个短 hash 来确保唯一性：

```ts
export default {
  output: {
    cssModules: {
      localIdentName: '[name]__[local]-[hash:base64:4]',
    },
  },
};
```

这样既能保持可读的 `组件名__类名` 格式，又能通过 hash 避免命名冲突。

## 参考文档

- [output.cssModules 配置](https://rsbuild.rs/config/output/css-modules)
- [CSS Modules 使用指南](https://rsbuild.rs/guide/styling/css-modules)
