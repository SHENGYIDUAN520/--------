// 智能陪护监控平台 - 老人详情页面脚本

// 全局变量
let isVideoPlaying = false;
let serverUrl = '';

// DOM元素
const videoElement = document.getElementById('detail-video-stream');
const videoPlayer = document.getElementById('detail-video-player');
const videoPlaceholder = document.getElementById('video-placeholder-detail');
const btnPlayDetail = document.getElementById('btn-play-detail');
const btnPauseDetail = document.getElementById('btn-pause-detail');
const btnSnapshotDetail = document.getElementById('btn-snapshot-detail');
const btnFullscreenDetail = document.getElementById('btn-fullscreen-detail');

// 时间更新
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(/\//g, '/');
    
    document.getElementById('current-time').textContent = timeString;
}

// 初始更新时间
updateTime();

// 每秒更新时间
setInterval(updateTime, 1000);

// 初始化函数
function initDetailPage() {
    // 从localStorage获取服务器地址
    serverUrl = localStorage.getItem('serverUrl') || 'http://localhost:5000';
    
    // 设置视频控制按钮事件监听器
    btnPlayDetail.addEventListener('click', playDetailVideo);
    btnPauseDetail.addEventListener('click', pauseDetailVideo);
    btnSnapshotDetail.addEventListener('click', takeDetailSnapshot);
    btnFullscreenDetail.addEventListener('click', toggleDetailFullscreen);
}

// 更新UI状态
function updateDetailVideoUI(playing) {
    if (playing) {
        videoPlaceholder.style.display = 'none';
        videoPlayer.style.display = 'block';
        btnPlayDetail.disabled = true;
        btnPauseDetail.disabled = false;
        btnSnapshotDetail.disabled = false;
    } else {
        if (!videoPlayer.src) {
            videoPlaceholder.style.display = 'block';
            videoPlayer.style.display = 'none';
        }
        btnPlayDetail.disabled = false;
        btnPauseDetail.disabled = true;
        btnSnapshotDetail.disabled = true;
    }
}

// 播放视频
function playDetailVideo() {
    // 确保视频源已设置
    if (!videoPlayer.src) {
        videoPlayer.src = 'videos/demo1.mp4';
    }
    
    videoPlayer.play().then(() => {
        isVideoPlaying = true;
        updateDetailVideoUI(true);
    }).catch(error => {
        console.error('视频播放失败:', error);
        alert('无法播放视频，请检查视频文件是否存在');
        isVideoPlaying = false;
        updateDetailVideoUI(false);
    });
}

// 暂停视频
function pauseDetailVideo() {
    videoPlayer.pause();
    isVideoPlaying = false;
    updateDetailVideoUI(false);
}

// 全屏功能
function toggleDetailFullscreen() {
    if (!document.fullscreenElement) {
        videoElement.requestFullscreen().catch(err => {
            console.error(`全屏错误: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// 截图功能
function takeDetailSnapshot() {
    if (!isVideoPlaying || videoPlayer.paused) {
        alert('无法截图：视频未播放');
        return;
    }
    
    try {
        // 创建临时画布
        const canvas = document.createElement('canvas');
        canvas.width = videoPlayer.videoWidth;
        canvas.height = videoPlayer.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
        
        // 转换为图片并下载
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `智能陪护监控_截图_${timestamp}.png`;
        a.href = dataUrl;
        a.click();
    } catch (error) {
        console.error('截图失败:', error);
        alert('截图失败，请稍后再试');
    }
}

// 视频结束事件处理
function handleVideoEnded() {
    isVideoPlaying = false;
    updateDetailVideoUI(false);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化UI状态
    updateDetailVideoUI(false);
    
    // 添加视频结束事件监听
    videoPlayer.addEventListener('ended', handleVideoEnded);
    
    // 按钮事件
    btnPlayDetail.addEventListener('click', playDetailVideo);
    btnPauseDetail.addEventListener('click', pauseDetailVideo);
    btnSnapshotDetail.addEventListener('click', takeDetailSnapshot);
    btnFullscreenDetail.addEventListener('click', toggleDetailFullscreen);
    
    // 页面关闭时暂停视频
    window.addEventListener('beforeunload', function() {
        if (videoPlayer && !videoPlayer.paused) {
            videoPlayer.pause();
        }
    });
}); 