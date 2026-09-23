# 从 Create React App 迁移到 Rsbuild

## 概述

Rsbuild 是基于 Rspack 的构建工具，提供了与 CRA 类似的开箱即用体验，但构建速度大幅提升。以下是迁移的主要步骤和注意事项。

## 迁移步骤

### 1. 安装依赖

```bash
npm install @rsbuild/core @rsbuild/plugin-react -D
```

然后移除 CRA 相关依赖：

```bash
npm uninstall react-scripts
```

### 2. 创建 Rsbuild 配置文件

在项目根目录创建 `rsbuild.config.ts`：

```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    // CRA 默认入口是 src/index，Rsbuild 也是，通常不需要改
    // entry: { index: './src/index.tsx' },
  },
  html: {
    // 如果你有自定义的 HTML 模板
    template: './public/index.html',
  },
});
```

### 3. 更新 package.json 中的 scripts

将 `package.json` 中的脚本替换：

```json
{
  "scripts": {
    "start": "rsbuild dev",
    "build": "rsbuild build",
    "preview": "rsbuild preview"
  }
}
```

### 4. 处理 HTML 模板

CRA 使用 `public/index.html` 作为模板，其中使用 `%PUBLIC_URL%` 这样的占位符。Rsbuild 中需要做调整：

- 将 `%PUBLIC_URL%/` 替换为空字符串或 `/`，因为 Rsbuild 会自动处理公共路径。
- 例如把 `%PUBLIC_URL%/favicon.ico` 改为 `/favicon.ico`。

### 5. 处理环境变量

CRA 中以 `REACT_APP_` 为前缀的环境变量会自动注入到客户端代码中。Rsbuild 中默认前缀是 `PUBLIC_`，你可以通过配置修改：

```ts
export default defineConfig({
  source: {
    define: {
      // 手动定义需要的环境变量
    },
  },
});
```

或者使用 `loadEnv` 工具函数来加载 `.env` 文件中的变量。如果你想保持 `REACT_APP_` 前缀的兼容性，可以配置 `source.envPrefix`：

```ts
export default defineConfig({
  source: {
    envPrefix: ['REACT_APP_'],
  },
});
```

### 6. 处理 public 目录

CRA 中 `public` 目录下的静态资源会被复制到构建输出。Rsbuild 同样支持这个特性，默认会处理 `public` 目录，通常不需要额外配置。

### 7. 处理 SVG 导入

CRA 支持将 SVG 作为 React 组件导入（`import { ReactComponent as Logo } from './logo.svg'`）。Rsbuild 中需要安装 SVGR 插件：

```bash
npm install @rsbuild/plugin-svgr -D
```

然后在配置中添加：

```ts
import { pluginSvgr } from '@rsbuild/plugin-svgr';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSvgr({
      mixedImport: true,
    }),
  ],
});
```

这样你可以继续使用 named import 的方式导入 SVG 作为组件。

### 8. 处理 CSS/样式

- **CSS Modules**：CRA 中 `.module.css` / `.module.scss` 文件会被当作 CSS Modules。Rsbuild 也默认支持这种约定，无需额外配置。
- **Sass/Less**：如果使用 Sass，安装对应插件：
  ```bash
  npm install @rsbuild/plugin-sass -D
  ```
  然后在配置中引入 `pluginSass()`。Less 同理，使用 `@rsbuild/plugin-less`。

### 9. TypeScript 支持

Rsbuild 内置了 TypeScript 支持，CRA 项目中的 `tsconfig.json` 一般可以直接使用。需要注意：

- CRA 的 `tsconfig.json` 中可能有 `paths` 别名配置（如 `src/*`），需要在 Rsbuild 中对应配置 `source.alias`。
- CRA 中 `react-app-env.d.ts` 的类型声明可以删除，替换为 Rsbuild 提供的类型引用。

## 注意事项

1. **Webpack 特有的语法**：如果代码中使用了 `require.context`、webpack-specific 的 magic comments 等，需要检查 Rspack 的兼容情况。Rspack 对大部分 webpack API 有兼容支持，但个别 API 可能不同。

2. **Proxy 配置**：CRA 中在 `package.json` 里配置的 `proxy` 字段或 `src/setupProxy.js`，需要迁移到 Rsbuild 的 `server.proxy` 配置中。

3. **测试**：`react-scripts test` 使用的是 Jest。迁移后你需要单独配置 Jest 或改用 Vitest 等测试框架，因为 Rsbuild 本身不包含测试功能。

4. **eject 过的项目**：如果你的 CRA 项目已经 eject，那么你可能有大量自定义 webpack 配置，迁移时需要逐一检查并找到 Rsbuild/Rspack 中的对应配置。

5. **Babel 插件**：CRA 内置了一些 Babel 配置。Rsbuild 默认使用 SWC 进行编译，速度更快。如果你依赖特定的 Babel 插件，可以通过 `@rsbuild/plugin-babel` 来使用 Babel，但建议尽量迁移到 SWC 以获得更好的性能。

6. **browserslist**：CRA 在 `package.json` 中设置了 browserslist。Rsbuild 也会读取 browserslist 配置，可以保留或根据需要调整。

7. **构建输出目录**：CRA 默认输出到 `build` 目录，Rsbuild 默认输出到 `dist` 目录。如果你的部署流程依赖 `build` 目录，可以通过 `output.distPath.root` 来修改。

## 总结

从 CRA 迁移到 Rsbuild 总体来说比较平滑，因为两者的设计理念相似——都是开箱即用的 React 构建工具。主要工作集中在：替换依赖和脚本、处理环境变量前缀、处理 SVG 导入方式、以及迁移代理和特殊 webpack 配置。迁移后你会获得显著的构建速度提升。
