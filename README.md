# weekly-todo-desktop（周待办清单）

基于 [Electron](https://www.electronjs.org/) 的桌面小工具：按**自然周**管理待办，支持星标优先级、**复制周报**（按「当前周内勾选完成」统计）、本地持久化存储。

仓库地址：<https://github.com/TaylorSwitiger/weekly-todo-desktop>

## 下载

请到 **[Releases 发布页](https://github.com/TaylorSwitiger/weekly-todo-desktop/releases)** 获取对应系统的安装包：

- **Windows**：`.exe`（便携版与 Setup 安装包）
- **macOS**：`.dmg` / `.zip`，含 **Intel（x64）** 与 **Apple Silicon（arm64）** 两种架构，请按自己的 Mac 选择；首次打开若提示未识别开发者，可在「系统设置 → 隐私与安全性」中允许，或右键打开。

## 功能概要

- 按创建日所在周分组展示；**本周**展示全部；**历史周**同时展示未完成与已完成（已完成排在后面，可取消勾选）。
- 勾选完成时记录完成时间，用于「复制周报」；历史任务若在本周勾选完成，也会计入本周周报。
- 高优先级星标、历史统计折叠、简约记事本风格界面。

## 环境要求

- 运行：当前提供 **Windows x64** 与 **macOS（Intel / Apple Silicon）** 的预编译包；开发调试可跨平台。
- 开发：安装 [Node.js](https://nodejs.org/) **LTS**（如 20.x / 22.x）。

## 开发与运行

```bash
git clone https://github.com/TaylorSwitiger/weekly-todo-desktop.git
cd weekly-todo-desktop
npm install
npm start
```

## 打包

```bash
# Windows（需在 Windows 上执行，或在 CI 中）
npm run build
# 或显式：npm run build:win

# macOS（需在 macOS 上执行，或在 CI 中）
npm run build:mac
```

产物在 `dist/`：Windows 为便携版与 NSIS 安装包；macOS 为各架构的 `.dmg` 与 `.zip`。**未做 Apple / 微软代码签名**时，系统可能出现安全提示，属正常现象。

推送与 `package.json` 里 `version` 一致的 **`v` 前缀标签**（例如 `1.0.1` → `v1.0.1`）后，**GitHub Actions** 会在 **Windows** 与 **macOS** 上分别构建，并将各平台产物一并上传到该版本的 **Release**。

若本机打包报错与 **7-Zip / 符号链接 / 客户端没有所需的特权** 相关，本项目已在 `package.json` 中设置 `signAndEditExecutable: false` 以降低对 symlink 权限的依赖；仍失败时可尝试：**以管理员运行终端** 或开启 **Windows 开发人员模式**。

## 数据存储位置

使用 [electron-store](https://github.com/sindresorhus/electron-store)，数据保存在本机用户目录：

- **Windows**：`%APPDATA%\weekly-todo-desktop\`
- **macOS**：一般在 `~/Library/Application Support/` 下以应用显示名命名的目录（打包后多为「周待办清单」；开发调试时可能与 `package.json` 的 `name` 一致）

## 开源协议

本项目以 **MIT License** 发布，见仓库根目录 [LICENSE](./LICENSE)。

## 贡献

欢迎 Issue 与 Pull Request。
