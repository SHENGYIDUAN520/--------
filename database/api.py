"""
数据库API模块，提供各类数据查询和修改的接口函数
"""
from database import mysql_db, query, get_one, update, insert
import json
from datetime import datetime, timedelta

# 用户相关API
def get_user_by_username(username):
    """根据用户名获取用户信息"""
    sql = "SELECT id, username, role, email, phone FROM users WHERE username = %s"
    return get_one(sql, (username,))

def get_user_by_id(user_id):
    """根据ID获取用户信息"""
    sql = "SELECT id, username, role, email, phone FROM users WHERE id = %s"
    return get_one(sql, (user_id,))

def verify_user_password(username, password_hash):
    """验证用户密码"""
    sql = "SELECT id FROM users WHERE username = %s AND password = %s"
    return get_one(sql, (username, password_hash))

def update_user_profile(user_id, email=None, phone=None):
    """更新用户个人资料"""
    if email and phone:
        sql = "UPDATE users SET email = %s, phone = %s WHERE id = %s"
        return update(sql, (email, phone, user_id))
    elif email:
        sql = "UPDATE users SET email = %s WHERE id = %s"
        return update(sql, (email, user_id))
    elif phone:
        sql = "UPDATE users SET phone = %s WHERE id = %s"
        return update(sql, (phone, user_id))
    return False

def update_user_password(user_id, new_password_hash):
    """更新用户密码"""
    sql = "UPDATE users SET password = %s WHERE id = %s"
    return update(sql, (new_password_hash, user_id))

def delete_all_user_sessions(user_id):
    """删除用户的所有会话"""
    sql = "DELETE FROM sessions WHERE user_id = %s"
    return update(sql, (user_id,))

# 老人信息相关API
def get_all_seniors():
    """获取所有老人信息"""
    sql = """
        SELECT id, name, age, gender, room_id, emergency_contact, emergency_phone 
        FROM seniors
    """
    return query(sql)

def get_senior_by_id(senior_id):
    """根据ID获取老人详细信息"""
    sql = """
        SELECT id, name, age, gender, address, room_id, emergency_contact, 
               emergency_phone, health_notes 
        FROM seniors 
        WHERE id = %s
    """
    return get_one(sql, (senior_id,))

