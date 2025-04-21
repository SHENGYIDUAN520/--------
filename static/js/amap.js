// 全局变量
let map = null;
let geolocation = null;
let placeSearch = null;
let nearbyHospitals = [];

// 初始化高德地图的回调函数
function initAMap() {
    console.log('开始初始化高德地图');
    mapLoaded = true; // 设置地图已加载标志
    clearTimeout(mapLoadTimeout); // 清除超时定时器
    
    try {
        // 清理可能存在的旧图例和提示
        clearMapOverlays();
        
        // 创建地图实例，使用2D模式提高兼容性和加载速度
        map = new AMap.Map('amap-container', {
            zoom: 15,
            resizeEnable: true,
            viewMode: '2D', // 使用2D模式增强兼容性
            jogEnable: false, // 禁用地图拖拽时的缓动效果
            mapStyle: 'amap://styles/normal', // 简洁样式
            buildingAnimation: false, // 关闭建筑物动画效果
            pitchEnable: false, // 禁用倾斜，保持2D视角
            showIndoorMap: false // 关闭室内地图以提高性能
        });
        
        // 添加工具条和比例尺
        map.plugin(['AMap.ToolBar', 'AMap.Scale'], function() {
            map.addControl(new AMap.ToolBar({
                position: 'RB',
                liteStyle: true // 使用简洁模式
            }));
            map.addControl(new AMap.Scale());
        });
        
        // 使用默认位置（昆明理工大学）先设置地图中心
        const defaultPosition = [102.853568, 24.823734]; // 昆明理工大学坐标
        map.setCenter(defaultPosition);
        
        // 添加定位插件
        map.plugin('AMap.Geolocation', function() {
            geolocation = new AMap.Geolocation({
                enableHighAccuracy: true, // 使用高精度定位
                timeout: 10000, // 超时时间
                buttonPosition: 'RB', // 定位按钮位置
                buttonOffset: new AMap.Pixel(10, 20), // 定位按钮偏移
                zoomToAccuracy: true, // 定位成功后调整地图视野
                GeoLocationFirst: false // 优先使用IP定位
            });
            map.addControl(geolocation);
            
            try {
                // 先使用默认位置标记
                addUserMarker(defaultPosition);
                
                // 开始定位
                geolocation.getCurrentPosition(function(status, result) {
                    if (status === 'complete') {
                        onLocationSuccess(result);
                    } else {
                        console.error('定位失败:', result);
                        // 使用默认位置
                        onLocationError(result);
                        
                        // 在地图上显示定位权限提示
                        if (result.originMessage && result.originMessage.indexOf('permission denied') > -1) {
                            showPermissionError();
                        }
                    }
                });
            } catch (locationError) {
                console.error('定位过程发生错误:', locationError);
                onLocationError({message: '定位过程发生错误'});
            }
            
            // 无论定位成功与否，都搜索附近医疗设施
            searchNearbyHospitals(defaultPosition);
        });
        
        // 添加POI搜索插件
        map.plugin('AMap.PlaceSearch', function() {
            placeSearch = new AMap.PlaceSearch({
                pageSize: 10,
                pageIndex: 1,
                extensions: 'all',
                type: '090100|090200|090300' // 医疗、药店、诊所类型
            });
        });
        
        console.log('高德地图初始化成功');
    } catch (error) {
        console.error('地图初始化失败:', error);
        handleMapLoadError();
    }
}

// 定位成功回调
function onLocationSuccess(result) {
    console.log('定位成功:', result);
    
    const position = result.position;
    // 在地图上添加当前位置标记
    addUserMarker(position);
    
    // 搜索附近医疗设施
    searchNearbyHospitals(position);
}

