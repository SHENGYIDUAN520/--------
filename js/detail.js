// DOM 元素加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 更新时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 初始化健康趋势图
    initHealthTrendChart();
    
    // 设置模拟数据定时更新
    setInterval(updateChartsWithRandomData, 5000);
    
    // 检查登录状态
    checkLoginStatus();
});

// 更新当前时间
function updateCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    const timeString = `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
    document.getElementById('current-time').textContent = timeString;
}

// 检查登录状态
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        // 未登录，跳转到登录页
        window.location.href = 'login.html';
    }
}

// 初始化健康趋势图
function initHealthTrendChart() {
    const chartDom = document.getElementById('health-trend-chart');
    const myChart = echarts.init(chartDom);
    
    const days = getLast7Days();
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['活动量', '血压', '心率', '睡眠质量'],
            textStyle: {
                color: 'rgba(255, 255, 255, 0.7)'
            },
            top: 0
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '40px',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: days,
            axisLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            },
            axisLabel: {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 10
            }
        },
        yAxis: {
            type: 'value',
            splitLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            axisLine: {
                show: true,
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            },
            axisLabel: {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 10
            }
        },
        series: [
            {
                name: '活动量',
                type: 'bar',
                stack: 'total',
                emphasis: {
                    focus: 'series'
                },
                data: [3.2, 2.5, 3.0, 2.8, 2.2, 3.1, 2.8],
                itemStyle: {
                    color: '#4CAF50'
                }
            },
            {
                name: '血压',
                type: 'line',
                emphasis: {
                    focus: 'series'
                },
                data: [80, 82, 81, 85, 83, 78, 79],
                itemStyle: {
                    color: '#2196F3'
                },
                smooth: true
            },
            {
                name: '心率',
                type: 'line',
                emphasis: {
                    focus: 'series'
                },
                data: [75, 78, 76, 80, 78, 74, 76],
                itemStyle: {
                    color: '#F44336'
                },
                smooth: true
            },
            {
                name: '睡眠质量',
                type: 'line',
                emphasis: {
                    focus: 'series'
                },
                data: [85, 82, 88, 80, 78, 90, 86],
                itemStyle: {
                    color: '#9C27B0'
                },
                smooth: true
            }
        ]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.healthTrendChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 获取过去7天的日期标签
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        days.push(`${month}-${day}`);
    }
    return days;
}

// 使用随机数据更新图表
function updateChartsWithRandomData() {
    // 更新健康趋势图表
    if (window.healthTrendChart) {
        const activityData = Array(7).fill().map(() => (Math.random() * 1.5 + 2).toFixed(1)); // 2.0-3.5小时
        const bloodPressureData = Array(7).fill().map(() => Math.floor(Math.random() * 10 + 75)); // 75-85
        const heartRateData = Array(7).fill().map(() => Math.floor(Math.random() * 10 + 70)); // 70-80
        const sleepQualityData = Array(7).fill().map(() => Math.floor(Math.random() * 15 + 75)); // 75-90
        
        window.healthTrendChart.setOption({
            series: [
                {
                    data: activityData
                },
                {
                    data: bloodPressureData
                },
                {
                    data: heartRateData
                },
                {
                    data: sleepQualityData
                }
            ]
        });
    }
}

// 视频控制按钮功能
document.querySelectorAll('.video-controls .btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const action = this.textContent;
        switch(action) {
            case '通话':
                alert('正在连接通话...');
                break;
            case '拍照':
                alert('已保存当前画面');
                break;
            case '录像':
                if(this.dataset.recording) {
                    this.dataset.recording = '';
                    this.textContent = '录像';
                    alert('录像已停止并保存');
                } else {
                    this.dataset.recording = 'true';
                    this.textContent = '停止';
                    alert('开始录像...');
                }
                break;
        }
    });
}); 