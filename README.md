# Little Things API 接口文档

## Changelog

### 2026-03-18

- 新增 `GET /api/weekly-report/current` 接口：获取当前用户当周已生成的 icon 列表（按 icon `created_at` 升序）
- 更新 `GET /api/weekly-report` 接口：响应新增 `read_at` 字段；
- 更新 `GET /api/weekly-reports` 接口：列表项新增 `read_at` 字段（`null` 表示未读）
- 新增 `POST /api/weekly-report/read` 接口：显式标记指定周报为已读

### 2026-03-06

- 新增 `GET /api/ai-insights/personas` 接口：获取 Report Persona 列表
- 新增 `POST /api/ai-insights/report-persona` 接口：更新当前用户的 Report Persona

### 2026-03-03

- 新增 `GET /api/weekly-reports` 接口：获取周报列表，支持分页（limit、cursor）

### 2026-03-01

- 新增 `GET /api/weekly-report` 接口：读取周报（仅读库，不触发生成）。可选查询参数 `week`（YYYY-Wnn），不传则返回当前用户最新一条；返回 `report_json`、`icons`（带签名 URL）及 `period_start`、`period_end`。

### 2026-02-09

- 新增 `GET /api/qod-strategy-options` 接口：获取可用的 QoD 策略选项，包含策略描述、禁用状态和 `url` 字段（用于策略 icon）

### 2026-02-03

- 更新 `GET /api/categories` 接口：响应中每个分类新增 `image_url` 字段
- 更新 `GET /api/thread-view` 接口：新增可选的 `categoryId` 查询参数，用于筛选指定分类下的问题
- 新增用户 QoD 策略（Question of the Day 策略）：用户拥有 `qod_strategy` 字段，枚举为 `RANDOM`、`PINNED`、`MIXED`，默认 `RANDOM`
- 新增 `POST /api/qod-strategy` 接口：用户修改自己的 QoD 策略（需登录）
- 更新 `GET /api/questions-of-the-day` 接口：返回结果由用户的 `qod_strategy` 决定（RANDOM：当前 QoD 逻辑；PINNED：仅来自用户 pin 的题目；MIXED：二者兼有）
- 新增 `GET /api/me` 接口：获取当前用户个人信息（需登录），返回 `email`、`qod_strategy`、`last_login_at`、`has_pinned_question`、`report_persona_id`、`report_persona`

### 2026-01-26

- 新增 `DELETE /api/answers/:id` 接口：允许用户删除自己的回答
- 更新 `GET /api/thread-view` 接口：响应中每个问题新增 `category` 和 `sub_category` 字段

### 2026-01-20

- 更新 `GET /api/calendar-view` 接口：响应中每个 reflection 的 `icon` 字段新增 `id` 字段
- 更新 `GET /api/thread-view` 接口：响应中每个答案的 `icon` 字段新增 `id` 字段

### 2026-01-19

- 更新 `GET /api/questions-of-the-day` 接口：实现确定性随机逻辑，同一用户同一天返回相同的3个问题；排除用户已 pinned 的问题；确保返回的3个问题的 category、sub_category、cluster 均不重复（内部逻辑，不影响返回格式）

### 2026-01-18

- 更新 `GET /api/thread-view` 接口：返回用户所有已回答的问题及其 icon；问题排序规则：pinned 优先，其次按最新回答时间；答案（icon）排序规则：最新生成的在最前

### 2025-12-15

- 新增 `POST /api/device-token` 接口：保存用户设备Token，用于推送通知

### 2025-12-11

- 更新 `GET /api/calendar-view` 接口：响应中每个 reflection 新增 `question` 字段，包含问题 ID、标题和分类信息

### 2025-11-30

- 新增图标生成功能：创建答案时自动生成图标
- 新增 `/api/icon/progress/:iconId` 接口：通过 SSE 获取图标生成进度
- 更新 `POST /api/answers` 接口：响应中新增 `icon` 字段，包含图标 ID 和状态
- 更新 `GET /api/answers` 接口：响应中每个答案新增 `icon` 字段，包含图标 URL（已签名）和状态
- 更新 `GET /api/calendar-view` 接口：响应中每个 reflection 新增 `icon` 字段
- 更新 `GET /api/thread-view` 接口：响应中每个答案新增 `icon` 字段

### 2025-11-05

- 新增 questions-of-the-day 接口：获取随机三个问题

### 2025-10-14

