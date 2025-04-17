"""
智能陪护监控平台 - Flask应用程序
"""
from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
import os
import uuid
import hashlib
import json
from datetime import datetime, timedelta
from functools import wraps

# 导入数据库API模块
from database import api

app = Flask(__name__, static_folder='static')
CORS(app)  # 允许跨域请求

# JWT密钥
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# 身份验证装饰器
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': '缺少授权令牌'}), 401
        
        # 获取Bearer令牌部分
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
        
        # 从请求Cookie中获取会话ID
        session_id = request.cookies.get('session_id')
        if not session_id:
            return jsonify({'message': '无效的会话'}), 401
        
        # 验证会话
        user_id = api.validate_session(session_id, token)
        if not user_id:
            return jsonify({'message': '会话已过期或无效'}), 401
        
        # 将用户ID添加到请求上下文
        request.user_id = user_id
        return f(*args, **kwargs)
    
    return decorated

# 首页路由
@app.route('/')
def index():
    return redirect('/static/login.html')

# 用户认证API

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': '用户名和密码不能为空'}), 400
    
    # 临时硬编码验证逻辑 - 仅测试用
    if username == 'admin' and password == 'admin123':
        # 创建会话和令牌
        session_id = str(uuid.uuid4())
        token = os.urandom(24).hex()
        
        # 准备响应
        resp = jsonify({
            'message': '登录成功',
            'user': {
                'id': 1,
                'username': 'admin',
                'role': 'admin',
                'email': 'admin@example.com',
                'phone': ''
            },
            'token': token
        })
        
        # 设置会话Cookie
        resp.set_cookie('session_id', session_id, httponly=True, max_age=86400)
        
        return resp
    
    # 常规验证逻辑 - 仅当硬编码验证失败时执行
    try:
        # 密码哈希处理
        password_hash = hashlib.pbkdf2_hmac(
            'sha256', 
            password.encode('utf-8'), 
            username.encode('utf-8'), 
            10000
        ).hex()
        
        # 验证用户
        user = api.get_user_by_username(username)
        if not user:
            return jsonify({'message': '用户不存在'}), 404
        
        # 验证密码
        if not api.verify_user_password(username, password_hash):
            return jsonify({'message': '密码错误'}), 401
        
        # 创建会话和令牌
        session_id = str(uuid.uuid4())
        token = os.urandom(24).hex()
        
        # 保存会话到数据库
        api.create_session(user['id'], session_id, token, 86400)  # 24小时有效期
        
        # 准备响应
        resp = jsonify({
            'message': '登录成功',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'email': user['email'],
                'phone': user['phone']
            },
            'token': token
        })
        
        # 设置会话Cookie
        resp.set_cookie('session_id', session_id, httponly=True, max_age=86400)
        
        return resp
    except Exception as e:
        print(f"登录验证错误: {e}")
        return jsonify({'message': '登录失败，系统错误'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout():
    session_id = request.cookies.get('session_id')
    
    # 删除会话
    if session_id:
        api.delete_session(session_id)
    
    # 准备响应
    resp = jsonify({'message': '登出成功'})
    
    # 清除会话Cookie
    resp.delete_cookie('session_id')
    
    return resp

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_user_profile():
    # 获取当前登录用户的信息
    username = request.args.get('username')
    if not username:
        return jsonify({'message': '需要用户名参数'}), 400
    
    user = api.get_user_by_username(username)
    if not user:
        return jsonify({'message': '用户不存在'}), 404
    
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'role': user['role'],
        'email': user['email'],
        'phone': user['phone']
    })

@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_user_profile():
    data = request.json
    user_id = request.user_id
    
    email = data.get('email')
    phone = data.get('phone')
    
    result = api.update_user_profile(user_id, email, phone)
    if result:
        return jsonify({'message': '用户资料已更新'})
    else:
        return jsonify({'message': '用户资料更新失败'}), 500

@app.route('/api/user/password', methods=['PUT'])
@token_required
def update_password():
    data = request.json
    user_id = request.user_id
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'message': '当前密码和新密码不能为空'}), 400
    
    # 获取用户信息
    user = api.get_user_by_id(user_id)
    if not user:
        return jsonify({'message': '用户不存在'}), 404
    
    # 验证当前密码
    current_password_hash = hashlib.pbkdf2_hmac(
        'sha256', 
        current_password.encode('utf-8'), 
        user['username'].encode('utf-8'), 
        10000
    ).hex()
    
    if not api.verify_user_password(user['username'], current_password_hash):
        return jsonify({'message': '当前密码错误'}), 401
    
    # 生成新密码哈希
    new_password_hash = hashlib.pbkdf2_hmac(
        'sha256', 
        new_password.encode('utf-8'), 
        user['username'].encode('utf-8'), 
        10000
    ).hex()
    
    # 更新密码
    result = api.update_user_password(user_id, new_password_hash)
    if result:
        # 删除所有现有会话，强制用户重新登录
        api.delete_all_user_sessions(user_id)
        return jsonify({'message': '密码已更新，请重新登录'})
    else:
        return jsonify({'message': '密码更新失败'}), 500

