/**
 * 智能陪护监控平台 - 通用JavaScript函数
 */

// API基础URL - 修改为相对路径，避免跨域问题
const API_BASE_URL = '/api';

// 服务器URL - 用于绝对路径请求
const SERVER_URL = '';

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
    
    // 加载服务器配置
    loadServerConfig();
    
    // 检查登录状态
    checkAuthStatus();
});

/**
 * 从localStorage加载服务器配置
 */
function loadServerConfig() {
    try {
        const configStr = localStorage.getItem('server_config');
        if (configStr) {
            const config = JSON.parse(configStr);
            if (config && config.serverUrl) {
                // 动态更新API基础URL
                window.API_BASE_URL = `${config.serverUrl}/api`;
                window.SERVER_URL = config.serverUrl;
                console.log('已从本地存储加载服务器配置:', config.serverUrl);
                return;
            }
        }
        
        // 兼容格式检查
        const serverUrl = localStorage.getItem('serverUrl');
        if (serverUrl) {
            window.API_BASE_URL = `${serverUrl}/api`;
            window.SERVER_URL = serverUrl;
            console.log('已从serverUrl加载服务器配置:', serverUrl);
        }
    } catch (error) {
        console.error('加载服务器配置失败:', error);
    }
}

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
    
    // 获取当前服务器地址
    const serverUrl = window.API_BASE_URL || API_BASE_URL;
    console.log('当前API地址:', serverUrl);
    
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
        
        // 显示提示
        showAuthToast('使用测试账户登录，这仅用于开发/演示目的', 'info');
        
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
            
            // 显示欢迎提示
            showAuthToast(`欢迎回来，${AppState.user.username}`, 'success');
            
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
            
            // 显示错误提示
            showAuthToast('用户数据无效，请重新登录', 'warning');
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
    
    // 显示提示
    showAuthToast('使用默认账户信息', 'info');
}

/**
 * 显示认证相关的提示消息
 * @param {string} message 提示信息
 * @param {string} type 提示类型 (success/info/warning/error)
 */