- 更新 `calendar-view` 接口：将 `first` 字段改为 `reflections` 字段，现在返回每天的所有回答而不是仅第一个回答
- 更新 `reflections` 字段结构：每个回答包含 `id`、`content` 和 `created_ymd` 字段

### 2025-10-11

- 新增 `/api/answers` 接口文档
- 更新 `calendar-view` 接口参数：从 `month` 改为 `start` 和 `end` 参数
- 更新 `POST /api/answers` 接口：参数名从 `created_at` 改为 `created_tms`，时间格式为 `YYYY-MM-DD HH:mm:ss`，返回值结构优化，排除冗余字段
- 更新 `GET /api/answers` 接口：返回值中每个答案新增 `created_tms` 字段

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **Content-Type**: `application/json`

## 认证

所有需要认证的接口都需要在请求头中包含 JWT token：

```
Authorization: Bearer <your-jwt-token>
```

## 接口列表

### 1. 用户认证

#### 1.1 Apple 登录

- **URL**: `POST /api/auth/apple`
- **描述**: 使用 Apple ID 登录
- **请求参数**:
  ```json
  {
    "identityToken": "eyJraWQiOiJXNldjT0tCIiwiYWxnIjoiUlMyNTYifQ...",
    "authorizationCode": "c1234567890abcdef"
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHVkMTIzNDU2IiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDEwODE2MDB9.signature",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHVkMTIzNDU2IiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDI1MzEyMDB9.signature",
      "user": {
        "id": "clud1234567890abcdef",
        "email": "user@privaterelay.appleid.com",
        "qod_strategy": "RANDOM"
      }
    }
  }
  ```
- **说明**:
  - `user.qod_strategy` 为用户的「今日问题」策略，取值为 `RANDOM`、`PINNED`、`MIXED`

#### 1.2 邮箱登录

- **URL**: `POST /api/auth/login`
- **描述**: 使用邮箱和密码登录
- **请求参数**:
  ```json
  {
    "email": "user@example.com",
    "password": "your_password"
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "clud1234567890abcdef",
        "email": "user@example.com",
        "qod_strategy": "RANDOM"
      }
    }
  }
  ```
- **说明**: `user.qod_strategy` 取值为 `RANDOM`、`PINNED`、`MIXED`

#### 1.3 邮箱注册

- **URL**: `POST /api/auth/signup`
- **描述**: 使用邮箱和密码注册新用户
- **请求参数**:
  ```json
  {
    "email": "user@example.com",
    "password": "your_password"
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "clud1234567890abcdef",
        "email": "user@example.com",
        "qod_strategy": "RANDOM"
      }
    }
  }
  ```
- **说明**: 新用户默认 `qod_strategy` 为 `RANDOM`

#### 1.4 刷新 Token

- **URL**: `POST /api/auth/refresh`
- **描述**: 使用 refresh token 获取新的 access token
- **请求参数**:
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHVkMTIzNDU2IiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDEwODE2MDB9.signature",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHVkMTIzNDU2IiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDI1MzEyMDB9.signature",
      "user": {
        "id": "clud1234567890abcdef",
        "email": "user@privaterelay.appleid.com",
        "qod_strategy": "RANDOM"
      }
    }
  }
  ```
- **说明**:
  - `user.qod_strategy` 为用户的「今日问题」策略，取值为 `RANDOM`、`PINNED`、`MIXED`

#### 1.5 保存设备Token

- **URL**: `POST /api/device-token`
- **描述**: 保存用户设备Token，用于后续推送通知功能
- **认证**: 需要
- **请求参数**:
  ```json
  {
    "deviceToken": "xxxxxxxxxxxxxxxxxxxx"
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "device_token": "xxxxxxxxxxxxxxxxxxxx"
    }
  }
  ```

#### 1.6 更新 QoD 策略

- **URL**: `POST /api/qod-strategy`
- **描述**: 用户修改自己的「今日问题」策略（Question of the Day 策略），仅能修改当前登录用户自己的配置
- **认证**: 需要
- **请求参数**:

  ```json
  {
    "qod_strategy": "RANDOM"
  }
  ```

  - `qod_strategy`：必填，取值为 `RANDOM`、`PINNED`、`MIXED` 之一

- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "qod_strategy": "RANDOM"
    }
  }
  ```
