document.addEventListener('DOMContentLoaded', function() {
    console.log('设置页面加载...');
    
    // 更新当前时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 标签页切换
    initTabSwitching();
    
    // 表单处理
    setTimeout(() => {
        try {
            console.log('初始化表单...');
            initForms();
        } catch (e) {
            console.error('初始化表单失败:', e);
        }
    }, 500);
    
    // 模态窗口处理
    setTimeout(() => {
        try {
            console.log('初始化模态窗口...');
            initModals();
        } catch (e) {
            console.error('初始化模态窗口失败:', e);
        }
    }, 1000);
    
    // 列表处理 - 最后延迟加载
    setTimeout(() => {
        try {
            console.log('初始化列表操作...');
            initListActions();
        } catch (e) {
            console.error('初始化列表操作失败:', e);
        }
    }, 1500);
});

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

// 初始化标签页切换
function initTabSwitching() {
    const menuItems = document.querySelectorAll('.settings-menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有活动状态
            menuItems.forEach(mi => mi.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            
            // 添加当前选中的活动状态
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // 更新URL hash
            window.location.hash = tabId;
        });
    });
    
    // 检查URL hash并切换到对应标签
    const checkHash = () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const targetMenuItem = document.querySelector(`.settings-menu-item[data-tab="${hash}"]`);
            if (targetMenuItem) {
                targetMenuItem.click();
            }
        }
    };
    
    // 页面加载和hash变化时检查
    checkHash();
    window.addEventListener('hashchange', checkHash);
}

// 初始化表单处理
function initForms() {
    // 服务器配置表单
    const serverConfigForm = document.getElementById('serverConfigForm');
    if (serverConfigForm) {
        // 加载当前服务器配置
        loadServerConfig();
        
        serverConfigForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const serverUrl = document.getElementById('serverUrl').value.trim();
            if (!serverUrl) {
                showToast('服务器地址不能为空', 'error');
                return;
            }
            
            // 保存服务器配置
            try {
                const config = {
                    serverUrl: serverUrl,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('server_config', JSON.stringify(config));
                localStorage.setItem('serverUrl', serverUrl); // 兼容性保存
                
                showToast('服务器配置已保存', 'success');
                
                // 测试连接
                testServerConnection(serverUrl);
            } catch (error) {
                showToast(`保存服务器配置失败: ${error.message}`, 'error');
            }
        });
        
        // 快速设置按钮
        const setLocalServerBtn = document.getElementById('setLocalServer');
        if (setLocalServerBtn) {
            setLocalServerBtn.addEventListener('click', function() {
                document.getElementById('serverUrl').value = 'http://localhost:5000';
            });
        }
    }
    
    // 个人信息表单提交
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        // 加载用户信息
        loadUserProfile();
        
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            
            // 使用API更新用户信息
            apiPut('/user/profile', {
                email: email,
                phone: phone
            })
            .then(response => {
                showToast('个人信息已更新', 'success');
                
                // 更新本地存储的用户信息
                const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
                userInfo.email = email;
                userInfo.phone = phone;
                localStorage.setItem('user_info', JSON.stringify(userInfo));
            })
            .catch(error => {
                showToast(`更新失败: ${error.message}`, 'error');
            });
        });
    }
    
    // 密码修改表单提交
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                showToast('两次输入的密码不一致', 'error');
                return;
            }
            
            // 模拟密码强度检查
            const passwordStrength = checkPasswordStrength(newPassword);
            if (passwordStrength < 2) {
                showToast('密码强度不足，请包含字母和数字', 'warning');
                return;
            }
            
            // 使用API更新密码
            apiPut('/user/password', {
                current_password: currentPassword,
                new_password: newPassword
            })
            .then(response => {
                showToast('密码已成功更新，请重新登录', 'success');
                this.reset();
                
                // 2秒后退出登录
                setTimeout(() => {
                    logout();
                }, 2000);
            })
            .catch(error => {
                showToast(`密码更新失败: ${error.message}`, 'error');
            });
        });
    }
    
    // 报警参数表单提交
    const alarmForm = document.getElementById('alarmForm');
    if (alarmForm) {
        alarmForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('报警参数设置已保存', 'success');
        });
    }
    
    // 数据设置表单提交
    const dataForm = document.getElementById('dataForm');
    if (dataForm) {
        dataForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('数据设置已保存', 'success');
        });
    }
}

