// 个人中心功能

document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('profile.html')) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        redirectToLogin();
        return;
    }
    
    // 显示用户信息
    document.getElementById('usernameDisplay').textContent = currentUser.username;
    document.getElementById('usedStorage').textContent = formatFileSize(currentUser.storageUsed);
    document.getElementById('storageProgress').style.width = `${Math.min(100, (currentUser.storageUsed / (40 * 1024 * 1024)) * 100)}%`;
    
    // 导航切换
    const navLinks = document.querySelectorAll('.profile-nav a');
    const sections = document.querySelectorAll('.profile-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            
            // 更新活动导航
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应部分
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });
            
            // 加载对应内容
            if (sectionId === 'my-posts') {
                loadUserPosts();
            } else if (sectionId === 'my-files') {
                loadUserFiles();
            }
        });
    });
    
    // 加载用户帖子
    function loadUserPosts() {
        const userPostsContainer = document.getElementById('userPostsContainer');
        const allPosts = getAllPosts();
        const userPosts = allPosts.filter(post => post.username === currentUser.username);
        
        if (userPosts.length === 0) {
            userPostsContainer.innerHTML = '<p class="no-posts">您还没有发布过帖子</p>';
            return;
        }
        
        userPostsContainer.innerHTML = '';
        
        userPosts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'user-post';
            
            const postContent = document.createElement('div');
            postContent.className = 'post-content';
            postContent.textContent = post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content;
            
            const postMeta = document.createElement('div');
            postMeta.className = 'post-meta';
            postMeta.innerHTML = `
                <span class="post-time">${formatDate(post.timestamp)}</span>
                <span class="post-files">${post.files.length + post.images.length} 个附件</span>
                <button class="btn btn-small delete-post" data-id="${post.id}">删除</button>
            `;
            
            postElement.appendChild(postContent);
            postElement.appendChild(postMeta);
            userPostsContainer.appendChild(postElement);
        });
        
        // 添加删除事件
        document.querySelectorAll('.delete-post').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.getAttribute('data-id');
                deletePost(postId);
            });
        });
    }
    
    // 加载用户文件
    function loadUserFiles() {
        const fileListContainer = document.getElementById('fileListContainer');
        const files = currentUser.files || [];
        
        if (files.length === 0) {
            fileListContainer.innerHTML = '<p class="no-files">您还没有上传过文件</p>';
            return;
        }
        
        fileListContainer.innerHTML = '';
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <i class="file-icon fas ${getFileIcon(file.name)}"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-details">
                        <span class="file-size">${formatFileSize(file.size)}</span>
                        <span class="file-date">${formatDate(file.uploadDate)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <a href="${file.url}" download="${file.name}" class="btn btn-small"><i class="fas fa-download"></i></a>
                    <button class="btn btn-small btn-danger delete-file" data-name="${file.name}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            fileListContainer.appendChild(fileItem);
        });
        
        // 添加删除事件
        document.querySelectorAll('.delete-file').forEach(btn => {
            btn.addEventListener('click', function() {
                const fileName = this.getAttribute('data-name');
                deleteFile(fileName);
            });
        });
    }
    
    // 删除文件
    function deleteFile(fileName) {
        if (!confirm('确定要删除这个文件吗？')) return;
        
        const users = getAllUsers();
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        
        if (userIndex !== -1) {
            const fileIndex = users[userIndex].files.findIndex(f => f.name === fileName);
            if (fileIndex !== -1) {
                const fileSize = users[userIndex].files[fileIndex].size;
                
                // 更新存储使用情况
                users[userIndex].storageUsed = Math.max(0, users[userIndex].storageUsed - fileSize);
                users[userIndex].files.splice(fileIndex, 1);
                localStorage.setItem('users', JSON.stringify(users));
                
                // 更新当前用户信息
                currentUser.storageUsed = Math.max(0, currentUser.storageUsed - fileSize);
                currentUser.files = currentUser.files.filter(f => f.name !== fileName);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // 更新UI
                document.getElementById('usedStorage').textContent = formatFileSize(currentUser.storageUsed);
                document.getElementById('storageProgress').style.width = `${Math.min(100, (currentUser.storageUsed / (40 * 1024 * 1024)) * 100)}%`;
                
                showNotification('文件已删除', 'success');
                loadUserFiles();
            }
        }
    }
    
    // 删除帖子 (与forum.js中的类似，但针对个人中心)
    function deletePost(postId) {
        if (!confirm('确定要删除这个帖子吗？')) return;
        
        const posts = getAllPosts();
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex !== -1) {
            const post = posts[postIndex];
            
            // 更新用户存储使用情况
            const totalSize = [...post.files, ...post.images].reduce((sum, file) => sum + file.size, 0);
            const users = getAllUsers();
            const userIndex = users.findIndex(u => u.username === currentUser.username);
            
            if (userIndex !== -1) {
                users[userIndex].storageUsed = Math.max(0, users[userIndex].storageUsed - totalSize);
                users[userIndex].posts = users[userIndex].posts.filter(id => id !== postId);
                users[userIndex].files = users[userIndex].files.filter(file => file.postId !== postId);
                localStorage.setItem('users', JSON.stringify(users));
                
                // 更新当前用户信息
                currentUser.storageUsed = Math.max(0, currentUser.storageUsed - totalSize);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
            
            // 从帖子列表中删除
            posts.splice(postIndex, 1);
            saveAllPosts(posts);
            
            showNotification('帖子已删除', 'success');
            loadUserPosts();
        }
    }
    
    // 文件上传处理
    const profileFileUpload = document.getElementById('profileFileUpload');
    if (profileFileUpload) {
        profileFileUpload.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            
            // 检查文件大小
            const tooLargeFiles = files.filter(file => file.size > 10 * 1024 * 1024);
            if (tooLargeFiles.length > 0) {
                showNotification(`有${tooLargeFiles.length}个文件超过10MB限制`, 'error');
                files = files.filter(file => file.size <= 10 * 1024 * 1024);
                profileFileUpload.value = '';
                return;
            }
            
            // 检查用户剩余空间
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            if (currentUser.storageUsed + totalSize > 40 * 1024 * 1024) {
                showNotification('上传这些文件将超出您的存储空间限制', 'error');
                profileFileUpload.value = '';
                return;
            }
            
            // 上传文件
            if (files.length > 0) {
                uploadFiles(files);
            }
        });
    }
    
    // 上传文件
    function uploadFiles(files) {
        const users = getAllUsers();
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        
        if (userIndex !== -1) {
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            
            files.forEach(file => {
                const fileObj = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadDate: new Date().toISOString(),
                    url: URL.createObjectURL(file) // 在实际应用中，这里应该是服务器上的文件路径
                };
                
                users[userIndex].files.push(fileObj);
                users[userIndex].storageUsed += file.size;
            });
            
            localStorage.setItem('users', JSON.stringify(users));
            
            // 更新当前用户信息
            currentUser.files = users[userIndex].files;
            currentUser.storageUsed = users[userIndex].storageUsed;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // 更新UI
            document.getElementById('usedStorage').textContent = formatFileSize(currentUser.storageUsed);
            document.getElementById('storageProgress').style.width = `${Math.min(100, (currentUser.storageUsed / (40 * 1024 * 1024)) * 100)}%`;
            
            showNotification(`成功上传 ${files.length} 个文件`, 'success');
            profileFileUpload.value = '';
            loadUserFiles();
        }
    }
    
    // 初始加载我的帖子
    loadUserPosts();
});