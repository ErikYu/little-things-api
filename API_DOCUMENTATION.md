# Little Things API 接口文档

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
    "content": "今天早上邻居帮我提了重物上楼，虽然只是一个小举动，但让我一整天都感到温暖。"
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "id": "cludanswer123456789",
      "content": "今天早上邻居帮我提了重物上楼，虽然只是一个小举动，但让我一整天都感到温暖。",
      "user_id": "clud1234567890abcdef",
      "question_id": "cludquestion123456789",
      "question_snapshot": "今天让你感到最温暖的小事是什么？",
      "created_at": "2024-01-15T08:30:45.123Z",
      "updated_at": "2024-01-15T08:30:45.123Z",
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
      }
    }
  }
  ```

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

### 5. 视图模式

#### 5.1 Calendar视图

- **URL**: `GET /api/calendar-view`
- **描述**: 获取指定月份的日历视图数据，显示每天的第一个回答
- **认证**: 需要
- **查询参数**:
  - `month`: 月份，格式为 YYYY-MM（可选，默认为当前月份）
- **响应示例**:
  ```json
  {
    "success": true,
    "data": [
      {
        "date": "2024-01-15",
        "first": {
          "id": "cludanswer123456789",
          "content": "今天早上邻居帮我提了重物上楼，虽然只是一个小举动，但让我一整天都感到温暖。"
        }
      },
      {
        "date": "2024-01-16",
        "first": {
          "id": "cludanswer098765432",
          "content": "今天在咖啡店遇到了一位友善的陌生人，我们聊了很久。"
        }
      }
    ]
  }
  ```

#### 5.2 Thread视图

- **URL**: `GET /api/thread-view`
- **描述**: 获取用户已pin问题的线程视图，显示每个问题的最新3个答案
- **认证**: 需要
- **响应示例**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cludquestion123456789",
        "title": "今天让你感到最温暖的小事是什么？",
        "answers": [
          {
            "id": "cludanswer123456789",
            "content": "今天早上邻居帮我提了重物上楼，虽然只是一个小举动，但让我一整天都感到温暖。",
            "created_at": "2024-01-15T08:30:45.123Z"
          },
          {
            "id": "cludanswer098765432",
            "content": "昨天朋友送了我一束花，让我感到很惊喜。",
            "created_at": "2024-01-14T10:20:30.456Z"
          }
        ]
      }
    ]
  }
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