- **说明**:
  - **RANDOM**：沿用当前 QoD 逻辑（固定 QoD 表 + 随机候选补足到 3 题；不排除用户已 pinned 的题）
  - **PINNED**：仅从用户 pinned 题目中返回（需要至少 3 个 pinned 才可选）
  - **MIXED**：1 题来自 pinned，2 题来自随机（随机部分不包含 pinned；需要至少 1 个 pinned 才可选）

#### 1.7 获取 QoD 策略选项

- **URL**: `GET /api/qod-strategy-options`
- **描述**: 获取可用的「今日问题」策略选项，包含策略描述和可用性状态
- **认证**: 需要
- **响应示例**:
  ```json
  [
    {
      "value": "RANDOM",
      "label": "Random",
      "description": "Prompt randomly from question library",
      "disabled": false,
      "url": "https://little-things-app.oss-cn-shanghai.aliyuncs.com/qod-strategy/random.svg?OSSAccessKeyId=***&Expires=***&Signature=***"
    },
    {
      "value": "PINNED",
      "label": "Pinned",
      "description": "Only prompt from pinned questions",
      "disabled": true,
      "url": "https://little-things-app.oss-cn-shanghai.aliyuncs.com/qod-strategy/Star.svg?OSSAccessKeyId=***&Expires=***&Signature=***"
    },
    {
      "value": "MIXED",
      "label": "Mixed",
      "description": "Prompt from pinned questions & library",
      "disabled": true,
      "url": "https://little-things-app.oss-cn-shanghai.aliyuncs.com/qod-strategy/combine.svg?OSSAccessKeyId=***&Expires=***&Signature=***"
    }
  ]
  ```
- **说明**:
  - `value` 和 `label`：策略的枚举值
  - `description`：策略的中文描述
  - `url`：策略 icon 的 OSS 签名 URL（暂无则为 `null`）
  - `disabled`：
    - `RANDOM`：始终可用
    - `MIXED`：需要至少 1 个 pinned 问题
    - `PINNED`：需要至少 3 个 pinned 问题
  - `disabled`：是否禁用该选项
    - `RANDOM`：始终可用 (`disabled: false`)
    - `PINNED` 和 `MIXED`：仅当用户至少有一个星标问题时可用
  - 前端可根据 `disabled` 字段决定是否禁用相应选项

#### 1.7 获取个人信息

- **URL**: `GET /api/me`
- **描述**: 获取当前登录用户的个人信息
- **认证**: 需要
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "email": "user@example.com",
      "qod_strategy": "RANDOM",
      "last_login_at": "2026-02-03T08:00:00.000Z",
      "has_pinned_question": true,
      "report_persona_id": "cludpersona123456789",
      "report_persona": {
        "id": "cludpersona123456789",
        "label": "Persona 1: The Soul Gardener"
      }
    }
  }
  ```
- **说明**:
  - `email`：用户邮箱（可能为 null）
  - `qod_strategy`：用户的「今日问题」策略，取值为 `RANDOM`、`PINNED`、`MIXED`
  - `last_login_at`：最后登录时间，ISO 8601 格式
  - `has_pinned_question`：当前用户是否至少 pin 了一道题（boolean）
  - `report_persona_id`：当前选中的周报 AI Persona 的 id，未选时为 `null`
  - `report_persona`：当前选中的 Persona 摘要（`id`、`label`），未选时为 `null`。可用于前端展示当前选中项，完整列表见 `GET /api/ai-insights/personas`

### 2. 引导页面

#### 2.1 获取引导数据

- **URL**: `GET /api/onboard`
- **描述**: 获取引导页面的静态数据
- **认证**: 不需要
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "page1st": "the little things",
      "page2nd": "big thoughts, \ntiny moments.",
      "page3rd": "grow your reflections\ninto insights with\nguided questions",
      "page4th": "each answer will generate\na unique icon of your own"
    }
  }
  ```

#### 2.2 获取分类列表

- **URL**: `GET /api/categories`
- **描述**: 获取所有分类列表（仅包含顶层分类，按 sequence 排序）
- **认证**: 不需要
- **响应示例**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "clud1234567890abcdef",
        "name": "生活感悟",
        "image_url": "https://example.com/images/category1.jpg"
      },
      {
        "id": "clud0987654321fedcba",
        "name": "工作思考",
        "image_url": "https://example.com/images/category2.jpg"
      },
      {
        "id": "cludabcdef123456789",
        "name": "人际关系",
        "image_url": "https://example.com/images/category3.jpg"
      }
    ]
  }
  ```
- **说明**:
  - 只返回顶层分类（`parent_id` 为 `null` 的分类）
  - 按 `sequence` 字段升序排序
  - 每个分类包含 `id`、`name` 和 `image_url` 字段

#### 2.3 获取分类下的问题

- **URL**: `GET /api/categories/:categoryId/head`
- **描述**: 获取指定分类下的第一个问题
- **认证**: 不需要
- **路径参数**:
  - `categoryId`: 分类ID
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "id": "cludquestion123456789",
      "title": "今天让你感到最温暖的小事是什么？"
    }
  }
  ```