def add_senior(name, age, gender=None, address=None, room_id=None, 
               emergency_contact=None, emergency_phone=None, health_notes=None):
    """添加老人信息"""
    sql = """
        INSERT INTO seniors (name, age, gender, address, room_id, emergency_contact, 
                            emergency_phone, health_notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    return insert(sql, (name, age, gender, address, room_id, emergency_contact, 
                        emergency_phone, health_notes))

def update_senior(senior_id, **kwargs):
    """更新老人信息"""
    # 动态构建更新语句
    update_fields = []
    params = []
    
    for field, value in kwargs.items():
        update_fields.append(f"{field} = %s")
        params.append(value)
    
    # 添加ID作为WHERE条件
    params.append(senior_id)
    
    sql = f"UPDATE seniors SET {', '.join(update_fields)} WHERE id = %s"
    return update(sql, params)

def delete_senior(senior_id):
    """删除老人信息"""
    sql = "DELETE FROM seniors WHERE id = %s"
    return update(sql, (senior_id,))

# 摄像头相关API
def get_all_cameras():
    """获取所有摄像头信息"""
    sql = """
        SELECT id, device_id, name, location, room_id, stream_url, k230_ip, 
               resolution, fps, status 
        FROM cameras
    """
    return query(sql)

def get_camera_by_id(camera_id):
    """根据ID获取摄像头详细信息"""
    sql = """
        SELECT id, device_id, name, location, room_id, stream_url, k230_ip, 
               resolution, fps, status 
        FROM cameras 
        WHERE id = %s
    """
    return get_one(sql, (camera_id,))

def get_camera_by_room(room_id):
    """根据房间ID获取摄像头信息"""
    sql = """
        SELECT id, device_id, name, location, room_id, stream_url, k230_ip, 
               resolution, fps, status 
        FROM cameras 
        WHERE room_id = %s
    """
    return query(sql, (room_id,))

def update_camera_status(camera_id, status):
    """更新摄像头状态"""
    sql = "UPDATE cameras SET status = %s WHERE id = %s"
    return update(sql, (status, camera_id))

# 设备状态相关API
def update_device_status(device_id, status, connection_info=None):
    """更新设备状态"""
    sql = """
        INSERT INTO device_status (device_id, status, last_active, connection_info)
        VALUES (%s, %s, NOW(), %s)
        ON DUPLICATE KEY UPDATE 
            status = VALUES(status), 
            last_active = VALUES(last_active),
            connection_info = VALUES(connection_info)
    """
    return insert(sql, (device_id, status, connection_info))

def get_device_status(device_id):
    """获取设备状态"""
    sql = """
        SELECT id, device_id, status, last_active, connection_info
        FROM device_status
        WHERE device_id = %s
    """
    return get_one(sql, (device_id,))

# 报警事件相关API
def get_recent_alarms(limit=10):
    """获取最近的报警事件"""
    sql = """
        SELECT a.id, a.event_type, a.event_level, a.description, 
               a.image_url, a.video_clip_url, a.status, a.created_at,
               s.name as senior_name, s.age as senior_age, s.room_id
        FROM alarm_events a
        LEFT JOIN seniors s ON a.senior_id = s.id
        ORDER BY a.created_at DESC
        LIMIT %s
    """
    return query(sql, (limit,))

def get_alarms_by_senior(senior_id, limit=20):
    """获取指定老人的报警记录"""
    sql = """
        SELECT id, event_type, event_level, description, 
               image_url, video_clip_url, status, created_at
        FROM alarm_events
        WHERE senior_id = %s
        ORDER BY created_at DESC
        LIMIT %s
    """
    return query(sql, (senior_id, limit))

def get_alarms_by_date(date, limit=100):
    """获取指定日期的报警记录"""
    start_date = date.strftime('%Y-%m-%d 00:00:00')
    end_date = (date + timedelta(days=1)).strftime('%Y-%m-%d 00:00:00')
    
    sql = """
        SELECT id, senior_id, camera_id, event_type, event_level, description, 
               status, created_at
        FROM alarm_events
        WHERE created_at >= %s AND created_at < %s
        ORDER BY created_at DESC
        LIMIT %s
    """
    return query(sql, (start_date, end_date, limit))

def get_alarms_by_status(status, limit=100):
    """获取指定状态的报警记录"""
    sql = """
        SELECT id, senior_id, camera_id, event_type, event_level, description, 
               status, created_at
        FROM alarm_events
        WHERE status = %s
        ORDER BY created_at DESC
        LIMIT %s
    """
    return query(sql, (status, limit))

def add_alarm_event(senior_id, camera_id, event_type, event_level, 
                   description=None, image_url=None, video_clip_url=None):
    """添加报警事件"""
    sql = """
        INSERT INTO alarm_events (senior_id, camera_id, event_type, event_level, 
                                 description, image_url, video_clip_url, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'new')
    """
    alarm_id = insert(sql, (senior_id, camera_id, event_type, event_level, 
                          description, image_url, video_clip_url))
    
    if alarm_id:
        # 获取完整的报警信息用于缓存
        alarm_data = get_one("""
            SELECT a.*, s.name as senior_name, s.age as senior_age, s.room_id
            FROM alarm_events a
            LEFT JOIN seniors s ON a.senior_id = s.id
            WHERE a.id = %s
        """, (alarm_id,))
        
        # 将报警信息添加到最近报警表
        if alarm_data:
            add_to_recent_alerts(alarm_id, json.dumps(alarm_data))
    
    return alarm_id

def update_alarm_status(alarm_id, status, processed_by=None):
    """更新报警事件状态"""
    if processed_by and status in ['processing', 'resolved']:
        sql = """
            UPDATE alarm_events 
            SET status = %s, processed_at = NOW(), processed_by = %s
            WHERE id = %s
        """
        return update(sql, (status, processed_by, alarm_id))
    else:
        sql = "UPDATE alarm_events SET status = %s WHERE id = %s"
        return update(sql, (status, alarm_id))

def add_to_recent_alerts(alert_id, alert_json):
    """添加到最近报警缓存表"""
    sql = """
        INSERT INTO recent_alerts (alert_id, alert_json)
        VALUES (%s, %s)
    """
    return insert(sql, (alert_id, alert_json))

def get_recent_alerts(limit=5):
    """获取最近的报警事件（从缓存表）"""
    sql = """
        SELECT alert_json
        FROM recent_alerts
        ORDER BY created_at DESC
        LIMIT %s
    """
    result = query(sql, (limit,))
    # 解析JSON字符串为Python对象
    return [json.loads(item['alert_json']) for item in result] if result else []

# 视频记录相关API
def get_video_records_by_camera(camera_id, limit=20):
    """获取指定摄像头的视频记录"""
    sql = """
        SELECT id, camera_id, senior_id, start_time, end_time, 
               duration, file_url, file_size
        FROM video_records
        WHERE camera_id = %s
        ORDER BY start_time DESC
        LIMIT %s
    """
    return query(sql, (camera_id, limit))

def add_video_record(camera_id, senior_id=None, start_time=None, 
                     end_time=None, duration=None, file_url=None, file_size=None):
    """添加视频记录"""
    if start_time is None:
        start_time = datetime.now()
    
    sql = """
        INSERT INTO video_records (camera_id, senior_id, start_time, end_time, 
                                  duration, file_url, file_size)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    return insert(sql, (camera_id, senior_id, start_time, end_time, 
                      duration, file_url, file_size))

def update_video_record(record_id, end_time=None, duration=None, 
                       file_url=None, file_size=None):
    """更新视频记录"""
    # 动态构建更新语句
    update_fields = []
    params = []
    
    if end_time is not None:
        update_fields.append("end_time = %s")
        params.append(end_time)
    
    if duration is not None:
        update_fields.append("duration = %s")
        params.append(duration)
    
    if file_url is not None:
        update_fields.append("file_url = %s")
        params.append(file_url)
    
    if file_size is not None:
        update_fields.append("file_size = %s")
        params.append(file_size)
    
    if not update_fields:
        return False
    
    # 添加ID作为WHERE条件
    params.append(record_id)
    
    sql = f"UPDATE video_records SET {', '.join(update_fields)} WHERE id = %s"
    return update(sql, params)

# 会话相关API
def create_session(user_id, session_id, token, expires_in=3600):
    """创建用户会话"""
    expires_at = datetime.now() + timedelta(seconds=expires_in)
    
    sql = """
        INSERT INTO sessions (id, user_id, token, expires_at)
        VALUES (%s, %s, %s, %s)
    """
    return insert(sql, (session_id, user_id, token, expires_at))

def validate_session(session_id, token):
    """验证会话是否有效"""
    sql = """
        SELECT user_id
        FROM sessions
        WHERE id = %s AND token = %s AND expires_at > NOW()
    """
    result = get_one(sql, (session_id, token))
    return result['user_id'] if result else None

def delete_session(session_id):
    """删除会话"""
    sql = "DELETE FROM sessions WHERE id = %s"
    return update(sql, (session_id,))

def clean_expired_sessions():
    """清理过期会话"""
    sql = "DELETE FROM sessions WHERE expires_at < NOW()"
    return update(sql) 