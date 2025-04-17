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

// 初始化模态窗口
function initModals() {
    // 打开模态窗口的按钮
    const modalTriggers = document.querySelectorAll('[data-modal]');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                openModal(modal);
                
                // 如果是编辑按钮，填充数据
                if (this.classList.contains('btn-edit')) {
                    const listItem = this.closest('.list-item');
                    if (listItem) {
                        populateModalForm(modal, listItem);
                    }
                }
            }
        });
    });
    
    // 关闭模态窗口的按钮
    const closeBtns = document.querySelectorAll('.close-btn, .modal-footer .btn-danger');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal);
            }
        });
    });
    
    // 模态窗口提交按钮
    const submitBtns = document.querySelectorAll('.modal-footer .btn-primary');
    submitBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            const form = modal.querySelector('form');
            
            if (form && form.checkValidity()) {
                // 模拟表单提交
                const formId = form.id;
                
                if (formId === 'elderlyForm') {
                    saveElderlyData(form);
                } else if (formId === 'contactForm') {
                    saveContactData(form);
                }
                
                closeModal(modal);
            } else {
                // 触发浏览器原生表单验证
                form.reportValidity();
            }
        });
    });
    
    // 点击模态窗口外部关闭
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
}

// 打开模态窗口
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
    
    // 重置表单
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
    
    // 更新标题
    const isEdit = document.activeElement && document.activeElement.classList.contains('btn-edit');
    const header = modal.querySelector('.modal-header h2');
    if (header) {
        const modalId = modal.id;
        if (modalId === 'elderly-modal') {
            header.textContent = isEdit ? '编辑老人信息' : '添加老人';
        } else if (modalId === 'contact-modal') {
            header.textContent = isEdit ? '编辑联系人' : '添加联系人';
        }
    }
}

// 关闭模态窗口
function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
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
        apiPromise = apiPut(`/seniors/${elderlyId}`, seniorData)
            .then(response => {
                showToast('老人信息已成功更新', 'success');
                loadElderlyList(); // 重新加载老人列表
            });
    } else {
        // 添加新老人
        apiPromise = apiPost('/seniors', seniorData)
            .then(response => {
                showToast('新老人信息已成功添加', 'success');
                loadElderlyList(); // 重新加载老人列表
            });
    }
    
    apiPromise.catch(error => {
        showToast(`操作失败: ${error.message}`, 'error');
    });
}