// 定位失败回调
function onLocationError(result) {
    console.error('定位失败:', result);
    
    // 使用默认位置（昆明理工大学）
    const defaultPosition = [102.853568, 24.823734]; // 昆明理工大学坐标
    
    try {
        map.setCenter(defaultPosition);
        
        // 在地图上添加默认位置标记
        addUserMarker(defaultPosition);
        
        // 搜索附近医疗设施
        searchNearbyHospitals(defaultPosition);
    } catch (error) {
        console.error('设置默认位置时出错:', error);
        updateDefaultHospitalInfo();
    }
}

// 添加用户位置标记
function addUserMarker(position) {
    try {
        new AMap.Marker({
            position: position,
            map: map,
            icon: new AMap.Icon({
                size: new AMap.Size(32, 32),
                image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
            }),
            title: '当前位置'
        });
    } catch (error) {
        console.error('添加位置标记失败:', error);
    }
}

// 搜索附近医疗设施
function searchNearbyHospitals(position) {
    if (!placeSearch) {
        console.error('搜索插件未初始化');
        updateDefaultHospitalInfo();
        return;
    }
    
    try {
        // 修复搜索配置，更精确指定医疗机构类型
        placeSearch.setCity(""); // 清空城市限制以获取更准确的结果
        placeSearch.setType('090100|090200|090300'); // 设置POI类型为医院、诊所、药店
        placeSearch.setPageSize(10); // 增加结果数量以显示更多医院
        placeSearch.setPageIndex(1); // 页码
        
        // 执行附近搜索，明确搜索关键词为医疗机构
        placeSearch.searchNearBy('医院|诊所|药店', position, 5000, function(status, result) {
            if (status === 'complete' && result.info === 'OK') {
                handleSearchResult(result);
            } else {
                console.error('搜索医疗设施失败:', status, result);
                // 安全码错误或网络问题，使用默认医院信息
                updateDefaultHospitalInfo();
            }
        });
    } catch (error) {
        console.error('搜索医疗设施时发生错误:', error);
        updateDefaultHospitalInfo();
    }
}

// 处理搜索结果
function handleSearchResult(result) {
    try {
        const pois = result.poiList.pois;
        nearbyHospitals = pois;
        
        if (pois && pois.length > 0) {
            // 在控制台输出找到的POI点信息，方便调试
            console.log('找到的医疗设施:', pois);
            
            // 更新最近医疗设施信息
            updateNearestHospitalInfo(pois[0]);
            
            // 在地图上添加医院标记
            addHospitalMarkers(pois);
        } else {
            console.warn('未找到附近医疗设施');
            updateDefaultHospitalInfo();
        }
    } catch (error) {
        console.error('处理搜索结果时出错:', error);
        updateDefaultHospitalInfo();
    }
}

// 添加医院标记到地图
function addHospitalMarkers(hospitals) {
    try {
        // 清除可能存在的旧标记
        if (window.hospitalMarkers) {
            window.hospitalMarkers.forEach(marker => {
                marker.setMap(null);
            });
        }
        
        // 创建新的标记集合
        window.hospitalMarkers = [];
        
        hospitals.forEach(hospital => {
            if (!hospital.location) {
                console.warn('医院数据缺少位置信息:', hospital);
                return;
            }
            
            // 根据医疗设施类型选择不同的图标
            let iconUrl = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png';
            if (hospital.type && hospital.type.includes('090200')) {
                // 诊所使用不同图标
                iconUrl = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png';
            } else if (hospital.type && hospital.type.includes('090300')) {
                // 药店使用不同图标
                iconUrl = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png';
            }
            
            // 创建标记并添加点击事件
            const marker = new AMap.Marker({
                position: [hospital.location.lng, hospital.location.lat],
                map: map,
                title: hospital.name,
                icon: new AMap.Icon({
                    size: new AMap.Size(32, 32),
                    image: iconUrl
                })
            });
            
            // 添加信息窗体
            marker.on('click', function() {
                const infoWindow = new AMap.InfoWindow({
                    content: `
                        <div style="padding:10px;">
                            <h4 style="margin:0;color:#0288d1;">${hospital.name}</h4>
                            <p style="margin:5px 0;">地址: ${hospital.address}</p>
                            <p style="margin:5px 0;">距离: ${hospital.distance}米</p>
                            ${hospital.tel ? `<p style="margin:5px 0;">电话: ${hospital.tel}</p>` : ''}
                        </div>
                    `,
                    offset: new AMap.Pixel(0, -32)
                });
                
                infoWindow.open(map, marker.getPosition());
            });
            
            window.hospitalMarkers.push(marker);
        });
    } catch (error) {
        console.error('添加医院标记时出错:', error);
    }
}

