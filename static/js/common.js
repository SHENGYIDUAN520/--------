/**
 * 智能陪护监控平台 - 通用JavaScript函数
 */

// API基础URL - 修改为相对路径
const API_BASE_URL = '/api';

// 全局状态对象
const AppState = {
    user: null,
    token: null,
    cameras: [],
    seniors: [],
    isLoading: false,
    errors: []
};

/**
 * 初始化页面通用元素
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载，检查认证状态...');
    console.log('当前localStorage:', {
        token: localStorage.getItem('auth_token'),
        user: localStorage.getItem('user_info')
    });
    
    // 检查登录状态
    checkAuthStatus();
});

/**
 * 更新页面当前时间显示
 */
function updateCurrentTime() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    
    const timeString = now.toLocaleDateString('zh-CN', options);
    const timeElement = document.getElementById('current-time');
    
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}
function checkAuthStatus() {
    console.log('执行认证状态检查...');
    console.log('当前页面:', window.location.pathname);
    
    // 如果是登录页面，不需要检查
    if (window.location.pathname.includes('login.html')) {
        console.log('当前在登录页面，不检查认证状态');
        return;
    }
    
    // 从本地存储获取令牌（兼容两种键名）
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    console.log('找到token:', token ? '是' : '否');
    
    // ===== 临时解决方案 =====
    // 如果没有token，为测试创建一个虚拟token
    if (!token) {
        console.log('未找到token，创建测试token');
        const testToken = 'test_token_' + new Date().getTime();
        localStorage.setItem('auth_token', testToken);
        localStorage.setItem('token', testToken);
        
        // 创建测试用户
        const testUser = {
            id: 1,
            username: 'admin',
            role: 'admin',
            email: 'admin@example.com'
        };
        localStorage.setItem('user_info', JSON.stringify(testUser));
        localStorage.setItem('user', JSON.stringify(testUser));
        
        // 设置全局状态
        AppState.token = testToken;
        AppState.user = testUser;
        console.log('已创建测试用户和token');
        return;
    }
    
    // 设置全局token
    AppState.token = token;
    console.log('已设置全局token');
    
    // 如果已经有用户信息，直接返回
    if (AppState.user) {
        console.log('AppState中已有用户信息，无需重新获取');
        return;
    }
    
    // 兼容两种可能的键名
    const userJson = localStorage.getItem('user_info') || localStorage.getItem('user');
    console.log('找到用户信息:', userJson ? '是' : '否');
    
    if (userJson) {
        try {
            AppState.user = JSON.parse(userJson);
            console.log('成功解析用户信息，用户名:', AppState.user.username);
            
            // 这里不再调用任何API，直接使用localStorage中的信息
            return;
        } catch (e) {
            console.error('解析用户信息失败', e);
            // 即使解析失败也不跳转，只清理数据
            localStorage.removeItem('auth_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user_info'); 
            localStorage.removeItem('user');
            console.log('清除了无效的用户数据');
        }
    }
    
    // 如果没有用户信息但有token，仍然视为已登录
    // 不再尝试调用API获取用户信息
    console.log('有token但没有用户信息，仍视为已登录');
    AppState.user = { 
        authenticated: true,
        username: 'admin',
        role: 'admin'
    }; // 设置一个临时用户对象
}

/**
 * 登录处理函数
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise} 登录结果Promise
 */
function login(username, password) {
    return apiPost('/auth/login', { username, password })
        // 在static/js/login.js中找到登录成功处理部分
        .then(response => {
             if (response.token && response.user) {
        // 保存认证信息到两种可能的键名
                 localStorage.setItem('token', response.token);
                 localStorage.setItem('auth_token', response.token);
                 localStorage.setItem('user', JSON.stringify(response.user));
                 localStorage.setItem('user_info', JSON.stringify(response.user));
        
         // 直接设置页面跳转
                  window.location.replace('/static/index.html');
        // 阻止后续代码执行
                 return false;
            } else {
                showLoginError('登录失败，请重试');
    }
})
}

/**
 * 登出处理函数
 * @returns {Promise} 登出结果Promise
 */
function logout() {
    return apiPost('/auth/logout')
        .then(response => {
            // 清除认证信息
            AppState.token = null;
            AppState.user = null;
            
            // 清除本地存储
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            
            // 重定向到登录页
            window.location.href = 'login.html';
            
            return response;
        })
        .catch(error => {
            console.error('登出失败', error);
            
            // 即使API请求失败，也清除本地状态
            AppState.token = null;
            AppState.user = null;
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            
            // 重定向到登录页
            window.location.href = 'login.html';
        });
}

