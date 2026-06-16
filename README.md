<!-- Git 仓库地址：git@github.com:rick-peng-li/canteen-express-ment-web.git -->

# canteen-express-ment-web

## 项目简介
canteen-express-ment-web 已从原始的语音点单 MVP，扩展为一个面向校内食堂配送业务的完整 Web 平台。系统同时覆盖教师下单、订单追踪、食堂运营和后台配置四类场景，具备接近正式上线版本所需的核心页面与接口能力。

当前版本重点解决以下问题：
- 页面数量不足，已补齐首页、下单、跟踪、运营、后台 5 个完整页面
- 业务能力不足，已补齐菜单管理、配送点管理、营业配置、订单历史、实时运营看板等功能
- 接口粒度不足，已补齐菜单、地址、统计、系统设置、订单明细与分页查询等接口
- 数据模型不足，已补充订单编号、客户信息、状态时间线、金额、来源、预计出餐时长等字段

## 页面模块设计
前端在 `frontend/src/pages` 下新增并实现了 5 个完整页面模块：

### 1. 首页总览 `/`
定位：平台门户页与业务总览页。

功能包括：
- 展示平台介绍、公告、营业时间、客服信息
- 展示今日订单数、活跃订单、今日营收、平均客单价
- 展示状态分布、近期订单、菜单预览
- 提供跳转到下单、运营、后台等核心模块的入口

### 2. 新建订单页 `/orders/new`
定位：教师端下单中心。

功能包括：
- 录入下单人姓名、联系电话、配送地点
- 支持语音录音并调用转写接口自动填充文本
- 支持自然语言文本下单
- 支持菜单勾选式下单并自动计算金额
- 支持备注填写
- 支持文本与菜单混合下单
- 支持提交成功后返回订单编号和状态

### 3. 订单跟踪页 `/orders/tracking`
定位：订单历史查询与履约跟踪页。

功能包括：
- 按订单号、下单人、状态、配送点筛选订单
- 支持分页查看历史订单
- 展示订单金额、订单明细、时间线、备注信息
- 展示实时统计卡片，辅助运营查看历史履约情况

### 4. 食堂运营页 `/operations`
定位：食堂工作人员实时协同处理页面。

功能包括：
- 按状态分栏展示订单：Pending、Confirmed、Preparing、Ready
- 基于 Socket.IO 实时接收新订单和状态更新
- 支持状态推进：Pending → Confirmed → Preparing → Ready → Delivered
- 支持取消订单
- 展示订单明细、金额、预计出餐时间、备注信息
- 适用于大屏投放或运营值班场景

### 5. 后台管理页 `/admin`
定位：系统配置与运营数据维护页面。

功能包括：
- 维护系统名称、公告、营业时间、客服热线
- 控制是否允许系统继续接单
- 维护默认平均出餐时长
- 新增配送点、启停配送点、维护配送费
- 新增菜单项、上下架菜单项、删除菜单项
- 查看菜单价格、分类、标签、描述与可售状态

## 前端结构
```text
frontend/src/
├─ components/
│  ├─ AppShell.jsx
│  ├─ MetricCard.jsx
│  ├─ SectionCard.jsx
│  └─ StatusBadge.jsx
├─ lib/
│  ├─ api.js
│  └─ format.js
├─ pages/
│  ├─ AdminPage.jsx
│  ├─ HomePage.jsx
│  ├─ OperationsPage.jsx
│  ├─ OrderCreatePage.jsx
│  └─ OrderTrackingPage.jsx
├─ App.jsx
├─ index.css
└─ main.jsx
```

## 后端模块设计
### 1. 订单模型 `backend/models/Order.js`
订单模型已扩展为更适合上线场景的数据结构，主要字段包括：
- `orderNumber`：业务订单号
- `customerName`：下单人姓名
- `phone`：联系电话
- `rawText`：原始文本订单
- `parsedItems`：结构化菜品数组
- `destination`：配送点名称
- `destinationCode`：配送点编码
- `source`：订单来源，支持 `voice`、`text`、`catalog`、`mixed`
- `notes`：备注
- `totalAmount`：订单总金额
- `status`：订单状态
- `estimatedReadyMinutes`：预计出餐时间
- `statusTimeline`：状态时间线
- `deliveredAt`：送达时间
- `createdAt`、`updatedAt`：创建和更新时间

### 2. 菜单模型 `backend/models/MenuItem.js`
功能：维护菜单配置。

字段包括：
- 菜品名称、分类、价格、描述、标签
- 出餐时间
- 是否可售

### 3. 配送点模型 `backend/models/Destination.js`
功能：维护配送位置与收费规则。

字段包括：
- 配送点名称、编码、联系人
- 配送费
- 是否启用

### 4. 系统配置模型 `backend/models/Setting.js`
功能：维护系统级运营设置。

字段包括：
- 食堂名称
- 公告
- 客服电话
- 营业时间
- 是否接单
- 平均出餐时间