// 加载老人列表
function loadElderlyList() {
    const container = document.getElementById('elderly-data-container');
    const loadingIndicator = document.querySelector('#elderly-list .loading-indicator');
    const emptyState = document.querySelector('#elderly-list .empty-state');
    
    if (!container) return;
    
    // 显示加载指示器
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
    container.innerHTML = '';
    
    // 从API获取老人列表
    apiGet('/seniors')
        .then(response => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            if (!response || response.length === 0) {
                // 显示空状态
                if (emptyState) emptyState.style.display = 'flex';
                return;
            }
            
            // 渲染老人列表
            response.forEach(senior => {
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                listItem.setAttribute('data-id', senior.id);
                
                const genderIcon = senior.gender === 'male' ? 'bi-gender-male' : 'bi-gender-female';
                const genderClass = senior.gender === 'male' ? 'male' : 'female';
                
                listItem.innerHTML = `
                    <div class="item-content">
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
        })
        .catch(error => {
            console.error('获取老人列表失败:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'flex';
                const emptyText = emptyState.querySelector('p');
                if (emptyText) emptyText.textContent = '获取数据失败，请刷新重试';
            }
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
            loadElderlyList(); // 重新加载老人列表
        })
        .catch(error => {
            showToast(`删除失败: ${error.message}`, 'error');
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
            loadContactList(); // 重新加载联系人列表
            loadElderlyList(); // 同时更新老人列表显示
        })
        .catch(error => {
            showToast(`保存失败: ${error.message}`, 'error');
        });
}

// 加载联系人列表（实际上是加载老人的紧急联系人信息）
function loadContactList() {
    const container = document.getElementById('contact-data-container');
    const loadingIndicator = document.querySelector('#contact-list .loading-indicator');
    const emptyState = document.querySelector('#contact-list .empty-state');
    
    if (!container) return;
    
    // 显示加载指示器
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
    container.innerHTML = '';
    
    // 同时加载老人下拉列表选项
    try {
        loadSeniorOptions();
    } catch (error) {
        console.error('加载老人选项失败:', error);
    }
    
    // 从API获取老人列表，筛选出有紧急联系人的老人
    apiGet('/seniors')
        .then(response => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            if (!response || response.length === 0) {
                // 显示空状态
                if (emptyState) emptyState.style.display = 'flex';
                return;
            }
            
            // 筛选出有紧急联系人信息的老人
            const seniorsWithContacts = response.filter(senior => 
                senior.emergency_contact && senior.emergency_phone);
            
            if (seniorsWithContacts.length === 0) {
                // 显示空状态
                if (emptyState) emptyState.style.display = 'flex';
                return;
            }
            
            // 渲染联系人列表
            seniorsWithContacts.forEach(senior => {
                if (!senior || !senior.emergency_contact) return;
                
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                listItem.setAttribute('data-id', senior.id);
                listItem.setAttribute('data-contact', senior.emergency_contact);
                listItem.setAttribute('data-phone', senior.emergency_phone);
                
                listItem.innerHTML = `
                    <div class="item-content">
                        <h4 class="item-title">
                            <i class="bi bi-person-fill"></i> ${senior.emergency_contact}
                        </h4>
                        <p class="item-description">
                            电话：${senior.emergency_phone} | 关联老人：${senior.name}
                        </p>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-icon btn-edit" title="编辑联系人" data-modal="contact-modal" data-senior-id="${senior.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-icon btn-call" title="拨打电话">
                            <i class="bi bi-telephone"></i>
                        </button>
                    </div>
                `;
                
                container.appendChild(listItem);
                
                // 绑定按钮事件
                const editBtn = listItem.querySelector('.btn-edit');
                if (editBtn) {
                    editBtn.addEventListener('click', function() {
                        // 填充表单数据
                        document.getElementById('contactId').value = 'edit'; // 标记为编辑模式
                        document.getElementById('contactName').value = senior.emergency_contact;
                        document.getElementById('contactPhone').value = senior.emergency_phone;
                        document.getElementById('contactRelation').value = senior.emergency_relation || '';
                        document.getElementById('contactSeniorId').value = senior.id;
                    });
                }
                
                const callBtn = listItem.querySelector('.btn-call');
                if (callBtn) {
                    callBtn.addEventListener('click', function() {
                        // 模拟拨打电话
                        showToast(`正在拨打电话: ${senior.emergency_phone}`, 'info');
                    });
                }
            });
        })
        .catch(error => {
            console.error('获取联系人列表失败:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'flex';
                const emptyText = emptyState.querySelector('p');
                if (emptyText) emptyText.textContent = '获取数据失败，请刷新重试';
            }
        });
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

// 添加CSS样式
const toastCSS = `
.toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
}

.toast {
    padding: 12px 20px;
    margin-top: 10px;
    border-radius: 4px;
    color: white;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    font-weight: 500;
}

.toast.show {
    transform: translateY(0);
    opacity: 1;
}

.toast.success {
    background-color: var(--success-color);
}

.toast.error {
    background-color: var(--danger-color);
}

.toast.warning {
    background-color: var(--warning-color);
    color: #333;
}

.toast.info {
    background-color: var(--primary-color);
}

.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(3px);
}

.modal.active {
    display: flex;
    justify-content: center;
    align-items: center;
    animation: modalBackdropFadeIn 0.3s;
}

@keyframes modalBackdropFadeIn {
    from {
        background-color: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0);
    }
    to {
        background-color: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(3px);
    }
}

.modal-content {
    background-color: white;
    width: 100%;
    max-width: 500px;
    border-radius: 8px;
    box-shadow: 0 5px 25px rgba(0, 0, 0, 0.25);
    animation: modalFadeIn 0.3s;
    overflow: hidden;
}

@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: translateY(-50px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal-header {
    padding: 20px 25px;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.4rem;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.8rem;
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
}

.close-btn:hover {
    background-color: rgba(0, 0, 0, 0.1);
    color: #333;
}

.modal-body {
    padding: 25px;
}

.modal-footer {
    padding: 15px 25px;
    border-top: 1px solid #e8e8e8;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
`;

// 添加样式到页面
const styleElement = document.createElement('style');
styleElement.textContent = toastCSS;
document.head.appendChild(styleElement); 