/**
 * 通用API GET请求
 * @param {string} endpoint API端点
 * @param {Object} params 查询参数
 * @returns {Promise} API响应Promise
 */
function apiGet(endpoint, params = {}) {
    // 构建URL查询参数
    const queryParams = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
            queryParams.append(key, params[key]);
        }
    }
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    // 设置请求头
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // 如果有令牌，添加到请求头
    if (AppState.token) {
        headers['Authorization'] = `Bearer ${AppState.token}`;
    }
    
    // 设置加载状态
    AppState.isLoading = true;
    
    // 发送请求
    return fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include' // 包含Cookie
    })
    .then(response => {
        AppState.isLoading = false;
        
        if (!response.ok) {
            // 处理401未授权错误
            if (response.status === 401) {
                console.error('收到401未授权响应，但暂时禁用自动跳转');
                // 临时测试方案：不跳转，只记录日志
                /*
                // 清除认证状态并重定向到登录页面
                AppState.token = null;
                AppState.user = null;
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                window.location.href = 'login.html';
                */
            }
            
            return response.json().then(data => {
                throw new Error(data.message || `请求失败: ${response.status}`);
            });
        }
        
        return response.json();
    })
    .catch(error => {
        AppState.isLoading = false;
        AppState.errors.push(error.message || '请求失败');
        console.error('API请求错误:', error);
        throw error;
    });
}

/**
 * 通用API POST请求
 * @param {string} endpoint API端点
 * @param {Object} data 请求数据
 * @returns {Promise} API响应Promise
 */
function apiPost(endpoint, data = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('API请求URL:', url);
    console.log('API请求数据:', data);
    
    // 设置请求头
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // 如果有令牌，添加到请求头
    if (AppState.token) {
        headers['Authorization'] = `Bearer ${AppState.token}`;
    }
    
    // 设置加载状态
    AppState.isLoading = true;
    
    // 发送请求
    return fetch(url, {
        method: 'POST',
        headers: headers,
        credentials: 'include', // 包含Cookie
        body: JSON.stringify(data)
    })
    .then(response => {
        AppState.isLoading = false;
        
        if (!response.ok) {
            // 处理401未授权错误
            if (response.status === 401) {
                console.error('收到401未授权响应，但暂时禁用自动跳转');
                // 临时测试方案：不跳转，只记录日志
                /*
                // 清除认证状态并重定向到登录页面
                AppState.token = null;
                AppState.user = null;
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                window.location.href = 'login.html';
                */
            }
            
            // 尝试解析JSON响应，如果失败则返回普通错误
            try {
                return response.json().then(data => {
                    throw new Error(data.message || `请求失败: ${response.status}`);
                }).catch(e => {
                    throw new Error(`请求失败(${response.status}): ${e.message}`);
                });
            } catch (e) {
                throw new Error(`请求失败: ${response.status}`);
            }
        }
        
        // 尝试解析JSON响应
        try {
            return response.json();
        } catch (e) {
            console.error('解析响应JSON失败', e);
            throw new Error('解析服务器响应失败');
        }
    })
    .catch(error => {
        AppState.isLoading = false;
        const errorMsg = error.message || '请求失败';
        
        // 如果不是未授权错误，不要清除会话
        if (!errorMsg.includes('未授权')) {
            AppState.errors.push(errorMsg);
            console.error('API请求错误:', error);
        }
        
        throw error;
    });
}

/**
 * 通用API PUT请求
 * @param {string} endpoint API端点
 * @param {Object} data 请求数据
 * @returns {Promise} API响应Promise
 */
function apiPut(endpoint, data = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 设置请求头
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // 如果有令牌，添加到请求头
    if (AppState.token) {
        headers['Authorization'] = `Bearer ${AppState.token}`;
    }
    
    // 设置加载状态
    AppState.isLoading = true;
    
    // 发送请求
    return fetch(url, {
        method: 'PUT',
        headers: headers,
        credentials: 'include', // 包含Cookie
        body: JSON.stringify(data)
    })
    .then(response => {
        AppState.isLoading = false;
        
        if (!response.ok) {
            // 处理401未授权错误
            if (response.status === 401) {
                console.error('PUT请求收到401未授权响应，但暂时禁用自动跳转');
                // 临时测试方案：不跳转，只记录日志
                /*
                // 清除认证状态并重定向到登录页面
                AppState.token = null;
                AppState.user = null;
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                window.location.href = 'login.html';
                */
            }
            
            return response.json().then(data => {
                throw new Error(data.message || `请求失败: ${response.status}`);
            });
        }
        
        return response.json();
    })
    .catch(error => {
        AppState.isLoading = false;
        AppState.errors.push(error.message || '请求失败');
        console.error('API请求错误:', error);
        throw error;
    });
}

