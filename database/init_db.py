import pymysql
import os
from database.config import MYSQL_CONFIG

def create_database():
    """创建数据库和表"""
    # 创建连接（不指定数据库）
    conn = pymysql.connect(
        host=MYSQL_CONFIG['host'],
        port=MYSQL_CONFIG['port'],
        user=MYSQL_CONFIG['user'],
        password=MYSQL_CONFIG['password'],
        charset=MYSQL_CONFIG['charset']
    )
    
    try:
        with conn.cursor() as cursor:
            # 创建数据库
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_CONFIG['database']} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"数据库 {MYSQL_CONFIG['database']} 创建成功或已存在")
            
            # 切换到新数据库
            cursor.execute(f"USE {MYSQL_CONFIG['database']}")
            
            # 创建用户表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(64) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'staff', 'family') NOT NULL DEFAULT 'staff',
                    email VARCHAR(128),
                    phone VARCHAR(20),
                    status TINYINT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
            print("用户表创建成功")
            
            # 创建老人信息表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS seniors (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(64) NOT NULL,
                    age INT,
                    gender ENUM('male', 'female', 'other'),
                    address VARCHAR(256),
                    room_id VARCHAR(64),
                    emergency_contact VARCHAR(64),
                    emergency_phone VARCHAR(20),
                    health_notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)    
            print("老人信息表创建成功")
            
            # 创建摄像头表 - 确保device_id是UNIQUE
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS cameras (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    device_id VARCHAR(64) NOT NULL UNIQUE,
                    name VARCHAR(64),
                    location VARCHAR(128),
                    room_id VARCHAR(64),
                    stream_url VARCHAR(256),
                    k230_ip VARCHAR(64),
                    resolution VARCHAR(32),
                    fps INT,
                    status TINYINT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_device_id (device_id)
                )
            """)
            print("摄像头表创建成功")
            
            # 创建视频记录表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS video_records (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    camera_id INT,
                    senior_id INT,
                    start_time TIMESTAMP NOT NULL,
                    end_time TIMESTAMP,
                    duration INT,
                    file_url VARCHAR(256),
                    file_size INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE SET NULL,
                    FOREIGN KEY (senior_id) REFERENCES seniors(id) ON DELETE SET NULL
                )
            """)
            print("视频记录表创建成功")
            
            # 创建报警事件表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS alarm_events (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    senior_id INT,
                    camera_id INT,
                    event_type ENUM('fall', 'leave', 'abnormal', 'other'),
                    event_level ENUM('info', 'warning', 'danger'),
                    description TEXT,
                    image_url VARCHAR(256),
                    video_clip_url VARCHAR(256),
                    status ENUM('new', 'processing', 'resolved'),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed_at TIMESTAMP,
                    processed_by INT,
                    FOREIGN KEY (senior_id) REFERENCES seniors(id) ON DELETE SET NULL,
                    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE SET NULL,
                    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
                )
            """)
            print("报警事件表创建成功")
            
            # 创建设备状态表 - 不使用外键约束
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS device_status (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    device_id VARCHAR(64) NOT NULL,
                    status TINYINT DEFAULT 1,
                    last_active TIMESTAMP,
                    connection_info TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_device_id (device_id)
                )
            """)
            print("设备状态表创建成功")
            
            # 创建最近报警表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS recent_alerts (
                    id INT AUTO_INCREMENT PRIMARY KEY, 
                    alert_id INT NOT NULL,
                    alert_json TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (alert_id) REFERENCES alarm_events(id) ON DELETE CASCADE
                )
            """)
            print("最近报警表创建成功")
            
            # 创建会话表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id VARCHAR(64) PRIMARY KEY,
                    user_id INT NOT NULL,
                    token TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            print("会话表创建成功")
            
            # 插入默认管理员用户
            cursor.execute("""
                INSERT IGNORE INTO users (username, password, role, email)
                VALUES ('admin', 'c558668aeb21ad6fef19f06a118e2502b6b9abd4bedc065a7f8d0a105903a4fb', 'admin', 'admin@example.com')
            """)
            print("默认管理员用户创建成功，用户名: admin, 密码: admin123")
            
            conn.commit()
            print("数据库初始化完成")
            
    except Exception as e:
        print(f"数据库初始化失败: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_database() 