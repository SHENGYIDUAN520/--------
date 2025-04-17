# 智能陪护监控平台 - API接口文档

## API概述

智能陪护监控平台API采用RESTful设计风格，使用HTTP标准方法进行资源操作。所有请求和响应均使用JSON格式，API版本通过URL路径指定。

**基础URL**: `http://47.97.160.91:5000/api`

## 通用规范

### 请求格式
- 请求体格式: JSON
- 内容类型: `Content-Type: application/json`
- 认证令牌: 在HTTP头部使用`Authorization: Bearer <token>`

### 响应格式
所有API响应使用统一的JSON格式：
```json
{
  "code": 200,           // HTTP状态码
  "message": "成功",      // 操作结果消息
  "data": {}             // 响应数据
}
```

### 状态码
- 200: 成功
- 400: 请求参数错误
- 401: 未授权/认证失败
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

## 认证相关API

### 用户登录
- **URL**: `/auth/login`
- **方法**: `POST`
- **描述**: 用户登录并获取访问令牌
- **请求参数**:
  ```json
  {
    "username": "admin",      // 用户名
    "password": "admin123"     // 密码
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "登录成功",
    "data": {
      "token": "eyJhbGciOiJ...",
      "user": {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "email": "admin@example.com"
      }
    }
  }
  ```

### 用户注册
- **URL**: `/auth/register`
- **方法**: `POST`
- **描述**: 注册新用户
- **请求参数**:
  ```json
  {
    "username": "newuser",    // 用户名
    "password": "password123", // 密码
    "email": "user@example.com", // 可选
    "phone": "13800138000"      // 可选
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 201,
    "message": "注册成功",
    "data": {
      "user_id": 2,
      "username": "newuser"
    }
  }
  ```

### 用户登出
- **URL**: `/auth/logout`
- **方法**: `POST`
- **描述**: 用户退出登录，清除会话
- **请求头**: 需要包含授权令牌
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "登出成功",
    "data": {}
  }
  ```

## 用户管理API

### 获取用户个人资料
- **URL**: `/user/profile`
- **方法**: `GET`
- **描述**: 获取当前登录用户的个人资料
- **请求参数**: `?username=admin`
- **请求头**: 需要包含授权令牌
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "email": "admin@example.com",
      "phone": "13800138000",
      "real_name": "管理员"
    }
  }
  ```

### 更新用户个人资料
- **URL**: `/user/profile`
- **方法**: `PUT`
- **描述**: 更新当前用户的个人资料
- **请求头**: 需要包含授权令牌
- **请求参数**:
  ```json
  {
    "email": "newemail@example.com",
    "phone": "13900139000"
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "用户资料已更新",
    "data": {}
  }
  ```

### 修改密码
- **URL**: `/user/password`
- **方法**: `PUT`
- **描述**: 修改当前用户的密码
- **请求头**: 需要包含授权令牌
- **请求参数**:
  ```json
  {
    "current_password": "oldpassword",
    "new_password": "newpassword"
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "密码已更新，请重新登录",
    "data": {}
  }
  ```

## 老人信息API

### 获取所有老人列表
- **URL**: `/seniors`
- **方法**: `GET`
- **描述**: 获取所有老人的基本信息列表
- **请求头**: 需要包含授权令牌
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": [
      {
        "id": 1,
        "name": "张三",
        "age": 75,
        "gender": "male",
        "room_id": "301",
        "emergency_contact": "张小三",
        "emergency_phone": "13800138000"
      },
      ...
    ]
  }
  ```

### 获取单个老人详情
- **URL**: `/seniors/{senior_id}`
- **方法**: `GET`
- **描述**: 根据ID获取老人的详细信息
- **请求头**: 需要包含授权令牌
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "id": 1,
      "name": "张三",
      "age": 75,
      "gender": "male",
      "address": "北京市海淀区",
      "room_id": "301",
      "emergency_contact": "张小三",
      "emergency_phone": "13800138000",
      "health_notes": "高血压，需要定期测量血压"
    }
  }
  ```

### 添加老人信息
- **URL**: `/seniors`
- **方法**: `POST`
- **描述**: 添加新的老人信息
- **请求头**: 需要包含授权令牌
- **请求参数**:
  ```json
  {
    "name": "李四",
    "age": 68,
    "gender": "male",
    "room_id": "302",
    "emergency_contact": "李小四",
    "emergency_phone": "13900139000",
    "health_notes": "糖尿病史"
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 201,
    "message": "老人信息添加成功",
    "data": {
      "senior_id": 2
    }
  }
  ```