/**
 * 通用API DELETE请求
 * @param {string} endpoint API端点
 * @returns {Promise} API响应Promise
 */
function apiDelete(endpoint) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 设置请求头
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // 如果有令牌，添加到请求头
    if (AppState.token) {
        headers['Authorization'] = `Bearer ${AppState.token}`;
    }
    
    // 设置加载状态
    AppState.isLoading = true;
    
    // 发送请求
    return fetch(url, {
        method: 'DELETE',
        headers: headers,
        credentials: 'include' // 包含Cookie
    })
    .then(response => {
        AppState.isLoading = false;
        
        if (!response.ok) {
            // 处理401未授权错误
            if (response.status === 401) {
                console.error('DELETE请求收到401未授权响应，但暂时禁用自动跳转');
                // 临时测试方案：不跳转，只记录日志
                /*
                // 清除认证状态并重定向到登录页面
                AppState.token = null;
                AppState.user = null;
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                window.location.href = 'login.html';
                */
            }
            
            return response.json().then(data => {
                throw new Error(data.message || `请求失败: ${response.status}`);
            });
        }
        
        return response.json();
    })
    .catch(error => {
        AppState.isLoading = false;
        AppState.errors.push(error.message || '请求失败');
        console.error('API请求错误:', error);
        throw error;
    });
}

/**
 * 加载指定元素的模板
 * @param {string} elementId 目标元素ID
 * @param {string} templateId 模板元素ID
 * @param {Object} data 模板数据
 */
function loadTemplate(elementId, templateId, data) {
    const targetElement = document.getElementById(elementId);
    const templateElement = document.getElementById(templateId);
    
    if (!targetElement || !templateElement) {
        console.error(`元素不存在: ${elementId} 或 ${templateId}`);
        return;
    }
    
    let templateHtml = templateElement.innerHTML;
    
    // 简单的模板替换
    for (const key in data) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        templateHtml = templateHtml.replace(regex, data[key]);
    }
    
    targetElement.innerHTML = templateHtml;
}

/**
 * 显示加载动画
 * @param {string} elementId 要显示加载动画的元素ID
 */
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="loading-indicator">
                <i class="bi bi-arrow-repeat"></i> 加载中...
            </div>
        `;
    }
}

/**
 * 显示错误消息
 * @param {string} message 错误消息
 * @param {string} elementId 要显示错误的元素ID (可选)
 */
function showError(message, elementId = null) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="error-message">
                    <i class="bi bi-exclamation-triangle"></i> ${message}
                </div>
            `;
        }
    } else {
        // 创建浮动错误提示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'floating-error';
        errorDiv.innerHTML = `<i class="bi bi-exclamation-triangle"></i> ${message}`;
        
        document.body.appendChild(errorDiv);
        
        // 5秒后自动移除
        setTimeout(() => {
            errorDiv.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(errorDiv);
            }, 500);
        }, 5000);
    }
    
    // 添加到全局错误列表
    AppState.errors.push(message);
    console.error(message);
}

/**
 * 显示成功消息
 * @param {string} message 成功消息
 */
function showSuccess(message) {
    // 创建浮动成功提示
    const successDiv = document.createElement('div');
    successDiv.className = 'floating-success';
    successDiv.innerHTML = `<i class="bi bi-check-circle"></i> ${message}`;
    
    document.body.appendChild(successDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        successDiv.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 500);
    }, 3000);
}

/**
 * 日期格式化
 * @param {Date|string} date 日期对象或日期字符串
 * @param {string} format 格式字符串 (默认: 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) {
        return '';
    }
    
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 确认对话框
 * @param {string} message 确认消息
 * @returns {Promise} 用户选择结果Promise
 */
function confirmDialog(message) {
    return new Promise((resolve) => {
        // 创建确认对话框
        const dialogDiv = document.createElement('div');
        dialogDiv.className = 'confirm-dialog';
        dialogDiv.innerHTML = `
            <div class="confirm-dialog-content">
                <div class="confirm-dialog-message">${message}</div>
                <div class="confirm-dialog-buttons">
                    <button class="btn btn-secondary" id="confirm-cancel">取消</button>
                    <button class="btn btn-primary" id="confirm-ok">确认</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialogDiv);
        
        // 添加按钮事件监听
        document.getElementById('confirm-cancel').addEventListener('click', () => {
            document.body.removeChild(dialogDiv);
            resolve(false);
        });
        
        document.getElementById('confirm-ok').addEventListener('click', () => {
            document.body.removeChild(dialogDiv);
            resolve(true);
        });
    });
} 