### 3. 问题回答

#### 3.1 创建答案

- **URL**: `POST /api/answers`
- **描述**: 回答指定问题
- **认证**: 需要
- **请求参数**:
  ```json
  {
    "question_id": "cludquestion123456789",
    "content": "今天早上邻居帮我提了重物上楼，虽然只是一个小举动，但让我一整天都感到温暖。",
    "created_tms": "2024-01-15 08:30:45"
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "id": "cludanswer123456789",
      "content": "今天早上邻居帮我提了重物上楼，虽然只是一个小举动，但让我一整天都感到温暖。",
      "question_snapshot": "今天让你感到最温暖的小事是什么？",
      "created_ymd": "2024-01-15",
      "created_tms": "2024-01-15 08:30:45",
      "user": {
        "id": "clud1234567890abcdef",
        "email": "user@privaterelay.appleid.com"
      },
      "question": {
        "id": "cludquestion123456789",
        "title": "今天让你感到最温暖的小事是什么？",
        "category": {
          "id": "clud1234567890abcdef",
          "name": "生活感悟"
        }
      },
      "icon": {
        "id": "cludicon123456789",
        "status": "PENDING"
      }
    }
  }
  ```
- **说明**:
  - 创建答案时会自动创建图标生成任务
  - `icon.status` 可能的值：`PENDING`（生成中）、`GENERATED`（已生成）、`FAILED`（生成失败）
  - 图标生成是异步进行的，可通过 `/api/icon/progress/:iconId` 接口获取生成进度

#### 3.2 获取用户历史答案

- **URL**: `GET /api/answers`
- **描述**: 获取用户在指定问题下的所有回答，支持分页
- **认证**: 需要
- **查询参数**:
  - `question_id`: 问题ID（必填）
  - `limit`: 每页数量（可选）
  - `cursor`: 游标位置，用于分页（可选）
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "daysOver": 15,
        "totalAnswers": 8,
        "firstAnswerAt": "2024-01-01",
        "lastAnswerAt": "2024-01-15"
      },
      "answers": [
        {
          "id": "cludanswer123456789",
          "content": "今天早上邻居帮我提了重物上楼，虽然只是一个小举动，但让我一整天都感到温暖。",
          "created_ymd": "2024-01-15",
          "created_tms": "2024-01-15 08:30:45",
          "icon": {
            "url": "https://your-oss-bucket.oss-region.aliyuncs.com/icons/cludicon123456789-1234567890.webp?Expires=1234567890&OSSAccessKeyId=xxx&Signature=xxx",
            "status": "GENERATED"
          }
        },
        {
          "id": "cludanswer098765432",
          "content": "昨天朋友送了我一束花，让我感到很惊喜。",
          "created_ymd": "2024-01-14",
          "created_tms": "2024-01-14 10:20:30",
          "icon": {
            "url": "",
            "status": "PENDING"
          }
        }
      ],
      "pagination": {
        "limit": 10,
        "hasMore": false,
        "nextCursor": null
      }
    }
  }
  ```
- **说明**:
  - 分页（滚动加载）
    - 如果不传递limit和cursor，会返回所有回答
    - 首次调用时传递limit，cursor不用传，此时会返回固定条数的answers，如果`hasMore`为true，则说明仍然有值，要继续获取，则需要传递cursor字段，值为上一个接口中的`pagination.nextCursor`值，直到`hasMore`变为false
  - `icon` 字段说明：
    - `status` 可能的值：`PENDING`（生成中）、`GENERATED`（已生成）、`FAILED`（生成失败）
    - 当 `status` 为 `GENERATED` 时，`url` 字段包含签名后的图标访问地址（有效期1小时）
    - 当 `status` 为 `PENDING` 或 `FAILED` 时，`url` 为空字符串
    - 如果答案没有关联的图标，`icon` 为 `null`

#### 3.3 删除回答

- **URL**: `DELETE /api/answers/:id`
- **描述**: 删除指定的回答（软删除）
- **认证**: 需要
- **路径参数**:
  - `id`: 回答ID
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "id": "cludanswer123456789",
      "content": "今天早上邻居帮我提了重物上楼，虽然只是一个小举动，但让我一整天都感到温暖。",
      "created_ymd": "2024-01-15",
      "created_tms": "2024-01-15 08:30:45"
    }
  }
  ```
