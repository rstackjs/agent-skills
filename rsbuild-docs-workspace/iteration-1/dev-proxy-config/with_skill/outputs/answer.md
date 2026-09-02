# Rsbuild 配置 /api 代理到 http://localhost:3000

在 Rsbuild 配置文件中使用 `server.proxy` 即可实现：

```ts
// rsbuild.config.ts
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
};
```

这样所有以 `/api` 开头的请求都会被代理到 `http://localhost:3000`。例如，访问 `/api/users` 会被转发到 `http://localhost:3000/api/users`。

## 如果需要去掉 /api 前缀

如果后端接口没有 `/api` 前缀，可以用 `pathRewrite` 重写路径：

```ts
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        pathRewrite: { '^/api': '' },
      },
    },
  },
};
```

这样 `/api/users` 会被转发到 `http://localhost:3000/users`。

## 其他常用场景

**代理多个路径到同一个目标：**

```ts
export default {
  server: {
    proxy: [
      {
        context: ['/auth', '/api'],
        target: 'http://localhost:3000',
      },
    ],
  },
};
```

**代理 WebSocket 请求：**

```ts
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
};
```

`server.proxy` 底层使用的是 `http-proxy-middleware`，支持该库的所有配置项。

参考文档：https://rsbuild.rs/config/server/proxy
