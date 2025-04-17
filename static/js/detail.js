// 智能陪护监控平台 - 老人详情页面脚本

// 全局变量
let isVideoConnected = false;
let videoRefreshInterval = null;
let serverUrl = '';

// DOM元素
const videoElement = document.getElementById('detail-video-stream');
const btnConnectVideo = document.getElementById('btn-connect-video');
const btnSnapshotDetail = document.getElementById('btn-snapshot-detail');
const btnFullscreenDetail = document.getElementById('btn-fullscreen-detail');

// 初始化函数
function initDetailPage() {
    // 更新当前时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 从localStorage获取服务器地址
    serverUrl = localStorage.getItem('serverUrl') || 'http://47.97.160.91:5000';
    
    // 设置视频控制按钮事件监听器
    btnConnectVideo.addEventListener('click', toggleVideoConnection);
    btnSnapshotDetail.addEventListener('click', takeDetailSnapshot);
    btnFullscreenDetail.addEventListener('click', toggleDetailFullscreen);
}

// 更新当前时间
function updateCurrentTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('current-time').textContent = now.toLocaleDateString('zh-CN', options);
}

// 切换视频连接状态
function toggleVideoConnection() {
    if (isVideoConnected) {
        disconnectDetailVideo();
    } else {
        connectDetailVideo();
    }
}

// 连接视频流
function connectDetailVideo() {
    if (isVideoConnected) return;
    
    // 更新UI状态
    btnConnectVideo.textContent = '断开';
    videoElement.innerHTML = '<div class="connecting-indicator">正在连接...</div>';
    
    // 开始刷新图像
    videoRefreshInterval = setInterval(refreshDetailImage, 1000);
    
    // 更新状态
    isVideoConnected = true;
}

// 断开视频流
function disconnectDetailVideo() {
    if (!isVideoConnected) return;
    
    // 停止刷新图像
    if (videoRefreshInterval) {
        clearInterval(videoRefreshInterval);
        videoRefreshInterval = null;
    }
    
    // 恢复占位符
    videoElement.innerHTML = '<div class="placeholder-video">点击连接摄像头</div>';
    
    // 更新状态
    isVideoConnected = false;
    btnConnectVideo.textContent = '连接';
}

// 刷新图像
function refreshDetailImage() {
    if (!isVideoConnected) return;
    
    fetch(`${serverUrl}/api/image-info`)
        .then(response => {
            if (!response.ok) {
                throw new Error('获取图像信息失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('获取图像信息错误:', data.error);
                return;
            }
            
            // 构建图像URL，添加时间戳防止缓存
            const imageUrl = `${serverUrl}${data.path}?t=${Date.now()}`;
            
            // 检查是否已经有图像元素
            let imgElement = videoElement.querySelector('img');
            
            if (!imgElement) {
                // 创建新的图像元素
                videoElement.innerHTML = '';
                imgElement = document.createElement('img');
                imgElement.classList.add('detail-video-feed');
                videoElement.appendChild(imgElement);
            }
            
            // 更新图像
            imgElement.src = imageUrl;
            
            // 更新时间戳显示
            const timestampElement = videoElement.querySelector('.video-timestamp') || document.createElement('div');
            timestampElement.className = 'video-timestamp';
            timestampElement.textContent = data.formatted_time;
            
            if (!videoElement.querySelector('.video-timestamp')) {
                videoElement.appendChild(timestampElement);
            }
        })
        .catch(error => {
            console.error('获取最新图像失败:', error);
            
            // 如果多次失败，断开连接
            if (isVideoConnected && error.toString().includes('获取图像信息失败')) {
                disconnectDetailVideo();
            }
        });
}

// 拍照
function takeDetailSnapshot() {
    if (!isVideoConnected) {
        alert('请先连接到视频流');
        return;
    }
    
    // 创建全屏遮罩
    const overlay = document.createElement('div');
    overlay.className = 'snapshot-overlay';
    document.body.appendChild(overlay);
    
    // 添加闪光效果
    overlay.style.opacity = '1';
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }, 100);
    
    // 显示成功消息
    const msgContainer = document.createElement('div');
    msgContainer.className = 'snapshot-message';
    msgContainer.textContent = '已保存截图';
    document.body.appendChild(msgContainer);
    
    setTimeout(() => {
        msgContainer.style.opacity = '0';
        setTimeout(() => {
            msgContainer.remove();
        }, 300);
    }, 2000);
}

// 全屏显示
function toggleDetailFullscreen() {
    const videoContainer = videoElement.parentElement;
    
    if (!document.fullscreenElement) {
        if (videoContainer.requestFullscreen) {
            videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
            videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.msRequestFullscreen) {
            videoContainer.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initDetailPage); 