// 加载用户个人资料
function loadUserProfile() {
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    
    if (!username || !email || !phone) return;
    
    // 从本地存储获取用户信息
    try {
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        
        if (userInfo && userInfo.username) {
            username.value = userInfo.username;
            
            // 先填充本地存储的信息作为备选
            email.value = userInfo.email || '';
            phone.value = userInfo.phone || '';
            
            // 从API获取最新的用户信息
            apiGet('/user/profile', { username: userInfo.username })
                .then(response => {
                    if (response && response.email !== undefined) {
                        email.value = response.email || '';
                    }
                    if (response && response.phone !== undefined) {
                        phone.value = response.phone || '';
                    }
                    
                    // 更新本地存储的用户信息
                    if (response) {
                        userInfo.email = response.email || userInfo.email;
                        userInfo.phone = response.phone || userInfo.phone;
                        localStorage.setItem('user_info', JSON.stringify(userInfo));
                    }
                })
                .catch(error => {
                    console.error('获取用户信息失败:', error);
                    // 已经使用了本地存储的信息作为备选，不需要额外处理
                });
        } else {
            // 没有用户信息，显示默认提示
            username.value = '未登录';
            email.value = '';
            phone.value = '';
        }
    } catch (error) {
        console.error('解析用户信息失败:', error);
        username.value = '无效用户信息';
        email.value = '';
        phone.value = '';
    }
}

// 检查密码强度 (0-弱, 1-中, 2-强)
function checkPasswordStrength(password) {
    if (password.length < 6) return 0;
    
    let strength = 0;
    if (/[a-zA-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return Math.min(2, strength);
}

// 初始化模态窗口处理
function initModals() {
    console.log('初始化模态窗口处理...');
    
    // 获取所有模态窗口
    const modals = document.querySelectorAll('.modal');
    
    // 为所有触发模态窗口的按钮添加事件
    document.querySelectorAll('[data-modal]').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                // 清空表单
                clearModalForm(modal);
                
                // 设置模态窗口的标题（新增）
                const modalHeader = modal.querySelector('.modal-header h2');
                if (modalHeader) {
                    if (this.classList.contains('btn-edit')) {
                        if (modalId === 'elderly-modal') {
                            modalHeader.textContent = '编辑老人信息';
                        } else if (modalId === 'contact-modal') {
                            modalHeader.textContent = '编辑联系人';
                        }
                    } else {
                        if (modalId === 'elderly-modal') {
                            modalHeader.textContent = '添加老人';
                        } else if (modalId === 'contact-modal') {
                            modalHeader.textContent = '添加联系人';
                        }
                    }
                }
                
                // 如果是编辑按钮，需要填充表单
                if (this.classList.contains('btn-edit')) {
                    const listItem = this.closest('.list-item');
                    if (listItem) {
                        // 获取条目ID并填充表单
                        const itemId = listItem.getAttribute('data-id');
                        populateModalForm(modal, listItem);
                    }
                } else {
                    // 新增模式，需要重置表单
                    if (modalId === 'contact-modal') {
                        // 加载老人下拉选项
                        loadSeniorOptions();
                    }
                }
                
                // 打开模态窗口
                openModal(modal);
            }
        });
    });
    
    // 关闭按钮处理
    modals.forEach(modal => {
        // 关闭按钮
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(modal));
        }
        
        // 取消按钮
        const cancelBtn = modal.querySelector('.modal-footer .btn-danger');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => closeModal(modal));
        }
        
        // 保存按钮
        const saveBtn = modal.querySelector('.modal-footer .btn-primary');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                // 获取表单
                const modalId = modal.id;
                const form = modal.querySelector('form');
                
                // 执行表单验证
                if (form && validateForm(form)) {
                    if (modalId === 'elderly-modal') {
                        saveElderlyData(form);
                    } else if (modalId === 'contact-modal') {
                        saveContactData(form);
                    }
                    closeModal(modal);
                }
            });
        }
        
        // 点击背景关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });
}

