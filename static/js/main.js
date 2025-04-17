// DOM 元素加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 更新时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 初始化所有图表
    initStatusChart();
    initSedentaryChart();
    initSleepChart();
    initGlobe();
    
    // 设置模拟数据定时更新
    setInterval(updateChartsWithRandomData, 5000);
    
    // 模拟紧急报警（5秒后触发一次）
    setTimeout(showAlertModal, 5000);
    
    // 检查登录状态已由common.js处理，此处不再重复检查
    // checkLoginStatus();
});

// 检查登录状态 - 保留但不再调用此函数
function checkLoginStatus() {
    // 使用与common.js一致的令牌检查逻辑
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    // 只要有token就认为已登录
    if (!token) {
        console.log('main.js: 未检测到token，跳转到登录页');
        window.location.href = 'login.html';
    } else {
        console.log('main.js: 检测到token，用户已登录');
        // 设置isLoggedIn标志，便于其他代码检查
        localStorage.setItem('isLoggedIn', 'true');
    }
}

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

// 初始化状况检测图表
function initStatusChart() {
    const chartDom = document.getElementById('status-chart');
    const myChart = echarts.init(chartDom);
    
    const option = {
        series: [{
            type: 'gauge',
            startAngle: 90,
            endAngle: -270,
            pointer: {
                show: false
            },
            progress: {
                show: true,
                overlap: false,
                roundCap: true,
                clip: false,
                itemStyle: {
                    color: '#2196F3'
                }
            },
            axisLine: {
                lineStyle: {
                    width: 20,
                    color: [
                        [0.3, '#F44336'],
                        [1, 'rgba(255, 255, 255, 0.1)']
                    ]
                }
            },
            splitLine: {
                show: false,
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                show: false
            },
            title: {
                fontSize: 14,
                color: '#FFFFFF',
                offsetCenter: [0, '70%']
            },
            data: [{
                value: 70,
                name: '正常'
            }],
            detail: {
                width: 50,
                height: 14,
                fontSize: 24,
                color: '#FFFFFF',
                formatter: '{value}%',
                offsetCenter: [0, 0]
            }
        }]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.statusChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 初始化静坐时间管控图表
function initSedentaryChart() {
    const chartDom = document.getElementById('sedentary-chart');
    const myChart = echarts.init(chartDom);
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        series: [{
            name: '静坐时间',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 10,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 2
            },
            label: {
                show: false
            },
            labelLine: {
                show: false
            },
            data: [
                { value: 27, name: '异常', itemStyle: { color: '#F44336' } },
                { value: 73, name: '正常', itemStyle: { color: '#4CAF50' } }
            ]
        }]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.sedentaryChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 初始化睡眠时长检测图表
function initSleepChart() {
    const chartDom = document.getElementById('sleep-chart');
    const myChart = echarts.init(chartDom);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                let result = params[0].name + '<br/>';
                params.forEach(param => {
                    result += param.marker + ' ' + param.seriesName + ': ' + param.value + '小时<br/>';
                });
                return result;
            }
        },
        legend: {
            show: false
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '5%',
            top: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
            min: 0,
            max: 10,
            interval: 2,
            axisLine: {
                show: true,
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            axisLabel: {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 10,
                formatter: '{value}h'
            }
        },
        series: [{
            name: '男主人',
            type: 'line',
            smooth: true,
            lineStyle: {
                width: 2,
                color: '#2196F3'
            },
            areaStyle: {
                opacity: 0.2,
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0,
                        color: 'rgba(33, 150, 243, 0.5)'
                    }, {
                        offset: 1,
                        color: 'rgba(33, 150, 243, 0.1)'
                    }]
                }
            },
            emphasis: {
                focus: 'series'
            },
            data: [7.0, 6.5, 7.2, 7.5, 6.8, 8.1, 7.6]
        }, {
            name: '女主人',
            type: 'line',
            smooth: true,
            lineStyle: {
                width: 2,
                color: '#9C27B0'
            },
            areaStyle: {
                opacity: 0.2,
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0,
                        color: 'rgba(156, 39, 176, 0.5)'
                    }, {
                        offset: 1,
                        color: 'rgba(156, 39, 176, 0.1)'
                    }]
                }
            },
            emphasis: {
                focus: 'series'
            },
            data: [8.2, 7.8, 7.5, 8.0, 7.2, 8.5, 8.1]
        }]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.sleepChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 初始化中央地球/网络节点动画
