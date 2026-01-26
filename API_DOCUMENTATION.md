# Little Things API 接口文档

## Changelog

### 2026-01-26

- 新增 `DELETE /api/answers/:id` 接口：允许用户删除自己的回答

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
        "email": "user@privaterelay.appleid.com"
      }
    }
  }
  ```

#### 1.2 刷新 Token

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
        "email": "user@privaterelay.appleid.com"
      }
    }
  }
  ```

#### 1.3 保存设备Token

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
- **描述**: 获取所有分类列表
- **认证**: 不需要
- **响应示例**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "clud1234567890abcdef",
        "name": "生活感悟"
      },
      {
        "id": "clud0987654321fedcba",
        "name": "工作思考"
      },
      {
        "id": "cludabcdef123456789",
        "name": "人际关系"
      }
    ]
  }
  ```

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
- **描述**: 删除指定的回答
- **认证**: 需要
- **路径参数**:
  - `id`: 回答ID
- **响应示例**:
  ```json
  {
    "success": true,
  }
  ```
- **错误响应**:
  - 回答不存在：返回 `404 Not Found`
  - 无权限删除（不是自己的回答）：返回 `403 Forbidden`
- **说明**:
  - 用户只能删除自己的回答

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
- **描述**: 获取每日推荐的3个问题（Question of the Day）
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
  - **确定性随机**：同一用户在同一天内多次调用，返回相同的3个问题（基于 userId + 日期作为随机种子）
  - **排除 Pinned 问题**：返回的问题不包含用户已 pinned 的问题
  - **三维度去重**：返回的3个问题保证 `category`、`sub_category`、`cluster` 三个维度各自不重复（这是内部选择逻辑，确保问题多样性）
    - 每个问题的 `category` 不同
    - 每个问题的 `sub_category` 不同
    - 每个问题的 `cluster` 不同
  - **数量说明**：
    - 正常情况返回3个问题
    - 如果符合条件的问题不足3个，返回实际找到的问题数量
    - 如果所有问题都被用户 pinned，返回空数组 `[]`

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
- **说明**:
  - 显示所有用户回答过的问题（不管是否 pin）
  - 问题排序规则：
    1. pinned 问题优先于 unpinned 问题
    2. 在相同 pinned 状态下，按最新回答时间排序（最新的在前）
  - 每个问题显示所有答案（不再限制数量）
  - 答案排序规则：按 icon 创建时间排序（最新生成的 icon 对应的答案在最前）
    - 有 icon 的答案排在没有 icon 的答案之前
    - 没有 icon 的答案之间，按答案创建时间排序
  - 每个问题包含 `pinned` 字段（boolean 类型），表示该问题是否被用户 pin
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

### 6. 图标生成

#### 6.1 获取图标生成进度

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
