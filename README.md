# 酒店 AI 助手平台

酒店 AI 助手是面向酒店经营与服务场景的应用平台。MVP 统一提供用户、酒店、素材、应用入口、应用管理和订单等公共能力，具体业务流程由各应用独立完成。

## 当前内容

- `index.html`：酒店 AI 助手小程序端 MVP 可点击原型及完整前端代码
- `icon.png`：原型图标
- `preview-home.png`：首页预览图
- `pc/yingdian-template-management/`：营点 AI 的 PC 端模板管理原型
- `docs/酒店AI助手平台_MVP_PRD_V1.0.md`：平台 MVP PRD
- `docs/酒店AI助手平台_应用内部设计规范_V0.1.md`：应用内部设计规范

## 查看原型

### 小程序端

直接打开根目录的 `index.html` 即可查看。

首次登录演示地址：

```text
index.html?demo=first-login#login
```

### PC 端

直接打开 `pc/yingdian-template-management/index.html`，即可查看营点 AI 模板管理原型。

GitHub Pages 开启后，可通过以下路径访问：

```text
https://gy131-ai.github.io/hotel-ai-assistant/pc/yingdian-template-management/
```

原型包含：

- 首页与“我的”页面
- 应用入口的任务、消息和空状态切换
- 微信授权登录
- 首次登录创建酒店
- 省、市、区与详细地址组件
- 酒店管理、素材库、应用管理、应用订单和客服入口

## 产品边界

- 平台负责：用户、酒店、素材、应用入口、应用管理、订单和统一跳转
- 应用负责：业务事件、应用任务、应用消息、业务流程和业务结果

当前仓库为 MVP 原型与需求文档，尚未包含生产后端服务。

仓库按端和应用分目录管理：根目录暂时保留小程序端入口，PC 端统一放在 `pc/` 下，各应用的专属管理功能再按应用建立子目录，无需拆分为多个仓库。