// 更新最近医疗设施信息
function updateNearestHospitalInfo(hospital) {
    const nearestHospitalElement = document.querySelector('.nearest-hospital');
    if (nearestHospitalElement) {
        nearestHospitalElement.innerHTML = `
            <h4>最近医疗设施</h4>
            <div class="nearest-info">
                <div class="hospital-name">
                    <i class="bi bi-hospital"></i>${hospital.name}
                </div>
                <div class="hospital-address">
                    <i class="bi bi-geo-alt"></i>${hospital.address}
                </div>
                <div class="hospital-distance">
                    <i class="bi bi-signpost-2"></i>${hospital.distance}米
                </div>
            </div>
        `;
    }
}

// 更新默认医院信息
function updateDefaultHospitalInfo() {
    const nearestHospitalElement = document.querySelector('.nearest-hospital');
    if (nearestHospitalElement) {
        nearestHospitalElement.innerHTML = `
            <h4>最近医疗设施</h4>
            <div class="nearest-info">
                <div class="hospital-name">
                    <i class="bi bi-hospital"></i>昆明医科大学第一附属医院
                </div>
                <div class="hospital-address">
                    <i class="bi bi-geo-alt"></i>云南省昆明市西昌路295号
                </div>
                <div class="hospital-distance">
                    <i class="bi bi-signpost-2"></i>2000米
                </div>
            </div>
        `;
    }
}

// 显示定位权限错误提示
function showPermissionError() {
    const mapContainer = document.getElementById('amap-container');
    
    // 创建提示元素
    const permissionTip = document.createElement('div');
    permissionTip.className = 'permission-tip';
    permissionTip.innerHTML = `
        <div style="position:absolute;left:10px;bottom:10px;background:rgba(255,255,255,0.9);padding:10px;border-radius:5px;box-shadow:0 2px 5px rgba(0,0,0,0.2);z-index:1000;max-width:250px;">
            <div style="color:#ff6b6b;font-weight:bold;margin-bottom:5px;">
                <i class="bi bi-exclamation-triangle"></i> 定位权限被拒绝
            </div>
            <div style="font-size:12px;color:#666;">
                当前使用默认位置。如需获取您的实际位置，请在浏览器设置中允许位置权限。
            </div>
        </div>
    `;
    
    // 添加到地图容器
    if (mapContainer) {
        mapContainer.appendChild(permissionTip);
    }
}

// 清理地图上的额外元素
function clearMapOverlays() {
    // 移除可能存在的图例
    const mapLegends = document.querySelectorAll('.map-legend');
    if (mapLegends.length > 0) {
        mapLegends.forEach(legend => {
            if (legend.parentNode) {
                legend.parentNode.removeChild(legend);
            }
        });
        window.legendAdded = false;
    }
    
    // 移除其他可能的提示元素
    const permissionTips = document.querySelectorAll('.permission-tip');
    if (permissionTips.length > 0) {
        permissionTips.forEach(tip => {
            if (tip.parentNode) {
                tip.parentNode.removeChild(tip);
            }
        });
    }
}

// 销毁地图资源的函数
window.destroyMap = function() {
    // 清理图例和其他覆盖物
    clearMapOverlays();
    
    // 销毁地图实例
    if (map) {
        map.destroy();
        map = null;
    }
    geolocation = null;
    placeSearch = null;
    nearbyHospitals = [];
    console.log('地图资源已清理');
}; 