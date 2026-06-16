<!-- Git 仓库地址：git@github.com:rick-peng-li/canteen-express-ment-web.git -->

# canteen-express-ment-web

## 项目简介
canteen-express-ment-web 是一个面向校内食堂配送场景的 Web 管理平台，围绕“教师下单、食堂接单、履约流转、后台运营”构建完整业务闭环。系统以语音与文本下单为入口，以订单状态流转为主线，以菜单、配送点和系统配置为支撑，适用于校园食堂、办公室配送、教学区餐饮协同等场景。

项目当前覆盖以下核心能力：
- 教师端快捷下单，支持语音转写、自然语言输入和菜单勾选组合下单
- 订单全流程管理，支持待确认、制作中、待配送、已送达等状态流转
- 食堂端实时运营看板，支持 WebSocket 实时同步订单变化
- 后台管理能力，支持菜单维护、配送点维护、营业配置和公告管理
- 统计汇总能力，支持首页总览、订单汇总、营收概览和履约信息展示

## 业务场景
本项目面向的典型流程如下：
1. 教师选择配送地点并提交文本或语音订单
2. 系统对订单内容进行语音转写和菜品结构化解析
3. 后端创建订单并保存到 MongoDB
4. 运营看板实时接收新订单，食堂工作人员按流程推进状态
5. 订单在履约过程中持续更新，前端页面同步展示最新状态与数据统计

## 功能模块
### 1. 首页总览 `/`
首页用于展示平台运行概况与核心业务指标，适合作为系统入口和运营驾驶舱。

主要内容包括：
- 平台介绍与公告信息
- 营业时间、客服电话、接单状态
- 今日订单数、活跃订单数、今日营收、平均客单价
- 订单状态分布
- 近期订单列表
- 当前可售菜单预览
- 跳转到下单、运营和后台模块的快捷入口

### 2. 新建订单 `/orders/new`
新建订单页面向教师或办公场景用户，提供完整的下单交互能力。

主要功能包括：
- 录入下单人姓名和联系电话
- 选择配送地点
- 通过浏览器麦克风进行语音录音
- 调用语音转写接口自动生成订单文本
- 支持自然语言文本输入
- 支持菜单式点单与数量调整
- 支持补充备注信息
- 自动汇总订单金额与选购菜品
- 创建订单后返回订单编号、状态和金额信息

### 3. 订单跟踪 `/orders/tracking`
订单跟踪页用于查看历史订单和履约进度，适合运营人员、食堂人员或教师用户追踪订单状态。

主要功能包括：
- 按订单号、下单人、状态、配送点进行筛选
- 按分页方式浏览历史订单
- 查看订单金额、菜品明细、订单备注
- 查看订单状态时间线
- 查看订单创建时间和联系方式
- 结合首页统计信息进行履约分析

### 4. 食堂运营 `/operations`
食堂运营页是实时看板页面，适合厨房、打包区和配送岗位协同处理订单。

主要功能包括：
- 按状态分栏展示活跃订单
- 实时接收新订单推送
- 实时接收订单状态更新
- 逐步推进订单状态：Pending → Confirmed → Preparing → Ready → Delivered
- 支持取消订单
- 展示订单菜品、金额、预计出餐时间和备注
- 支持大屏值守或日常运营值班场景

### 5. 后台管理 `/admin`
后台管理页用于配置系统级业务数据，是平台的运营控制中心。

主要功能包括：
- 配置系统名称、公告、客服电话、营业时间
- 控制系统是否接单
- 配置默认平均出餐时长
- 管理配送点名称、编码、联系人和配送费
- 管理菜单名称、分类、价格、标签、描述和出餐时长
- 控制菜单上下架状态
- 删除不再使用的菜单项

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

前端设计说明：
- `pages`：承载业务页面
- `components`：承载页面复用组件
- `lib`：承载请求封装、金额格式化、状态样式等通用能力
- `AppShell`：统一导航结构与主布局

## 后端结构
```text
backend/
├─ models/
│  ├─ Destination.js
│  ├─ MenuItem.js
│  ├─ Order.js
│  └─ Setting.js
├─ package.json
└─ server.js
```

后端设计说明：
- `server.js`：应用入口，负责数据库连接、接口注册、实时通信与默认数据初始化
- `models/Order.js`：订单领域模型
- `models/MenuItem.js`：菜单领域模型
- `models/Destination.js`：配送点领域模型
- `models/Setting.js`：系统配置领域模型

## 数据模型设计
### Order
订单模型用于承载从创建到送达的完整业务信息，核心字段包括：
- `orderNumber`：业务订单编号
- `customerName`：下单人姓名
- `phone`：联系电话
- `rawText`：原始订单文本
- `parsedItems`：结构化菜品数组
- `destination`：配送点名称
- `destinationCode`：配送点编码
- `source`：订单来源，支持 `voice`、`text`、`catalog`、`mixed`
- `notes`：补充备注
- `totalAmount`：订单总金额
- `status`：当前订单状态
- `estimatedReadyMinutes`：预计出餐时间
- `statusTimeline`：状态时间线
- `deliveredAt`：送达时间
- `createdAt`、`updatedAt`：创建与更新时间