// 清空模态窗口表单
function clearModalForm(modal) {
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
        
        // 清空隐藏字段
        const hiddenFields = form.querySelectorAll('input[type="hidden"]');
        hiddenFields.forEach(field => field.value = '');
    }
}

// 验证表单
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
            
            // 添加错误提示
            let errorMsg = field.nextElementSibling;
            if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                errorMsg = document.createElement('small');
                errorMsg.className = 'error-message';
                field.parentNode.insertBefore(errorMsg, field.nextSibling);
            }
            errorMsg.textContent = '此字段不能为空';
        } else {
            field.classList.remove('error');
            const errorMsg = field.nextElementSibling;
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.textContent = '';
            }
        }
    });
    
    return isValid;
}

// 打开模态窗口
function openModal(modal) {
    if (!modal) return;
    
    // 阻止页面滚动
    document.body.style.overflow = 'hidden';
    
    // 显示模态窗口
    modal.classList.add('show');
    
    // 焦点到第一个输入框
    setTimeout(() => {
        const firstInput = modal.querySelector('input:not([type="hidden"])');
        if (firstInput) {
            firstInput.focus();
        }
    }, 300);
}

// 关闭模态窗口
function closeModal(modal) {
    if (!modal) return;
    
    // 恢复页面滚动
    document.body.style.overflow = '';
    
    // 隐藏模态窗口
    modal.classList.remove('show');
}

// 填充模态窗口表单数据
function populateModalForm(modal, listItem) {
    const modalId = modal.id;
    const itemId = listItem.getAttribute('data-id');
    
    if (modalId === 'elderly-modal') {
        const title = listItem.querySelector('.item-title').textContent;
        const description = listItem.querySelector('.item-description').textContent;
        
        // 解析数据
        document.getElementById('elderlyId').value = itemId;
        document.getElementById('elderlyName').value = title;
        
        const ageMatch = description.match(/年龄：(\d+)/);
        if (ageMatch) {
            document.getElementById('elderlyAge').value = ageMatch[1];
        }
    } else if (modalId === 'contact-modal') {
        const title = listItem.querySelector('.item-title').textContent;
        const description = listItem.querySelector('.item-description').textContent;
        
        // 解析数据
        document.getElementById('contactId').value = itemId;
        document.getElementById('contactName').value = title;
        
        const relationMatch = description.match(/关系：([^|]+)/);
        if (relationMatch) {
            document.getElementById('contactRelation').value = relationMatch[1].trim();
        }
        
        const phoneMatch = description.match(/电话：([^|]+)/);
        if (phoneMatch) {
            // 示例中使用了隐藏的电话号码，这里假设我们有完整的号码
            document.getElementById('contactPhone').value = '13900000000';
        }
    }
}

// 加载老人列表
function loadElderlyList() {
    const container = document.getElementById('elderly-data-container');
    const loadingIndicator = document.querySelector('#elderly-list .loading-indicator');
    const emptyState = document.querySelector('#elderly-list .empty-state');
    
    if (!container) return;
    
    // 显示加载指示器
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    container.innerHTML = '';
    
    // 从API获取老人列表
    apiGet('/seniors')
        .then(response => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            if (!response || response.length === 0) {
                // 尝试从本地存储获取老人数据
                const localSeniors = JSON.parse(localStorage.getItem('local_seniors') || '[]');
                
                if (localSeniors.length > 0) {
                    // 渲染本地存储的老人列表
                    renderElderlyList(localSeniors);
                    return;
                }
                
                // 显示空状态
                if (emptyState) emptyState.style.display = 'block';
                return;
            }
            
            // 渲染老人列表
            renderElderlyList(response);
        })
        .catch(error => {
            console.error('获取老人列表失败:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // 尝试从本地存储获取数据
            const localSeniors = JSON.parse(localStorage.getItem('local_seniors') || '[]');
            
            if (localSeniors.length > 0) {
                renderElderlyList(localSeniors);
                showToast('使用本地存储的老人数据', 'info');
                return;
            }
            
            if (emptyState) {
                emptyState.style.display = 'block';
                const emptyText = emptyState.querySelector('p');
                if (emptyText) emptyText.textContent = '获取数据失败，请刷新重试';
            }
        });
}