- **错误响应**:
  - 回答不存在：返回 `404 Not Found`
  - 无权限删除（不是自己的回答）：返回 `403 Forbidden`
- **说明**:
  - 用户只能删除自己的回答
  - 执行软删除，设置 `deleted_at` 字段
  - 返回被删除的回答信息

### 4. 问题管理

#### 4.1 获取问题列表

- **URL**: `GET /api/questions`
- **描述**: 获取所有分类和问题，包含用户的pin状态
- **认证**: 需要
- **响应示例**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "clud1234567890abcdef",
        "name": "生活感悟",
        "questions": [
          {
            "id": "cludquestion123456789",
            "title": "今天让你感到最温暖的小事是什么？",
            "pinned": true
          },
          {
            "id": "cludquestion098765432",
            "title": "今天有什么让你感到感激的事情？",
            "pinned": false
          }
        ]
      }
    ]
  }
  ```

#### 4.2 Pin/Unpin 问题

- **URL**: `POST /api/questions/pin`
- **描述**: 标记或取消标记问题
- **认证**: 需要
- **请求参数**:
  ```json
  {
    "question_id": "cludquestion123456789",
    "pinned": true
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "question_id": "cludquestion123456789",
      "pinned": true
    }
  }
  ```

#### 4.3 获取今日问题

- **URL**: `GET /api/questions-of-the-day`
- **描述**: 获取每日推荐的 3 个问题（Question of the Day）。返回结果由用户自己的 `qod_strategy` 决定，可通过 `POST /api/qod-strategy` 修改。
- **认证**: 需要
- **响应示例**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cludquestion123456789",
        "title": "What was one little thing that you feel proud of yourself for today?",
        "category": {
          "name": "small wins"
        }
      },
      {
        "id": "cludquestion098765432",
        "title": "今天有什么让你感到感激的事情？",
        "category": {
          "name": "gratitude"
        }
      },
      {
        "id": "cludquestionabcdef123",
        "title": "今天哪个瞬间让你想停下来好好感受？",
        "category": {
          "name": "present moment"
        }
      }
    ]
  }
  ```
- **说明**:
  - **策略（qod_strategy）**：用户拥有 QoD 策略字段，默认 `RANDOM`。不同策略下返回逻辑如下：
    - **RANDOM**：沿用当前 QoD 逻辑。固定 QoD 表 + 随机候选补足到 3 题，排除用户已 pin 的题；同一用户同一天返回相同 3 题（确定性随机）；三维度（category、sub_category、cluster）不重复。
    - **PINNED**：每天三个问题都来自用户自己 pin 的题目；不足 3 题则返回实际数量；同一天内结果确定性。
    - **MIXED**：部分来自用户 pinned，部分来自当前 QoD 逻辑，共最多 3 题。
  - **数量说明**：
    - 正常情况返回最多 3 个问题
    - 若符合条件的问题不足 3 个，返回实际找到的数量
    - PINNED 策略下若用户未 pin 任何题，返回空数组 `[]`

### 5. 视图模式

#### 5.1 Calendar视图

- **URL**: `GET /api/calendar-view`
- **描述**: 获取指定日期范围的日历视图数据，显示每天的所有回答
- **认证**: 需要
- **查询参数**:
  - `start`: 开始日期，格式为 YYYY-MM-DD（必填）
  - `end`: 结束日期，格式为 YYYY-MM-DD（必填）
- **说明**:
  - 每个 reflection 包含 `id`、`content`、`created_ymd`、`question` 和 `icon` 字段
  - `question` 字段包含问题的 `id`、`title` 和 `category` 信息（`category` 包含 `id` 和 `name`）
  - `icon` 字段说明同 `GET /api/answers` 接口