### 5. 后端主服务 `backend/server.js`
功能包括：
- 初始化 MongoDB 连接
- 初始化默认菜单、默认配送点、默认配置
- 提供语音转写能力
- 提供菜单、配送点、系统设置、订单统计、订单查询接口
- 提供 Socket.IO 实时事件广播
- 维护订单状态流转和看板推送

## 接口设计
### 系统与统计接口
| 接口 | 方法 | 功能 |
| --- | --- | --- |
| `/api/health` | GET | 获取服务健康状态与接单状态 |
| `/api/dashboard/summary` | GET | 获取首页和运营页汇总数据 |
| `/api/settings` | GET | 获取系统配置 |
| `/api/settings` | PUT | 更新系统配置 |

### 菜单接口
| 接口 | 方法 | 功能 |
| --- | --- | --- |
| `/api/menu-items` | GET | 获取菜单列表，支持按分类和可售状态筛选 |
| `/api/menu-items` | POST | 新增菜单项 |
| `/api/menu-items/:id` | PATCH | 更新菜单项，如价格、可售状态 |
| `/api/menu-items/:id` | DELETE | 删除菜单项 |

### 配送点接口
| 接口 | 方法 | 功能 |
| --- | --- | --- |
| `/api/destinations` | GET | 获取配送点列表 |
| `/api/destinations` | POST | 新增配送点 |
| `/api/destinations/:id` | PATCH | 更新配送点状态或配送费 |

### 订单接口
| 接口 | 方法 | 功能 |
| --- | --- | --- |
| `/api/transcribe` | POST | 上传音频并返回转写文本 |
| `/api/orders` | GET | 分页获取订单列表，支持搜索和状态筛选 |
| `/api/orders/active` | GET | 获取活跃订单列表 |
| `/api/orders/:id` | GET | 获取单个订单详情 |
| `/api/orders` | POST | 创建订单，支持文本、菜单、语音混合下单 |
| `/api/orders/:id/status` | PATCH | 更新订单状态 |

## WebSocket 事件
| 事件名 | 触发时机 | 用途 |
| --- | --- | --- |
| `new_order` | 创建订单后 | 通知运营看板追加新订单 |
| `order_updated` | 更新订单状态后 | 同步订单履约状态 |
| `summary_updated` | 订单、菜单、配送点、系统配置变化后 | 同步首页和运营页统计信息 |

## 技术架构
### 前端技术
- React 19
- React Router DOM 7
- Vite 8
- Axios
- Socket.IO Client
- Tailwind CSS 4
- Lucide React

### 后端技术
- Node.js
- Express 5
- Mongoose
- Multer
- Socket.IO
- OpenAI SDK（用于访问 Groq 兼容接口）
- MongoDB

### 架构说明
```text
教师端 / 运营端 / 后台管理端
          ↓
      React + Vite
          ↓
   Axios HTTP + Socket.IO
          ↓
      Express API
          ↓
MongoDB + 语音转写 + 订单解析
          ↓
   实时广播与业务状态同步
```

## 启动方式
### 1. 环境要求
- Node.js 18+
- npm 9+
- MongoDB 6+

### 2. 后端环境变量
在 `backend` 目录创建 `.env` 文件：

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/canteen_express
GROQ_API_KEY=your_groq_api_key
```

说明：
- `GROQ_API_KEY` 用于语音转写和订单文本结构化
- 若未配置 `GROQ_API_KEY`，系统仍可使用文本规则解析和菜单式下单，但语音转写不可用

### 3. 安装依赖
后端：

```bash
cd backend
npm install
```

前端：

```bash
cd frontend
npm install
```

### 4. 启动开发环境
启动后端：

```bash
cd backend
npm run dev
```

启动前端：

```bash
cd frontend
npm run dev
```

默认地址：
- 首页：http://localhost:5173/
- 新建订单：http://localhost:5173/orders/new
- 订单跟踪：http://localhost:5173/orders/tracking
- 食堂运营：http://localhost:5173/operations
- 后台管理：http://localhost:5173/admin
- 后端服务：http://localhost:5000

## 上线能力说明
当前版本已具备以下上线基础能力：
- 5 个完整业务页面
- 菜单中心、配送点中心、系统配置中心
- 订单创建、历史查询、履约流转、实时运营看板
- 订单状态时间线与基础统计指标
- 可配置营业状态，支持暂停接单
- 默认种子数据初始化，降低首次部署成本

## 已完成的代码级升级
- 前端路由由 2 个页面扩展为 5 个业务页面
- 新增 `frontend/src/pages`、`components`、`lib` 分层结构
- 后端新增菜单、配送点、系统配置 3 类模型
- 订单模型从 MVP 结构扩展为上线型业务结构
- 后端接口从 4 个扩展为覆盖订单、菜单、配送点、统计、系统配置的完整接口集
- 新增首页汇总与 Socket 实时汇总推送能力

## 当前建议的下一步增强
虽然当前版本已经明显接近上线标准，但若要进入真正生产环境，建议下一步继续补充：
- 登录鉴权与角色权限控制
- 表单校验与接口鉴权中间件
- 单元测试与接口自动化测试
- 操作日志与异常告警
- 图片菜单、支付集成、打印小票、消息通知
