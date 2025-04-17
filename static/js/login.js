/**
 * 登录页面JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheck = document.getElementById('remember');
    const loginError = document.getElementById('login-error');
    
    // 从本地存储获取保存的用户名
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberCheck.checked = true;
    }
    
    // 处理登录表单提交
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // 获取表单数据
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const remember = rememberCheck.checked;
        
        // 表单验证
        if (!username || !password) {
            showLoginError('用户名和密码不能为空');
            return;
        }
        
        // 保存用户名到本地存储
        if (remember) {
            localStorage.setItem('remembered_username', username);
        } else {
            localStorage.removeItem('remembered_username');
        }
        
        // 显示加载状态
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bi bi-arrow-repeat"></i> 登录中...';
        
        // 调用登录API - 修复路径，移除重复的/api前缀
        apiPost('/auth/login', { username, password })
            .then(response => {
                if (response.token && response.user) {
                    console.log('登录成功，保存认证信息');
                    // 保存认证信息 - 同时使用两套键名确保兼容性
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('auth_token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    localStorage.setItem('user_info', JSON.stringify(response.user));
                    
                    // 设置全局状态
                    AppState.token = response.token;
                    AppState.user = response.user;
                    
                    console.log('认证信息已保存，即将跳转');
                    // 使用replace直接跳转，避免浏览器历史记录问题
                    window.location.replace('/static/index.html');
                } else {
                    showLoginError('登录失败，请重试');
                }
            })
            .catch(error => {
                console.error('登录失败', error);
                showLoginError(error.message || '登录失败，请重试');
            })
            .finally(() => {
                // 恢复按钮状态
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            });
    });
    
    // 输入框改变时隐藏错误消息
    usernameInput.addEventListener('input', function() {
        hideLoginError();
    });
    
    passwordInput.addEventListener('input', function() {
        hideLoginError();
    });
    
    // 处理忘记密码链接点击
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(event) {
            event.preventDefault();
            alert('请联系管理员重置密码');
        });
    }
    
    // 处理注册链接点击
    const registerLink = document.querySelector('.register-link a');
    if (registerLink) {
        registerLink.addEventListener('click', function(event) {
            // 注册链接原生跳转处理，无需额外逻辑
        });
    }
});

/**
 * 显示登录错误消息
 * @param {string} message 错误消息
 */
function showLoginError(message) {
    const loginError = document.getElementById('login-error');
    loginError.textContent = message;
    loginError.style.display = 'block';
}

/**
 * 隐藏登录错误消息
 */
function hideLoginError() {
    const loginError = document.getElementById('login-error');
    loginError.style.display = 'none';
} 