# 老人信息API

@app.route('/api/seniors', methods=['GET'])
@token_required
def get_seniors():
    seniors = api.get_all_seniors()
    return jsonify(seniors)

@app.route('/api/seniors/<int:senior_id>', methods=['GET'])
@token_required
def get_senior(senior_id):
    senior = api.get_senior_by_id(senior_id)
    if not senior:
        return jsonify({'message': '老人信息不存在'}), 404
    
    return jsonify(senior)

@app.route('/api/seniors', methods=['POST'])
@token_required
def add_senior():
    data = request.json
    
    # 必填字段
    name = data.get('name')
    age = data.get('age')
    
    if not name or not age:
        return jsonify({'message': '姓名和年龄不能为空'}), 400
    
    # 可选字段
    gender = data.get('gender')
    address = data.get('address')
    room_id = data.get('room_id')
    emergency_contact = data.get('emergency_contact')
    emergency_phone = data.get('emergency_phone')
    health_notes = data.get('health_notes')
    
    senior_id = api.add_senior(
        name, age, gender, address, room_id, 
        emergency_contact, emergency_phone, health_notes
    )
    
    if senior_id:
        return jsonify({
            'message': '老人信息添加成功', 
            'senior_id': senior_id
        }), 201
    else:
        return jsonify({'message': '老人信息添加失败'}), 500

@app.route('/api/seniors/<int:senior_id>', methods=['PUT'])
@token_required
def update_senior(senior_id):
    data = request.json
    
    # 检查老人是否存在
    senior = api.get_senior_by_id(senior_id)
    if not senior:
        return jsonify({'message': '老人信息不存在'}), 404
    
    # 可更新字段
    fields = ['name', 'age', 'gender', 'address', 'room_id', 
              'emergency_contact', 'emergency_phone', 'health_notes']
    
    # 提取要更新的字段
    update_data = {k: v for k, v in data.items() if k in fields and v is not None}
    
    if not update_data:
        return jsonify({'message': '没有提供有效的更新字段'}), 400
    
    result = api.update_senior(senior_id, **update_data)
    
    if result:
        return jsonify({'message': '老人信息更新成功'})
    else:
        return jsonify({'message': '老人信息更新失败'}), 500

@app.route('/api/seniors/<int:senior_id>', methods=['DELETE'])
@token_required
def delete_senior(senior_id):
    # 检查老人是否存在
    senior = api.get_senior_by_id(senior_id)
    if not senior:
        return jsonify({'message': '老人信息不存在'}), 404
    
    result = api.delete_senior(senior_id)
    
    if result:
        return jsonify({'message': '老人信息删除成功'})
    else:
        return jsonify({'message': '老人信息删除失败'}), 500

# 摄像头API

@app.route('/api/cameras', methods=['GET'])
@token_required
def get_cameras():
    cameras = api.get_all_cameras()
    return jsonify(cameras)

@app.route('/api/cameras/<int:camera_id>', methods=['GET'])
@token_required
def get_camera(camera_id):
    camera = api.get_camera_by_id(camera_id)
    if not camera:
        return jsonify({'message': '摄像头不存在'}), 404
    
    return jsonify(camera)

@app.route('/api/rooms/<room_id>/cameras', methods=['GET'])
@token_required
def get_room_cameras(room_id):
    cameras = api.get_camera_by_room(room_id)
    return jsonify(cameras)

@app.route('/api/cameras/<int:camera_id>/status', methods=['PUT'])
@token_required
def update_camera_status(camera_id):
    data = request.json
    status = data.get('status')
    
    if status is None:
        return jsonify({'message': '状态不能为空'}), 400
    
    result = api.update_camera_status(camera_id, status)
    
    if result:
        return jsonify({'message': '摄像头状态更新成功'})
    else:
        return jsonify({'message': '摄像头状态更新失败'}), 500

# 设备状态API

@app.route('/api/devices/<device_id>/status', methods=['GET'])
@token_required
def get_device_status(device_id):
    status = api.get_device_status(device_id)
    if not status:
        return jsonify({'message': '设备状态不存在'}), 404
    
    return jsonify(status)