### 更新老人信息
- **URL**: `/seniors/{senior_id}`
- **方法**: `PUT`
- **描述**: 更新指定老人的信息
- **请求头**: 需要包含授权令牌
- **请求参数**:
  ```json
  {
    "emergency_contact": "新联系人",
    "emergency_phone": "13911112222",
    "health_notes": "更新的健康记录"
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "老人信息更新成功",
    "data": {}
  }
  ```

### 删除老人信息
- **URL**: `/seniors/{senior_id}`
- **方法**: `DELETE`
- **描述**: 删除指定老人的信息
- **请求头**: 需要包含授权令牌
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "老人信息删除成功",
    "data": {}
  }
  ```

## 摄像头API

### 获取所有摄像头列表
- **URL**: `/cameras`
- **方法**: `GET`
- **描述**: 获取所有摄像头的信息
- **请求头**: 需要包含授权令牌
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": [
      {
        "id": 1,
        "device_id": "CAM001",
        "name": "主卧摄像头",
        "location": "卧室",
        "room_id": "301",
        "stream_url": "rtsp://47.97.160.91:8554/cam1",
        "status": 1
      },
      ...
    ]
  }
  ```

### 获取单个摄像头详情
- **URL**: `/cameras/{camera_id}`
- **方法**: `GET`
- **描述**: 获取指定摄像头的详细信息
- **请求头**: 需要包含授权令牌
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "id": 1,
      "device_id": "CAM001",
      "name": "主卧摄像头",
      "location": "卧室",
      "room_id": "301",
      "stream_url": "rtsp://47.97.160.91:8554/cam1",
      "k230_ip": "192.168.1.100",
      "resolution": "1080p",
      "fps": 25,
      "status": 1
    }
  }
  ```

### 更新摄像头状态
- **URL**: `/cameras/{camera_id}/status`
- **方法**: `PUT`
- **描述**: 更新指定摄像头的状态
- **请求头**: 需要包含授权令牌
- **请求参数**:
  ```json
  {
    "status": 1  // 1: 在线, 0: 离线
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "摄像头状态更新成功",
    "data": {}
  }
  ```

### 获取指定房间的摄像头
- **URL**: `/rooms/{room_id}/cameras`
- **方法**: `GET`
- **描述**: 获取指定房间的所有摄像头信息
- **请求头**: 需要包含授权令牌
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": [
      {
        "id": 1,
        "device_id": "CAM001",
        "name": "主卧摄像头",
        "location": "卧室",
        "room_id": "301",
        "stream_url": "rtsp://47.97.160.91:8554/cam1",
        "status": 1
      },
      ...
    ]
  }
  ```

## 设备状态API

### 获取设备状态
- **URL**: `/devices/{device_id}/status`
- **方法**: `GET`
- **描述**: 获取指定设备的状态信息
- **请求头**: 需要包含授权令牌
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "id": 1,
      "device_id": "CAM001",
      "status": 1,
      "last_active": "2024-05-25T10:30:00Z",
      "connection_info": "{\"ip\":\"192.168.1.100\",\"port\":8554}"
    }
  }
  ```

### 更新设备状态
- **URL**: `/devices/{device_id}/status`
- **方法**: `PUT`
- **描述**: 更新指定设备的状态信息
- **请求头**: 需要包含授权令牌
- **请求参数**:
  ```json
  {
    "status": 1,
    "connection_info": "{\"ip\":\"192.168.1.100\",\"port\":8554}"
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "设备状态更新成功",
    "data": {}
  }
  ```

## 报警事件API

### 获取最近报警
- **URL**: `/alarms/recent`
- **方法**: `GET`
- **描述**: 获取最近的报警事件
- **请求头**: 需要包含授权令牌
- **请求参数**: `?limit=10` (可选，默认为10)
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": [
      {
        "id": 1,
        "event_type": "fall",
        "event_level": "danger",
        "description": "检测到跌倒事件",
        "image_url": "/static/images/alarms/1.jpg",
        "video_clip_url": "/static/videos/alarms/1.mp4",
        "status": "new",
        "created_at": "2024-05-25T10:30:00Z",
        "senior_name": "张三",
        "senior_age": 75,
        "room_id": "301"
      },
      ...
    ]
  }
  ```

