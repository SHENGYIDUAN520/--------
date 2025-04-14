// 简单的登录功能
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 简单验证（实际项目中应该通过API接口进行验证）
    if (username && password) {
        // 模拟登录成功
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        
        // 跳转到主页
        window.location.href = 'index.html';
    } else {
        alert('请输入用户名和密码');
    }
}

// 检查是否记住了登录状态
window.onload = function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        const username = localStorage.getItem('username');
        if (username) {
            document.getElementById('username').value = username;
            document.getElementById('remember').checked = true;
        }
    }
};