- **响应示例**:
  ```json
  {
    "success": true,
    "data": [
      {
        "date": "2024-01-15",
        "reflections": [
          {
            "id": "cludanswer123456789",
            "content": "今天早上邻居帮我提了重物上楼，虽然只是一个小举动，但让我一整天都感到温暖。",
            "created_ymd": "2024-01-15",
            "question": {
              "id": "cludquestion123456789",
              "title": "今天让你感到最温暖的小事是什么？",
              "category": {
                "id": "clud1234567890abcdef",
                "name": "生活感悟"
              }
            },
            "icon": {
              "id": "cludicon123456789",
              "url": "https://your-oss-bucket.oss-region.aliyuncs.com/icons/cludicon123456789-1234567890.webp?Expires=1234567890&OSSAccessKeyId=xxx&Signature=xxx",
              "status": "GENERATED"
            }
          },
          {
            "id": "cludanswer987654321",
            "content": "下午在公园散步时看到了一朵美丽的花。",
            "created_ymd": "2024-01-15",
            "question": {
              "id": "cludquestion098765432",
              "title": "今天有什么让你感到感激的事情？",
              "category": {
                "id": "clud0987654321fedcba",
                "name": "人际关系"
              }
            },
            "icon": {
              "id": "cludicon987654321",
              "url": "",
              "status": "PENDING"
            }
          }
        ]
      },
      {
        "date": "2024-01-16",
        "reflections": [
          {
            "id": "cludanswer098765432",
            "content": "今天在咖啡店遇到了一位友善的陌生人，我们聊了很久。",
            "created_ymd": "2024-01-16",
            "question": {
              "id": "cludquestionabcdef123",
              "title": "今天哪个瞬间让你想停下来好好感受？",
              "category": {
                "id": "cludabcdef123456789",
                "name": "工作思考"
              }
            },
            "icon": null
          }
        ]
      }
    ]
  }
  ```

#### 5.2 Thread视图

- **URL**: `GET /api/thread-view`
- **描述**: 获取用户所有回答过的问题的线程视图，显示每个问题的所有答案和生成的 icon
- **认证**: 需要
- **查询参数**:
  - `categoryId`: 分类ID（可选）。如果提供，则只返回该分类下的问题
- **说明**:
  - 显示所有用户回答过的问题（不管是否 pin）
  - 如果提供了 `categoryId` 参数，则只返回该分类下的问题
  - 问题排序规则：
    1. pinned 问题优先于 unpinned 问题
    2. 在相同 pinned 状态下，按最新回答时间排序（最新的在前）
  - 每个问题显示所有答案（不再限制数量）
  - 答案排序规则：按 icon 创建时间排序（最新生成的 icon 对应的答案在最前）
    - 有 icon 的答案排在没有 icon 的答案之前
    - 没有 icon 的答案之间，按答案创建时间排序
  - 每个问题包含以下字段：
    - `pinned`（boolean 类型）：表示该问题是否被用户 pin
    - `category`（对象或 null）：问题的分类信息，包含 `id` 和 `name` 字段
    - `sub_category`（对象或 null）：问题的子分类信息，包含 `id` 和 `name` 字段
  - 每个答案包含 `icon` 字段，字段说明同 `GET /api/answers` 接口
