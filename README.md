# weekly-todo-desktop（周待办清单）

基于 [Electron](https://www.electronjs.org/) 的桌面小工具：按**自然周**管理待办，支持星标优先级、**复制周报**（按「当前周内勾选完成」统计）、本地持久化存储。

仓库地址：<https://github.com/TaylorSwitiger/weekly-todo-desktop>

## 功能概要

- 按创建日所在周分组展示；**本周**展示全部；**历史周**同时展示未完成与已完成（已完成排在后面，可取消勾选）。
- 勾选完成时记录完成时间，用于「复制周报」；历史任务若在本周勾选完成，也会计入本周周报。
- 高优先级星标、历史统计折叠、简约记事本风格界面。

## 环境要求

- Windows x64（当前打包目标；源码可在 macOS/Linux 上开发，需自行调整 `electron-builder` 配置）。
- [Node.js](https://nodejs.org/) 建议 **LTS**（如 20.x / 22.x）。

## 开发与运行

```bash
git clone https://github.com/TaylorSwitiger/weekly-todo-desktop.git
cd weekly-todo-desktop
npm install
npm start
```

## 打包

```bash
npm run build
```

产物默认在 `dist/`（便携版 exe、NSIS 安装包等，具体见构建日志）。**未做代码签名**时，Windows 可能出现 SmartScreen 提示，属正常现象。

若本机打包报错与 **7-Zip / 符号链接 / 客户端没有所需的特权** 相关，本项目已在 `package.json` 中设置 `signAndEditExecutable: false` 以降低对 symlink 权限的依赖；仍失败时可尝试：**以管理员运行终端** 或开启 **Windows 开发人员模式**。

## 数据存储位置

使用 [electron-store](https://github.com/sindresorhus/electron-store)，数据保存在本机用户目录。Windows 上一般在：

`%APPDATA%\weekly-todo-desktop\`（与 `package.json` 中 `name` 一致，以本机为准）。

## 开源协议

本项目以 **MIT License** 发布，见仓库根目录 [LICENSE](./LICENSE)。

## 贡献

欢迎 Issue 与 Pull Request。
