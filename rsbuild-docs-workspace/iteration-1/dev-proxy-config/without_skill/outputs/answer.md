# Rsbuild 配置开发代理（Dev Proxy）

在 Rsbuild 中，可以通过 `server.proxy` 配置项将 `/api` 开头的请求代理到 `http://localhost:3000`。

## 配置方式

在 `rsbuild.config.ts`（或 `rsbuild.config.js`）中添加如下配置：

```ts
// rsbuild.config.ts
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

这是最简写的形式，等价于将所有以 `/api` 开头的请求代理到 `http://localhost:3000/api/...`。

## 更多选项

Rsbuild 的 `server.proxy` 底层基于 `http-proxy-middleware`，因此支持其全部配置项。以下是一些常见用法：

### 路径重写（Path Rewrite）

如果希望代理时去掉 `/api` 前缀（例如 `/api/users` 代理到 `http://localhost:3000/users`）：

```ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        pathRewrite: { '^/api': '' },
      },
    },
  },
});
```

### 修改请求头中的 Origin（changeOrigin）

当后端服务校验 Host/Origin 时，可以开启 `changeOrigin`：

```ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

### 代理多个路径

```ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3001',
    },
  },
});
```

## 总结

- 配置项路径：`server.proxy`
- 最简写法：`'/api': 'http://localhost:3000'`
- 支持 `http-proxy-middleware` 的全部选项，如 `pathRewrite`、`changeOrigin` 等
