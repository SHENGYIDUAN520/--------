/**
 * 注册页面JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const registerError = document.getElementById('register-error');
    
    // 处理注册表单提交
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // 获取表单数据
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        
        // 表单验证
        if (!username || !password || !confirmPassword) {
            showRegisterError('用户名、密码和确认密码不能为空');
            return;
        }
        
        if (password !== confirmPassword) {
            showRegisterError('两次输入的密码不一致');
            return;
        }
        
        if (password.length < 6) {
            showRegisterError('密码长度不能少于6个字符');
            return;
        }
        
        if (email && !isValidEmail(email)) {
            showRegisterError('请输入有效的电子邮箱地址');
            return;
        }
        
        if (phone && !isValidPhone(phone)) {
            showRegisterError('请输入有效的手机号码');
            return;
        }
        
        // 显示加载状态
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bi bi-arrow-repeat"></i> 注册中...';
        
        // 调用注册API
        apiPost('/auth/register', {
            username: username,
            password: password,
            email: email || null,
            phone: phone || null
        })
        .then(response => {
            if (response.user_id) {
                // 注册成功，显示成功消息并跳转到登录页面
                showSuccess('注册成功，即将跳转到登录页面...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showRegisterError('注册失败，请重试');
            }
        })
        .catch(error => {
            console.error('注册失败', error);
            showRegisterError(error.message || '注册失败，请重试');
        })
        .finally(() => {
            // 恢复按钮状态
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        });
    });
    
    // 输入框改变时隐藏错误消息
    const inputs = [usernameInput, passwordInput, confirmPasswordInput, emailInput, phoneInput];
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            hideRegisterError();
        });
    });
});

/**
 * 显示注册错误消息
 * @param {string} message 错误消息
 */
function showRegisterError(message) {
    const registerError = document.getElementById('register-error');
    registerError.textContent = message;
    registerError.style.display = 'block';
}

/**
 * 隐藏注册错误消息
 */
function hideRegisterError() {
    const registerError = document.getElementById('register-error');
    registerError.style.display = 'none';
}

/**
 * 验证电子邮箱格式
 * @param {string} email 电子邮箱地址
 * @returns {boolean} 是否有效
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 验证手机号码格式
 * @param {string} phone 手机号码
 * @returns {boolean} 是否有效
 */
function isValidPhone(phone) {
    const phoneRegex = /^1[3456789]\d{9}$/;
    return phoneRegex.test(phone);
}

/**
 * 显示成功消息
 * @param {string} message 成功消息
 */
function showSuccess(message) {
    // 创建成功消息元素
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // 插入到表单上方
    const registerForm = document.getElementById('register-form');
    registerForm.parentNode.insertBefore(successDiv, registerForm);
    
    // 隐藏表单
    registerForm.style.display = 'none';
} 