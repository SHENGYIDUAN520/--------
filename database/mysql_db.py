import pymysql
from pymysql.cursors import DictCursor
from database.config import MYSQL_CONFIG

class MySQLDatabase:
    def __init__(self):
        self.conn = None
        self.connect()
        
    def connect(self):
        """连接到MySQL数据库"""
        try:
            self.conn = pymysql.connect(
                host=MYSQL_CONFIG['host'],
                port=MYSQL_CONFIG['port'],
                user=MYSQL_CONFIG['user'],
                password=MYSQL_CONFIG['password'],
                database=MYSQL_CONFIG['database'],
                charset=MYSQL_CONFIG['charset'],
                cursorclass=DictCursor
            )
            print("MySQL数据库连接成功")
        except Exception as e:
            print(f"MySQL数据库连接失败: {e}")
            raise
    
    def close(self):
        """关闭数据库连接"""
        if self.conn:
            self.conn.close()
            print("MySQL数据库连接已关闭")
    
    def execute_query(self, query, params=None):
        """执行查询操作"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchall()
        except Exception as e:
            print(f"查询执行失败: {e}")
            self.reconnect()
            raise
    
    def execute_one(self, query, params=None):
        """执行查询并返回一条记录"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchone()
        except Exception as e:
            print(f"查询执行失败: {e}")
            self.reconnect()
            raise
    
    def execute_update(self, query, params=None):
        """执行更新操作"""
        try:
            with self.conn.cursor() as cursor:
                result = cursor.execute(query, params or ())
                self.conn.commit()
                return result
        except Exception as e:
            self.conn.rollback()
            print(f"更新执行失败: {e}")
            self.reconnect()
            raise
    
    def execute_insert(self, query, params=None):
        """执行插入操作并返回最后插入的ID"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(query, params or ())
                self.conn.commit()
                return cursor.lastrowid
        except Exception as e:
            self.conn.rollback()
            print(f"插入执行失败: {e}")
            self.reconnect()
            raise
    
    def reconnect(self):
        """重新连接数据库"""
        try:
            self.conn.ping(reconnect=True)
        except:
            self.close()
            self.connect()

# 单例模式
db = MySQLDatabase()

# 便捷函数
def query(sql, params=None):
    return db.execute_query(sql, params)

def get_one(sql, params=None):
    return db.execute_one(sql, params)

def update(sql, params=None):
    return db.execute_update(sql, params)

def insert(sql, params=None):
    return db.execute_insert(sql, params) 