function showAuthToast(message, type = 'info') {
    // 检查是否已存在提示
    let authToast = document.getElementById('auth-toast');
    
    if (!authToast) {
        authToast = document.createElement('div');
        authToast.id = 'auth-toast';
        
        // 根据类型设置不同背景色
        let bgColor, textColor;
        switch(type) {
            case 'success':
                bgColor = '#d1e7dd';
                textColor = '#0f5132';
                break;
            case 'warning':
                bgColor = '#fff3cd';
                textColor = '#856404';
                break;
            case 'error':
                bgColor = '#f8d7da';
                textColor = '#721c24';
                break;
            default: // info
                bgColor = '#cff4fc';
                textColor = '#055160';
        }
        
        authToast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: ${bgColor};
            color: ${textColor};
            padding: 10px 15px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 300px;
            animation: fadeIn 0.3s ease;
            font-size: 14px;
        `;
        
        // 添加关闭按钮
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 8px;
            font-size: 16px;
            cursor: pointer;
        `;
        
        closeButton.addEventListener('click', function() {
            document.body.removeChild(authToast);
        });
        
        authToast.appendChild(document.createTextNode(message));
        authToast.appendChild(closeButton);
        
        document.body.appendChild(authToast);
        
        // 3秒后自动关闭
        setTimeout(() => {
            if (authToast.parentNode) {
                authToast.parentNode.removeChild(authToast);
            }
        }, 3000);
    }
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
    // 确保使用最新的API基础URL
    const apiBaseUrl = window.API_BASE_URL || API_BASE_URL;
    
    // 构建URL查询参数
    const queryParams = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
            queryParams.append(key, params[key]);
        }
    }
    
    const queryString = queryParams.toString();
    const url = `${apiBaseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    console.log('API GET请求:', url);
    
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
                
                // 显示友好的提示信息
                const message = '会话已过期或未登录，请刷新页面或重新登录';
                
                // 创建一个悬浮提示
                showAuthError(message);
                
                // 抛出特定错误
                throw new Error(`未授权访问: ${message}`);
            }
            
            // 抛出错误以便调用者处理
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    })
    .catch(error => {
        AppState.isLoading = false;
        AppState.errors.push(error.message);
        console.error('API请求错误', error);
        throw error;
    });
}

/**
 * 通用GET请求函数 - 用于前端API请求
 * @param {string} url 请求URL
 * @param {Function} successCallback 成功回调函数
 * @param {Function} errorCallback 错误回调函数
 * @param {string} loadingElementId 加载指示器元素ID
 */
function getRequest(url, successCallback, errorCallback, loadingElementId) {
    // 确保URL有效
    let requestUrl = url;
    // 如果是相对路径且不以/api开头
    if (!url.startsWith('http') && !url.startsWith('/api')) {
        requestUrl = `${SERVER_URL}${url.startsWith('/') ? url : '/' + url}`;
    }
    
    // 显示加载指示器
    if (loadingElementId) {
        const loadingElement = document.getElementById(loadingElementId);
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
    }
    
    // 设置请求头
    const headers = {};
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 发送请求
    fetch(requestUrl, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
    })
    .then(response => {
        // 隐藏加载指示器
        if (loadingElementId) {
            const loadingElement = document.getElementById(loadingElementId);
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
        
        if (!response.ok) {
            throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    })
    .then(data => {
        if (successCallback && typeof successCallback === 'function') {
            successCallback(data);
        }
    })
    .catch(error => {
        console.error('请求错误:', error);
        
        // 隐藏加载指示器
        if (loadingElementId) {
            const loadingElement = document.getElementById(loadingElementId);
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
        
        if (errorCallback && typeof errorCallback === 'function') {
            errorCallback(error);
        }
    });
}

/**
 * 通用API POST请求
 * @param {string} endpoint API端点
 * @param {Object} data 请求数据
 * @returns {Promise} API响应Promise
 */
function apiPost(endpoint, data = {}) {
    // 确保使用最新的API基础URL
    const apiBaseUrl = window.API_BASE_URL || API_BASE_URL;
    const url = `${apiBaseUrl}${endpoint}`;
    
    console.log('API POST请求:', url);
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
        credentials: 'include', // 跨域请求时包含凭据（Cookie等）
        body: JSON.stringify(data)
    })
    .then(response => {
        AppState.isLoading = false;
        
        if (!response.ok) {
            // 处理401未授权错误
            if (response.status === 401) {
                console.error('收到401未授权响应，但暂时禁用自动跳转');
                
                // 显示友好的提示信息
                const message = '会话已过期或未登录，请刷新页面或重新登录';
                
                // 创建一个悬浮提示
                showAuthError(message);
                
                // 抛出特定错误
                throw new Error(`未授权访问: ${message}`);
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
    // 确保使用最新的API基础URL
    const apiBaseUrl = window.API_BASE_URL || API_BASE_URL;
    const url = `${apiBaseUrl}${endpoint}`;
    
    console.log('API PUT请求:', url);
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
                console.error('收到401未授权响应，但暂时禁用自动跳转');
                
                // 显示友好的提示信息
                const message = '会话已过期或未登录，请刷新页面或重新登录';
                
                // 创建一个悬浮提示
                showAuthError(message);
                
                // 抛出特定错误
                throw new Error(`未授权访问: ${message}`);
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
        AppState.errors.push(error.message);
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
    // 确保使用最新的API基础URL
    const apiBaseUrl = window.API_BASE_URL || API_BASE_URL;
    const url = `${apiBaseUrl}${endpoint}`;
    
    console.log('API DELETE请求:', url);
    
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
                console.error('收到401未授权响应，但暂时禁用自动跳转');
                
                // 显示友好的提示信息
                const message = '会话已过期或未登录，请刷新页面或重新登录';
                
                // 创建一个悬浮提示
                showAuthError(message);
                
                // 抛出特定错误
                throw new Error(`未授权访问: ${message}`);
            }
            
            // 抛出错误以便调用者处理
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        // 尝试解析JSON响应
        try {
            return response.json();
        } catch (e) {
            // 如果响应为空，返回一个成功标志
            return { success: true };
        }
    })
    .catch(error => {
        AppState.isLoading = false;
        AppState.errors.push(error.message);
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

/**
 * 显示认证错误提示
 * @param {string} message 错误信息
 */
function showAuthError(message) {
    // 检查是否已存在提示
    let authError = document.getElementById('auth-error-toast');
    
    if (!authError) {
        authError = document.createElement('div');
        authError.id = 'auth-error-toast';
        authError.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #f8d7da;
            color: #721c24;
            padding: 15px 25px;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 350px;
            animation: fadeIn 0.3s ease;
        `;
        
        // 添加登录按钮
        const loginButton = document.createElement('button');
        loginButton.textContent = '前往登录';
        loginButton.style.cssText = `
            display: block;
            margin-top: 10px;
            padding: 5px 15px;
            background-color: #0275d8;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        
        loginButton.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
        
        // 添加关闭按钮
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 10px;
            font-size: 20px;
            cursor: pointer;
        `;
        
        closeButton.addEventListener('click', function() {
            document.body.removeChild(authError);
        });
        
        authError.appendChild(document.createTextNode(message));
        authError.appendChild(loginButton);
        authError.appendChild(closeButton);
        
        document.body.appendChild(authError);
        
        // 3秒后自动关闭
        setTimeout(() => {
            if (authError.parentNode) {
                authError.parentNode.removeChild(authError);
            }
        }, 5000);
    }
} 