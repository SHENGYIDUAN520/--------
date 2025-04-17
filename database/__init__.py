# 数据库模块入口文件
from database.mysql_db import db as mysql_db

# 导出便捷函数
from database.mysql_db import query, get_one, update, insert

__all__ = [
    'mysql_db',
    'query',
    'get_one',
    'update',
    'insert'
] 