function initGlobe() {
    const chartDom = document.getElementById('globe-container');
    const myChart = echarts.init(chartDom);
    
    // 生成一些随机网络节点和连接
    const nodes = [];
    const edges = [];
    const categories = ['设备', '老人', '医护', '家属'];
    
    // 生成节点数据
    for (let i = 0; i < 20; i++) {
        const category = Math.floor(Math.random() * categories.length);
        nodes.push({
            name: categories[category] + '_' + i,
            category: category,
            value: Math.random() * 20 + 20
        });
    }
    
    // 生成边数据
    for (let i = 0; i < nodes.length; i++) {
        const target = Math.floor(Math.random() * nodes.length);
        if (i !== target) {
            edges.push({
                source: i,
                target: target,
                value: Math.random()
            });
        }
    }
    
    const option = {
        tooltip: {},
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [{
            type: 'graph',
            layout: 'force',
            force: {
                repulsion: 200,
                edgeLength: 80
            },
            roam: true,
            label: {
                show: false
            },
            emphasis: {
                lineStyle: {
                    width: 5
                }
            },
            data: nodes,
            links: edges,
            categories: categories.map(name => ({ name })),
            lineStyle: {
                opacity: 0.3,
                width: 1,
                curveness: 0.3,
                color: '#2196F3'
            },
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 1,
                shadowBlur: 8,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
        }]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.globeChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 使用随机数据更新图表
function updateChartsWithRandomData() {
    // 更新状况检测图表
    if (window.statusChart) {
        const normalValue = Math.floor(Math.random() * 30) + 70; // 70-100 之间的随机数
        window.statusChart.setOption({
            series: [{
                data: [{
                    value: normalValue,
                }]
            }]
        });
    }
    
    // 更新静坐时间管控图表
    if (window.sedentaryChart) {
        const abnormalValue = Math.floor(Math.random() * 40) + 10; // 10-50 之间的随机数
        const normalValue = 100 - abnormalValue;
        window.sedentaryChart.setOption({
            series: [{
                data: [
                    { value: abnormalValue, name: '异常' },
                    { value: normalValue, name: '正常' }
                ]
            }]
        });
    }
    
    // 更新睡眠时长检测图表
    if (window.sleepChart) {
        const maleData = Array(7).fill().map(() => (Math.random() * 2 + 6).toFixed(1)); // 6-8小时
        const femaleData = Array(7).fill().map(() => (Math.random() * 2 + 7).toFixed(1)); // 7-9小时
        window.sleepChart.setOption({
            series: [{
                data: maleData
            }, {
                data: femaleData
            }]
        });
    }
}

// 显示报警弹窗
function showAlertModal() {
    const alertModal = document.getElementById('alert-modal');
    if (alertModal) {
        // 更新报警时间为当前时间
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const timeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        document.getElementById('alert-time').textContent = timeString;
        
        // 显示弹窗
        alertModal.style.display = 'flex';
        
        // 添加警报声音效果（实际项目中可添加）
        // playAlertSound();
    }
}

// 关闭报警弹窗
function dismissAlert() {
    const alertModal = document.getElementById('alert-modal');
    if (alertModal) {
        alertModal.style.display = 'none';
    }
}

// 确认并通知
function confirmAlert() {
    alert('已确认事件并通知紧急联系人');
    dismissAlert();
}

// 紧急呼叫
function emergencyCall() {
    alert('正在连接紧急呼叫...');
    // 实际项目中这里应该有呼叫功能的代码
    dismissAlert();
}