# Rsbuild 中修改 CSS Modules 类名格式

在 Rsbuild 中，可以通过 `output.cssModules.localIdentName` 配置项来自定义 CSS Modules 生成的类名格式。

## 配置方法

在 `rsbuild.config.ts` 中进行如下配置：

```ts
export default {
  output: {
    cssModules: {
      localIdentName: '[name]__[local]',
    },
  },
};
```

## 常用占位符

- `[name]` - CSS 文件的名称（不含扩展名）
- `[local]` - 原始的 CSS 类名
- `[hash]` / `[hash:<length>]` - 基于内容生成的哈希值，可指定长度，如 `[hash:8]`
- `[folder]` - 文件所在的文件夹名称
- `[path]` - 文件相对于项目根目录的路径

## 常见格式示例

```ts
// BEM 风格：文件名__类名
localIdentName: '[name]__[local]';
// 输出示例：Button__primary

// 带哈希的格式（默认开发环境类似此格式）
localIdentName: '[name]__[local]--[hash:5]';
// 输出示例：Button__primary--a1b2c

// 仅哈希（适合生产环境，体积最小）
localIdentName: '[hash:8]';
// 输出示例：a1b2c3d4

// 包含路径信息（避免不同目录同名文件冲突）
localIdentName: '[folder]-[name]__[local]';
// 输出示例：components-Button__primary
```

## 默认值

Rsbuild 的默认配置会根据环境自动选择不同的类名格式：

- **开发环境 (dev)**：`[path][name]__[local]-[hash:6]`，包含路径和文件名信息，方便调试。
- **生产环境 (build)**：`[hash:8]`，仅使用哈希，减小产物体积。

## 补充说明

如果你需要更细粒度的控制，还可以通过 `output.cssModules` 配置其他 CSS Modules 相关选项，例如：

```ts
export default {
  output: {
    cssModules: {
      localIdentName: '[name]__[local]',
      // 是否自动识别 CSS Modules（基于文件扩展名 .module.css）
      auto: true,
      // 导出类名的命名方式：camelCase, camelCaseOnly, dashes, dashesOnly, asIs
      exportLocalsConvention: 'camelCase',
    },
  },
};
```
