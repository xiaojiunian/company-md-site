# 公司官网介绍页 Demo

这是一个不依赖 Astro 的 GitHub Pages/Jekyll 验证项目。

## 内容怎么改

主要编辑这个文件：

```txt
index.md
```

页面结构和样式在：

```txt
_layouts/company.html
assets/css/style.css
```

新增子页面时，可以参考：

```txt
canopy-how-it-works.md
```

这个文件会生成：

```txt
canopy-how-it-works.html
```

## 本地预览

```bash
npm run preview
```

然后打开：

```txt
http://localhost:4321/
```

## 改动检查

查看当前改动和即将推送的提交：

```bash
npm run changes
```

仓库已配置 GitHub Actions 检查：`.github/workflows/site-check.yml`。

每次有人提交到 `main` 或发起 Pull Request 时，GitHub 会自动：

1. 在 Actions 页面展示本次提交说明和改动文件。
2. 构建预览页面。
3. 检查生成的 HTML、CSS 和头部背景图是否存在。

如果要让这个检查真正拦截所有人，需要在 GitHub 仓库里设置 `main` 分支保护，并把 `site-check` 设为必需检查。

## 发布到 GitHub Pages

1. 把这些文件上传到你的 GitHub 仓库。
2. 进入仓库的 `Settings -> Pages`。
3. Source 选择 `Deploy from a branch`。
4. Branch 选择 `main`，目录选择 `/root`。
5. 保存后等待 GitHub Pages 构建完成。

之后每次修改 `index.md` 并推送到 GitHub，线上页面会自动更新。

线上地址通常是：

```txt
https://xiaojiunian.github.io/company-md-site/
```