### 获取老人报警记录
- **URL**: `/seniors/{senior_id}/alarms`
- **方法**: `GET`
- **描述**: 获取指定老人的报警记录
- **请求头**: 需要包含授权令牌
- **请求参数**: `?limit=20` (可选，默认为20)
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": [
      {
        "id": 1,
        "event_type": "fall",
        "event_level": "danger",
        "description": "检测到跌倒事件",
        "image_url": "/static/images/alarms/1.jpg",
        "video_clip_url": "/static/videos/alarms/1.mp4",
        "status": "new",
        "created_at": "2024-05-25T10:30:00Z"
      },
      ...
    ]
  }
  ```

### 添加报警事件
- **URL**: `/alarms`
- **方法**: `POST`
- **描述**: 添加新的报警事件
- **请求头**: 需要包含授权令牌
- **请求参数**:
  ```json
  {
    "senior_id": 1,
    "camera_id": 1,
    "event_type": "fall",
    "event_level": "danger",
    "description": "检测到跌倒事件",
    "image_url": "/static/images/alarms/1.jpg",
    "video_clip_url": "/static/videos/alarms/1.mp4"
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 201,
    "message": "报警事件添加成功",
    "data": {
      "alarm_id": 2
    }
  }
  ```

### 更新报警状态
- **URL**: `/alarms/{alarm_id}/status`
- **方法**: `PUT`
- **描述**: 更新指定报警事件的状态
- **请求头**: 需要包含授权令牌
- **请求参数**:
  ```json
  {
    "status": "processing"  // new, processing, resolved
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "报警事件状态更新成功",
    "data": {}
  }
  ```

## 视频记录API

### 获取摄像头视频记录
- **URL**: `/cameras/{camera_id}/videos`
- **方法**: `GET`
- **描述**: 获取指定摄像头的视频记录
- **请求头**: 需要包含授权令牌
- **请求参数**: `?limit=20` (可选，默认为20)
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": [
      {
        "id": 1,
        "camera_id": 1,
        "senior_id": 1,
        "start_time": "2024-05-25T10:00:00Z",
        "end_time": "2024-05-25T10:10:00Z",
        "duration": 600,
        "file_url": "/static/videos/records/1.mp4",
        "file_size": 15000000
      },
      ...
    ]
  }
  ```

### 添加视频记录
- **URL**: `/videos`
- **方法**: `POST`
- **描述**: 添加新的视频记录
- **请求头**: 需要包含授权令牌
- **请求参数**:
  ```json
  {
    "camera_id": 1,
    "senior_id": 1,
    "start_time": "2024-05-25T11:00:00Z"
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 201,
    "message": "视频记录添加成功",
    "data": {
      "video_id": 2
    }
  }
  ```

### 更新视频记录
- **URL**: `/videos/{video_id}`
- **方法**: `PUT`
- **描述**: 更新指定视频记录的信息
- **请求头**: 需要包含授权令牌
- **请求参数**:
  ```json
  {
    "end_time": "2024-05-25T11:10:00Z",
    "duration": 600,
    "file_url": "/static/videos/records/2.mp4",
    "file_size": 16000000
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "视频记录更新成功",
    "data": {}
  }
  ```

## 仪表盘API

### 获取仪表盘数据
- **URL**: `/dashboard/stats`
- **方法**: `GET`
- **描述**: 获取仪表盘统计数据
- **请求头**: 需要包含授权令牌
- **成功响应**:
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "seniors_count": 5,
      "cameras_online": 3,
      "alarms_today": 2,
      "alarms_pending": 1
    }
  }
  ```

## 错误响应示例

### 认证失败
```json
{
  "code": 401,
  "message": "认证失败，请重新登录",
  "data": null
}
```

### 参数错误
```json
{
  "code": 400,
  "message": "参数错误: 用户名不能为空",
  "data": null
}
```

### 资源不存在
```json
{
  "code": 404,
  "message": "找不到指定的资源",
  "data": null
}
```

### 服务器错误
```json
{
  "code": 500,
  "message": "服务器内部错误",
  "data": null
}
```

## WebSocket API

除了REST API外，系统还提供WebSocket接口用于实时通信。

### 连接地址
```
ws://47.97.160.91:5000/ws
```

### 认证
连接后首先需要发送认证消息：
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJ..."
}
```

### 订阅报警事件
```json
{
  "type": "subscribe",
  "channel": "alarms"
}
```

### 接收报警事件
```json
{
  "type": "alarm",
  "data": {
    "id": 3,
    "event_type": "fall",
    "event_level": "danger",
    "description": "检测到跌倒事件",
    "senior_name": "张三",
    "room_id": "301",
    "created_at": "2024-05-25T12:30:00Z"
  }
}
```

## 变更历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.0 | 2024-05-25 | 初始版本 | 