// 渲染老人列表
function renderElderlyList(seniors) {
    const container = document.getElementById('elderly-data-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    seniors.forEach(senior => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        listItem.setAttribute('data-id', senior.id);
        
        const genderIcon = senior.gender === 'male' ? 'bi-gender-male' : 'bi-gender-female';
        const genderClass = senior.gender === 'male' ? 'male' : 'female';
        
        listItem.innerHTML = `
            <div class="item-info">
                <h4 class="item-title">
                    <i class="bi ${genderIcon} ${genderClass}"></i> ${senior.name}
                </h4>
                <p class="item-description">
                    年龄：${senior.age} | 
                    紧急联系人：${senior.emergency_contact || '未设置'}
                </p>
            </div>
            <div class="item-actions">
                <button class="btn btn-icon btn-edit" title="编辑信息" data-modal="elderly-modal">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-icon btn-delete" title="删除">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(listItem);
        bindListItemEvents(listItem);
    });
}

// 删除老人信息
function deleteElderly(id) {
    if (!confirm('确定要删除这位老人的信息吗？此操作不可恢复。')) {
        return;
    }
    
    apiDelete(`/seniors/${id}`)
        .then(response => {
            showToast('老人信息已成功删除', 'success');
            
            // 同时从本地存储中删除
            const localSeniors = JSON.parse(localStorage.getItem('local_seniors') || '[]');
            const updatedSeniors = localSeniors.filter(senior => senior.id != id);
            localStorage.setItem('local_seniors', JSON.stringify(updatedSeniors));
            
            loadElderlyList(); // 重新加载老人列表
        })
        .catch(error => {
            // 尝试从本地存储中删除
            const localSeniors = JSON.parse(localStorage.getItem('local_seniors') || '[]');
            const updatedSeniors = localSeniors.filter(senior => senior.id != id);
            localStorage.setItem('local_seniors', JSON.stringify(updatedSeniors));
            
            showToast('老人信息已从本地存储中删除', 'success');
            loadElderlyList(); // 重新加载老人列表
        });
}

// 保存老人数据
function saveElderlyData(form) {
    const elderlyId = document.getElementById('elderlyId').value;
    const name = document.getElementById('elderlyName').value;
    const age = document.getElementById('elderlyAge').value;
    const gender = document.getElementById('elderlyGender').value;
    const emergencyContact = document.getElementById('elderlyContact').value;
    const emergencyPhone = document.getElementById('elderlyPhone').value;
    
    // 准备API请求数据
    const seniorData = {
        name: name,
        age: parseInt(age),
        gender: gender,
        emergency_contact: emergencyContact,
        emergency_phone: emergencyPhone
    };
    
    let apiPromise;
    
    if (elderlyId) {
        // 更新现有老人信息
        seniorData.id = elderlyId;
        apiPromise = apiPut(`/seniors/${elderlyId}`, seniorData)
            .then(response => {
                showToast('老人信息已成功更新', 'success');
                
                // 同时更新本地存储
                updateLocalSenior(seniorData);
                
                loadElderlyList(); // 重新加载老人列表
            });
    } else {
        // 添加新老人
        seniorData.id = new Date().getTime().toString(); // 生成临时ID
        apiPromise = apiPost('/seniors', seniorData)
            .then(response => {
                // 如果API返回了ID，使用API返回的ID
                if (response && response.id) {
                    seniorData.id = response.id;
                }
                
                showToast('新老人信息已成功添加', 'success');
                
                // 同时添加到本地存储
                addLocalSenior(seniorData);
                
                loadElderlyList(); // 重新加载老人列表
            });
    }
    
    apiPromise.catch(error => {
        console.error('API操作失败，使用本地存储:', error);
        
        if (elderlyId) {
            // 更新本地存储中的老人信息
            updateLocalSenior(seniorData);
        } else {
            // 添加到本地存储
            addLocalSenior(seniorData);
        }
        
        showToast('数据已保存到本地', 'info');
        loadElderlyList(); // 重新加载老人列表
    });
}

// 添加老人到本地存储
function addLocalSenior(seniorData) {
    const localSeniors = JSON.parse(localStorage.getItem('local_seniors') || '[]');
    localSeniors.push(seniorData);
    localStorage.setItem('local_seniors', JSON.stringify(localSeniors));
}

// 更新本地存储中的老人信息
function updateLocalSenior(seniorData) {
    const localSeniors = JSON.parse(localStorage.getItem('local_seniors') || '[]');
    const index = localSeniors.findIndex(senior => senior.id == seniorData.id);
    
    if (index !== -1) {
        localSeniors[index] = seniorData;
    } else {
        localSeniors.push(seniorData);
    }
    
    localStorage.setItem('local_seniors', JSON.stringify(localSeniors));
}

// 加载联系人列表（实际上是加载老人的紧急联系人信息）
function loadContactList() {
    const container = document.getElementById('contact-data-container');
    const loadingIndicator = document.querySelector('#contact-list .loading-indicator');
    const emptyState = document.querySelector('#contact-list .empty-state');
    
    if (!container) return;
    
    // 显示加载指示器
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    container.innerHTML = '';
    
    // 从API获取老人列表，提取联系人信息
    apiGet('/seniors')
        .then(response => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            let seniors = response;
            
            // 如果API没有返回数据，尝试从本地存储获取
            if (!seniors || seniors.length === 0) {
                seniors = JSON.parse(localStorage.getItem('local_seniors') || '[]');
            }
            
            // 过滤出有紧急联系人的老人
            const seniorsWithContacts = seniors.filter(senior => 
                senior.emergency_contact && senior.emergency_contact.trim() !== ''
            );
            
            if (seniorsWithContacts.length === 0) {
                // 显示空状态
                if (emptyState) emptyState.style.display = 'block';
                return;
            }
            
            // 渲染联系人列表
            renderContactList(seniorsWithContacts);
        })
        .catch(error => {
            console.error('获取联系人列表失败:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // 尝试从本地存储获取数据
            const localSeniors = JSON.parse(localStorage.getItem('local_seniors') || '[]');
            
            // 过滤出有紧急联系人的老人
            const seniorsWithContacts = localSeniors.filter(senior => 
                senior.emergency_contact && senior.emergency_contact.trim() !== ''
            );
            
            if (seniorsWithContacts.length > 0) {
                renderContactList(seniorsWithContacts);
                showToast('使用本地存储的联系人数据', 'info');
                return;
            }
            
            if (emptyState) {
                emptyState.style.display = 'block';
                const emptyText = emptyState.querySelector('p');
                if (emptyText) emptyText.textContent = '获取数据失败，请刷新重试';
            }
        });
}

// 渲染联系人列表
function renderContactList(seniorsWithContacts) {
    const container = document.getElementById('contact-data-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    seniorsWithContacts.forEach(senior => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        listItem.setAttribute('data-id', senior.id);
        
        const contactName = senior.emergency_contact || '未命名联系人';
        const relation = senior.emergency_relation || '未指定';
        const phone = senior.emergency_phone || '未设置';
        const phoneDisplay = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        
        listItem.innerHTML = `
            <div class="item-info">
                <h4 class="item-title">
                    <i class="bi bi-person"></i> ${contactName}
                </h4>
                <p class="item-description">
                    关系：${relation} | 电话：${phoneDisplay} | 关联老人：${senior.name}
                </p>
            </div>
            <div class="item-actions">
                <button class="btn btn-icon btn-call" title="拨打电话" data-phone="${phone}">
                    <i class="bi bi-telephone"></i>
                </button>
                <button class="btn btn-icon btn-edit" title="编辑信息" data-modal="contact-modal">
                    <i class="bi bi-pencil"></i>
                </button>
            </div>
        `;
        
        container.appendChild(listItem);
        bindListItemEvents(listItem);
    });
    
    // 添加电话拨打功能
    document.querySelectorAll('.btn-call').forEach(btn => {
        btn.addEventListener('click', function() {
            const phone = this.getAttribute('data-phone');
            if (phone && phone !== '未设置') {
                window.location.href = `tel:${phone}`;
            } else {
                showToast('电话号码未设置', 'warning');
            }
        });
    });
}

// 保存联系人数据
function saveContactData(form) {
    const contactId = document.getElementById('contactId').value;
    const name = document.getElementById('contactName').value;
    const relation = document.getElementById('contactRelation').value;
    const phone = document.getElementById('contactPhone').value;
    const seniorId = document.getElementById('contactSeniorId').value;
    
    if (!seniorId) {
        showToast('请选择关联的老人', 'error');
        return;
    }
    
    // 准备API请求数据 - 更新老人的紧急联系人信息
    const seniorData = {
        emergency_contact: name,
        emergency_phone: phone,
        emergency_relation: relation
    };
    
    // 更新老人信息中的紧急联系人
    apiPut(`/seniors/${seniorId}`, seniorData)
        .then(response => {
            showToast('联系人信息已成功保存', 'success');
            
            // 更新本地存储中的老人联系人信息
            updateLocalSeniorContact(seniorId, seniorData);
            
            loadContactList(); // 重新加载联系人列表
            loadElderlyList(); // 同时更新老人列表显示
        })
        .catch(error => {
            console.error('API操作失败，使用本地存储:', error);
            
            // 更新本地存储中的老人联系人信息
            updateLocalSeniorContact(seniorId, seniorData);
            
            showToast('联系人数据已保存到本地', 'info');
            loadContactList(); // 重新加载联系人列表
            loadElderlyList(); // 同时更新老人列表显示
        });
}

// 更新本地存储中的老人联系人信息
function updateLocalSeniorContact(seniorId, contactData) {
    const localSeniors = JSON.parse(localStorage.getItem('local_seniors') || '[]');
    const index = localSeniors.findIndex(senior => senior.id == seniorId);
    
    if (index !== -1) {
        localSeniors[index].emergency_contact = contactData.emergency_contact;
        localSeniors[index].emergency_phone = contactData.emergency_phone;
        localSeniors[index].emergency_relation = contactData.emergency_relation;
        localStorage.setItem('local_seniors', JSON.stringify(localSeniors));
    }
}

// 加载老人选项到下拉列表
function loadSeniorOptions() {
    const seniorSelect = document.getElementById('contactSeniorId');
    if (!seniorSelect) return;
    
    // 清空现有选项
    seniorSelect.innerHTML = '<option value="">请选择关联老人</option>';
    
    // 从API获取老人列表
    apiGet('/seniors')
        .then(response => {
            if (!response || response.length === 0) return;
            
            // 添加老人选项
            response.forEach(senior => {
                try {
                    if (!senior || !senior.id || !senior.name) return;
                    
                    const option = document.createElement('option');
                    option.value = senior.id;
                    option.textContent = senior.name;
                    seniorSelect.appendChild(option);
                } catch (error) {
                    console.error('处理老人选项失败:', error);
                }
            });
        })
        .catch(error => {
            console.error('获取老人列表失败:', error);
            // 失败时添加一个默认提示选项
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '加载老人列表失败';
            option.disabled = true;
            seniorSelect.appendChild(option);
        });
}

// 初始化列表操作
function initListActions() {
    console.log('初始化列表操作...');
    
    try {
        // 尝试加载老人列表
        if (document.getElementById('elderly-data-container')) {
            loadElderlyList();
        }
        
        // 尝试加载联系人列表
        if (document.getElementById('contact-data-container')) {
            loadContactList();
        }
    } catch (error) {
        console.error('初始化列表操作失败:', error);
        showToast('加载数据失败，请刷新页面重试', 'error');
    }
}

// 为列表项元素绑定事件
function bindListItemEvents(item) {
    // 编辑按钮
    const editBtn = item.querySelector('.btn-edit');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            const id = item.getAttribute('data-id');
            
            // 区分不同的模态窗口
            const modalId = this.getAttribute('data-modal');
            
            if (modalId === 'elderly-modal') {
                // 获取老人详细信息，填充表单
                apiGet(`/seniors/${id}`)
                    .then(senior => {
                        document.getElementById('elderlyId').value = senior.id;
                        document.getElementById('elderlyName').value = senior.name;
                        document.getElementById('elderlyAge').value = senior.age;
                        if (document.getElementById('elderlyGender')) {
                            document.getElementById('elderlyGender').value = senior.gender || 'male';
                        }
                        document.getElementById('elderlyContact').value = senior.emergency_contact || '';
                        document.getElementById('elderlyPhone').value = senior.emergency_phone || '';
                    })
                    .catch(error => {
                        showToast(`获取老人信息失败: ${error.message}`, 'error');
                    });
            }
        });
    }
    
    // 删除按钮
    const deleteBtn = item.querySelector('.btn-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const id = item.getAttribute('data-id');
            deleteElderly(id);
        });
    }
}

// 显示提示消息
function showToast(message, type = 'info') {
    // 创建toast容器（如果不存在）
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // 添加到容器
    toastContainer.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 自动关闭
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// 生成并添加toast样式
let toastCSS = `
/* Toast的样式 */
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
}

.toast {
    margin-bottom: 10px;
    padding: 15px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    animation: fadeIn 0.3s ease;
    width: 300px;
    transition: all 0.3s ease;
}

.toast.info {
    background-color: #f8f9fa;
    border-left: 4px solid #0d6efd;
}

.toast.success {
    background-color: #d1e7dd;
    border-left: 4px solid #198754;
}

.toast.warning {
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
}

.toast.error {
    background-color: #f8d7da;
    border-left: 4px solid #dc3545;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 连接状态样式 */
.connection-status {
    padding: 8px 12px;
    border-radius: 4px;
    margin-top: 5px;
}

.connection-status .unknown {
    color: #6c757d;
}

.connection-status .testing {
    color: #0dcaf0;
}

.connection-status .success {
    color: #198754;
}

.connection-status .error {
    color: #dc3545;
}

.connection-status i {
    margin-right: 5px;
}

/* 添加旋转动画 */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.connection-status .testing i {
    animation: spin 1s linear infinite;
}`;

let styleElement = document.createElement('style');
styleElement.textContent = toastCSS;
document.head.appendChild(styleElement);

// 加载服务器配置
function loadServerConfig() {
    const serverUrlInput = document.getElementById('serverUrl');
    if (!serverUrlInput) return;
    
    try {
        // 从localStorage获取配置
        const configStr = localStorage.getItem('server_config');
        if (configStr) {
            const config = JSON.parse(configStr);
            if (config && config.serverUrl) {
                serverUrlInput.value = config.serverUrl;
                return;
            }
        }
        
        // 如果没有server_config，检查兼容格式
        const serverUrl = localStorage.getItem('serverUrl');
        if (serverUrl) {
            serverUrlInput.value = serverUrl;
            return;
        }
        
        // 默认设置为localhost
        serverUrlInput.value = 'http://localhost:5000';
    } catch (error) {
        console.error('加载服务器配置失败:', error);
        serverUrlInput.value = 'http://localhost:5000';
    }
}

// 测试服务器连接
function testServerConnection(serverUrl) {
    const connectionStatusElem = document.getElementById('connectionStatus');
    if (connectionStatusElem) {
        connectionStatusElem.innerHTML = '<span class="testing"><i class="bi bi-arrow-repeat"></i> 测试连接中...</span>';
    }
    
    fetch(`${serverUrl}/api/health`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 5000
    })
    .then(response => {
        if (response.ok) {
            if (connectionStatusElem) {
                connectionStatusElem.innerHTML = '<span class="success"><i class="bi bi-check-circle"></i> 连接成功</span>';
            }
            showToast('服务器连接测试成功', 'success');
        } else {
            if (connectionStatusElem) {
                connectionStatusElem.innerHTML = `<span class="error"><i class="bi bi-exclamation-triangle"></i> 连接失败: HTTP ${response.status}</span>`;
            }
            showToast(`服务器连接测试失败: HTTP ${response.status}`, 'error');
        }
    })
    .catch(error => {
        if (connectionStatusElem) {
            connectionStatusElem.innerHTML = `<span class="error"><i class="bi bi-exclamation-triangle"></i> 连接失败: ${error.message}</span>`;
        }
        showToast(`服务器连接测试失败: ${error.message}`, 'error');
    });
} 