### MenuItem
菜单模型用于维护菜品主数据，核心字段包括：
- 菜品名称
- 菜品分类
- 菜品价格
- 菜品描述
- 标签
- 预计出餐时间
- 是否可售

### Destination
配送点模型用于管理配送位置与费用信息，核心字段包括：
- 配送点名称
- 配送点编码
- 联系人
- 配送费
- 是否启用

### Setting
系统配置模型用于控制业务运行参数，核心字段包括：
- 食堂名称
- 公告信息
- 客服电话
- 营业时间
- 是否接单
- 平均出餐时长

## 接口设计
### 系统与统计接口
| 接口 | 方法 | 功能 |
| --- | --- | --- |
| `/api/health` | GET | 获取服务健康状态与接单状态 |
| `/api/dashboard/summary` | GET | 获取首页和运营页统计汇总数据 |
| `/api/settings` | GET | 获取系统配置 |
| `/api/settings` | PUT | 更新系统配置 |

### 菜单接口
| 接口 | 方法 | 功能 |
| --- | --- | --- |
| `/api/menu-items` | GET | 获取菜单列表，支持分类和可售状态筛选 |
| `/api/menu-items` | POST | 创建菜单项 |
| `/api/menu-items/:id` | PATCH | 更新菜单项信息 |
| `/api/menu-items/:id` | DELETE | 删除菜单项 |

### 配送点接口
| 接口 | 方法 | 功能 |
| --- | --- | --- |
| `/api/destinations` | GET | 获取配送点列表 |
| `/api/destinations` | POST | 创建配送点 |
| `/api/destinations/:id` | PATCH | 更新配送点信息 |

### 订单接口
| 接口 | 方法 | 功能 |
| --- | --- | --- |
| `/api/transcribe` | POST | 上传音频并返回语音转写文本 |
| `/api/orders` | GET | 分页查询订单，支持筛选与搜索 |
| `/api/orders/active` | GET | 获取当前活跃订单 |
| `/api/orders/:id` | GET | 获取单个订单详情 |
| `/api/orders` | POST | 创建订单，支持语音、文本、菜单混合方式 |
| `/api/orders/:id/status` | PATCH | 更新订单状态 |

## WebSocket 事件
| 事件名 | 说明 |
| --- | --- |
| `new_order` | 当系统创建新订单时广播给运营端 |
| `order_updated` | 当订单状态变化时广播给相关页面 |
| `summary_updated` | 当统计数据变化时同步首页和运营页汇总信息 |

## 技术架构
### 前端技术栈
- React 19
- React Router DOM 7
- Vite 8
- Axios
- Socket.IO Client
- Tailwind CSS 4
- Lucide React

### 后端技术栈
- Node.js
- Express 5
- MongoDB
- Mongoose
- Multer
- Socket.IO
- OpenAI SDK（用于兼容访问 Groq 能力）

### AI 能力说明
项目中的 AI 能力主要应用于两个环节：
- 语音转写：通过 `/api/transcribe` 接口把音频转为文本
- 文本解析：将自然语言订单解析为结构化菜品数组

当环境中配置 `GROQ_API_KEY` 时，系统可调用 Groq 接口完成语音和文本解析；未配置时，系统仍支持文本规则解析和菜单式下单。

### 整体架构
```text
教师端 / 运营端 / 后台管理端
          ↓
      React + Vite
          ↓
   Axios HTTP + Socket.IO
          ↓
      Express API
          ↓
 MongoDB + 订单解析 + 语音转写
          ↓
   实时广播与状态同步
```

## 启动方式
### 1. 环境要求
- Node.js 18+
- npm 9+
- MongoDB 6+

### 2. 后端环境变量
在 `backend` 目录下创建 `.env` 文件：

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/canteen_express
GROQ_API_KEY=your_groq_api_key
```

说明：
- `MONGO_URI` 用于连接 MongoDB 数据库
- `GROQ_API_KEY` 用于语音转写和订单文本解析
- 若未配置 `GROQ_API_KEY`，语音转写不可用，但文本和菜单下单仍可使用

### 3. 安装依赖
后端安装：

```bash
cd backend
npm install
```

前端安装：

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

默认访问地址：
- 首页：http://localhost:5173/
- 新建订单：http://localhost:5173/orders/new
- 订单跟踪：http://localhost:5173/orders/tracking
- 食堂运营：http://localhost:5173/operations
- 后台管理：http://localhost:5173/admin
- 后端服务：http://localhost:5000

## 项目特点
- 业务链路完整，覆盖下单、接单、制作、配送、送达全过程
- 同时支持语音订单、文本订单和菜单订单三种输入方式
- 具备实时运营能力，适用于厨房和配送环节协同
- 具备基础后台配置能力，便于日常菜单和配送规则维护
- 默认种子数据可直接支撑本地演示和联调
- 结构清晰，适合继续扩展鉴权、支付、通知、日志等能力

## 后续演进方向
如需进一步面向正式生产环境，可继续完善以下方向：
- 用户登录、角色权限与访问控制
- 更完整的参数校验与异常处理
- 接口鉴权、操作审计与日志监控
- 自动化测试、持续集成与部署流水线
- 支付、消息通知、打印小票和多终端协同