@app.route('/api/devices/<device_id>/status', methods=['PUT'])
@token_required
def update_device_status(device_id):
    data = request.json
    status = data.get('status')
    connection_info = data.get('connection_info')
    
    if status is None:
        return jsonify({'message': '状态不能为空'}), 400
    
    result = api.update_device_status(device_id, status, connection_info)
    
    if result:
        return jsonify({'message': '设备状态更新成功'})
    else:
        return jsonify({'message': '设备状态更新失败'}), 500

# 报警事件API

@app.route('/api/alarms/recent', methods=['GET'])
@token_required
def get_recent_alarms():
    limit = request.args.get('limit', 10, type=int)
    alarms = api.get_recent_alarms(limit)
    return jsonify(alarms)

@app.route('/api/seniors/<int:senior_id>/alarms', methods=['GET'])
@token_required
def get_senior_alarms(senior_id):
    limit = request.args.get('limit', 20, type=int)
    alarms = api.get_alarms_by_senior(senior_id, limit)
    return jsonify(alarms)

@app.route('/api/alarms', methods=['POST'])
@token_required
def add_alarm():
    data = request.json
    
    # 必填字段
    senior_id = data.get('senior_id')
    camera_id = data.get('camera_id')
    event_type = data.get('event_type')
    event_level = data.get('event_level')
    
    if not all([senior_id, camera_id, event_type, event_level]):
        return jsonify({'message': '缺少必要字段'}), 400
    
    # 可选字段
    description = data.get('description')
    image_url = data.get('image_url')
    video_clip_url = data.get('video_clip_url')
    
    alarm_id = api.add_alarm_event(
        senior_id, camera_id, event_type, event_level,
        description, image_url, video_clip_url
    )
    
    if alarm_id:
        return jsonify({
            'message': '报警事件添加成功', 
            'alarm_id': alarm_id
        }), 201
    else:
        return jsonify({'message': '报警事件添加失败'}), 500

@app.route('/api/alarms/<int:alarm_id>/status', methods=['PUT'])
@token_required
def update_alarm_status(alarm_id):
    data = request.json
    status = data.get('status')
    
    if not status:
        return jsonify({'message': '状态不能为空'}), 400
    
    result = api.update_alarm_status(alarm_id, status, request.user_id)
    
    if result:
        return jsonify({'message': '报警事件状态更新成功'})
    else:
        return jsonify({'message': '报警事件状态更新失败'}), 500

# 视频记录API

@app.route('/api/cameras/<int:camera_id>/videos', methods=['GET'])
@token_required
def get_camera_videos(camera_id):
    limit = request.args.get('limit', 20, type=int)
    videos = api.get_video_records_by_camera(camera_id, limit)
    return jsonify(videos)

@app.route('/api/videos', methods=['POST'])
@token_required
def add_video():
    data = request.json
    
    # 必填字段
    camera_id = data.get('camera_id')
    
    if not camera_id:
        return jsonify({'message': '摄像头ID不能为空'}), 400
    
    # 可选字段
    senior_id = data.get('senior_id')
    start_time = data.get('start_time')
    if start_time:
        start_time = datetime.fromisoformat(start_time)
    
    video_id = api.add_video_record(camera_id, senior_id, start_time)
    
    if video_id:
        return jsonify({
            'message': '视频记录添加成功', 
            'video_id': video_id
        }), 201
    else:
        return jsonify({'message': '视频记录添加失败'}), 500

@app.route('/api/videos/<int:video_id>', methods=['PUT'])
@token_required
def update_video(video_id):
    data = request.json
    
    # 可选字段
    end_time = data.get('end_time')
    if end_time:
        end_time = datetime.fromisoformat(end_time)
    
    duration = data.get('duration')
    file_url = data.get('file_url')
    file_size = data.get('file_size')
    
    result = api.update_video_record(
        video_id, end_time, duration, file_url, file_size
    )
    
    if result:
        return jsonify({'message': '视频记录更新成功'})
    else:
        return jsonify({'message': '视频记录更新失败'}), 500

# 数据统计API - 用于首页仪表盘

@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats():
    # 这里可以添加更多的统计数据
    stats = {
        'seniors_count': len(api.get_all_seniors()),
        'cameras_online': sum(1 for c in api.get_all_cameras() if c['status'] == 1),
        'alarms_today': len(api.get_alarms_by_date(datetime.now().date())),
        'alarms_pending': len(api.get_alarms_by_status('new'))
    }
    
    return jsonify(stats)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 