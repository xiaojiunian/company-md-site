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

## 本地预览

```bash
npm run preview
```

然后打开：

```txt
http://localhost:4321/
```

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