- **响应示例**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cludquestion123456789",
        "title": "今天让你感到最温暖的小事是什么？",
        "pinned": true,
        "category": {
          "id": "clud1234567890abcdef",
          "name": "生活感悟"
        },
        "sub_category": {
          "id": "clud0987654321fedcba",
          "name": "日常小事"
        },
        "answers": [
          {
            "id": "cludanswer123456789",
            "content": "今天早上邻居帮我提了重物上楼，虽然只是一个小举动，但让我一整天都感到温暖。",
            "created_ymd": "2024-01-15",
            "icon": {
              "id": "cludicon123456789",
              "url": "https://your-oss-bucket.oss-region.aliyuncs.com/icons/cludicon123456789-1234567890.webp?Expires=1234567890&OSSAccessKeyId=xxx&Signature=xxx",
              "status": "GENERATED"
            }
          },
          {
            "id": "cludanswer098765432",
            "content": "昨天朋友送了我一束花，让我感到很惊喜。",
            "created_ymd": "2024-01-14",
            "icon": {
              "id": "cludicon098765432",
              "url": "",
              "status": "PENDING"
            }
          }
        ]
      }
    ]
  }
  ```

#### 5.3 读取周报

- **URL**: `GET /api/weekly-report`
- **描述**: 读取已生成的周报（仅读库，不触发生成）。返回结构化内容 `report_json`、参与该周报的图标列表 `icons`（带签名 URL），以及报告周期的开始/结束日期。若该周报尚未阅读，会在读取时自动标记为已读并写入 `read_at`。
- **认证**: 需要
- **查询参数**:
  - `week`: 周标识（可选）。格式为 `YYYY-Wnn`（如 `2024-W43`）。不传则返回当前用户**最新一条**周报；传入则返回该周的报告。
- **响应示例**:
  ```json
  {
    "id": "cludreport123456789",
    "week": "2024-W43",
    "period_start": "2024-10-21",
    "period_end": "2024-10-27",
    "reflection_count": 9,
    "read_at": "2026-03-18T03:20:00.000Z",
    "report_json": {
      "summary": "这一周你记录了 9 次反思...",
      "gem": {
        "scene": "On Wednesday afternoon, you sat by the window with a freshly brewed coffee in your hands.",
        "evidence": "'At that moment, I suddenly relaxed and felt the day was not as bad as I thought.'",
        "insight": "In that moment, you must have felt a quiet sense of being held by something small but steady."
      },
      "analyticalOverview": [
        { "title": "咖啡与专注", "content": "Coffee is your reliable focus trigger..." },
        { "title": "人际联结", "content": "..." },
        { "title": "情绪基调", "content": "..." }
      ]
    },
    "icons": [
      { "id": "cludicon123456789", "url": "https://..." },
      { "id": "cludicon098765432", "url": "https://..." }
    ]
  }
  ```
- **错误响应**:
  - 无报告（不传 week 时该用户没有任何报告，或传 week 时该周无记录）：返回 `404 Not Found`
  - 传了 `week` 但格式错误（非 `YYYY-Wnn`）：返回 `400 Bad Request`
- **说明**:
  - 周报由后台或 admin 侧生成并写入库，本接口仅读取，不调用 AI 生成
  - `report_json` 可能为 `null`（例如报告尚未生成完仅有 Tier1 时），`icons` 仍会返回
  - `icons` 中 `url` 为签名后的可访问地址
  - `read_at`：`null` 表示未读，非 `null` 表示已读时间（ISO 8601）

#### 5.4 获取周报列表

- **URL**: `GET /api/weekly-reports`
- **描述**: 分页获取当前用户的周报列表，返回简要信息，适合列表展示。
- **认证**: 需要
- **查询参数**:
  - `limit`: 每页数量（可选，默认 20，最大 100）
  - `cursor`: 周标识（可选）。格式 `YYYY-Wnn`。传入则返回该周之前的报告，用于分页
  - `isRead`: 读状态筛选（可选）。`true` 仅返回已读（`read_at != null`），`false` 仅返回未读（`read_at = null`）；不传则返回全部
- **响应示例**:
  ```json
  {
    "reports": [
      {
        "id": "cludreport123456789",
        "week": "2024-W43",
        "period_start": "2024-10-21",
        "period_end": "2024-10-27",
        "reflection_count": 9,
        "read_at": null
      }
    ],
    "pagination": {
      "limit": 20,
      "hasMore": true,
      "nextCursor": "2024-W36"
    }
  }
  ```
- **说明**:
  - 按 week 降序返回（最新在前）
  - `read_at`：`null` 表示未读，非 `null` 表示已读时间（ISO 8601）
  - 示例：
    - `GET /api/weekly-reports?isRead=false`：仅未读
    - `GET /api/weekly-reports?isRead=true`：仅已读
  - 获取单条周报详情请使用 `GET /api/weekly-report?week=YYYY-Wnn`

#### 5.5 标记周报已读

- **URL**: `POST /api/weekly-report/read`
- **描述**: 显式将指定周报标记为已读（幂等）。若此前已读，则返回原有 `read_at`。
- **认证**: 需要
- **请求参数**:
  ```json
  {
    "week": "2024-W43"
  }
  ```
- **响应示例**:
  ```json
  {
    "week": "2024-W43",
    "read_at": "2026-03-18T03:20:00.000Z"
  }
  ```
- **错误响应**:
  - `week` 缺失或格式错误（非 `YYYY-Wnn`）：返回 `400 Bad Request`
  - 该周报不存在：返回 `404 Not Found`

### 6. AI Insights

#### 6.1 获取 Report Persona 列表

- **URL**: `GET /api/ai-insights/personas`
- **描述**: 获取所有可用的 Report Persona 选项，供前端选择
- **认证**: 需要
- **响应示例**:
  ```json
  [
    {
      "id": "cludpersona123456789",
      "label": "Empathetic Friend",
      "description": "A warm and supportive tone that focuses on emotional connection"
    },
    {
      "id": "cludpersona098765432",
      "label": "Analytical Coach",
      "description": "A structured and insightful tone that focuses on patterns and growth"
    }
  ]
  ```
- **说明**:
  - 按 `label` 字母升序排列
  - `description` 可能为 `null`

#### 6.2 更新 Report Persona

- **URL**: `POST /api/ai-insights/report-persona`
- **描述**: 更新当前用户的 Report Persona（影响周报生成风格）
- **认证**: 需要
- **请求参数**:
  ```json
  {
    "report_persona_id": "cludpersona123456789"
  }
  ```
- **响应示例**:
  ```json
  {
    "report_persona_id": "cludpersona123456789"
  }
  ```
- **错误响应**:
  - `report_persona_id` 未提供：返回 `400 Bad Request`
  - `report_persona_id` 无效（不存在）：返回 `400 Bad Request`

#### 6.3 获取当周已生成图标

- **URL**: `GET /api/weekly-report/current`
- **描述**: 获取当前用户本周已生成完成（`GENERATED`）的 icon 列表
- **认证**: 需要
- **响应示例**:
  ```json
  {
    "minAnswersToGenerateReport": 6,
    "icons": [
      {
        "id": "cludicon123456789",
        "answer_id": "cludanswer123456789",
        "created_ymd": "2026-03-16",
        "url": "https://your-oss-bucket.oss-region.aliyuncs.com/icons/cludicon123456789-1234567890.webp?Expires=1234567890&OSSAccessKeyId=xxx&Signature=xxx"
      },
      {
        "id": "cludicon987654321",
        "answer_id": "cludanswer987654321",
        "created_ymd": "2026-03-17",
        "url": "https://your-oss-bucket.oss-region.aliyuncs.com/icons/cludicon987654321-1234567890.webp?Expires=1234567890&OSSAccessKeyId=xxx&Signature=xxx"
      }
    ]
  }
  ```
- **说明**:
  - `minAnswersToGenerateReport`：生成周报所需的最少 answer 数（当前为 6）
  - 仅返回状态为 `GENERATED` 的 icon
  - 仅统计当前用户、且 answer 未软删除（`deleted_at = null`）
  - 仅返回当前周范围内（基于 answer 的 `created_ymd`）的数据
  - 返回结果按 icon 的 `created_at` 升序（最早生成在前）
  - `url` 为签名后的可访问地址
  - 无数据时返回 `{ "minAnswersToGenerateReport": 6, "icons": [] }`

### 7. 图标生成

#### 7.1 获取图标生成进度

- **URL**: `GET /api/icon/progress/:iconId`
- **描述**: 通过 Server-Sent Events (SSE) 获取图标生成进度
- **认证**: 不需要
- **路径参数**:
  - `iconId`: 图标ID（从创建答案接口的响应中获取）
- **响应格式**: SSE 事件流
- **事件数据格式**:
  ```json
  {
    "data": {
      "status": "PENDING",
      "url": ""
    }
  }
  ```
- **状态说明**:
  - `PENDING`: 图标正在生成中
  - `GENERATED`: 图标已生成成功，`url` 字段包含图标的访问地址（带签名，有效期1小时）
  - `FAILED`: 图标生成失败
- **使用说明**:
  - 连接后立即返回当前状态
  - 如果状态为 `PENDING`，每5秒轮询一次状态
  - 当状态变为 `GENERATED` 或 `FAILED` 时，发送最后一次更新后关闭连接
  - 客户端应使用 EventSource 或类似的 SSE 客户端库来接收事件
- **响应示例**:

  ```
  data: {"status":"PENDING","url":""}

  data: {"status":"PENDING","url":""}

  data: {"status":"GENERATED","url":"https://your-oss-bucket.oss-region.aliyuncs.com/icons/cludicon123456789-1234567890.webp?Expires=1234567890&OSSAccessKeyId=xxx&Signature=xxx"}
  ```

## 错误响应

### 常见错误码

- **400 Bad Request**: 请求参数错误
- **401 Unauthorized**: 未认证或认证失败
- **500 Internal Server Error**: 服务器内部错误

### 错误响应格式

```json
{
  "success": false,
  "data": null,
  "message": "......"
}
```
