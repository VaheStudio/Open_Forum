// 论坛功能 - 优化版
document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('forum.html')) return;
    
    // 检查登录状态
    const currentUser = getCurrentUser();
    if (!currentUser) {
        redirectToLogin();
        return;
    }
    
    // 显示用户名
    document.querySelector('.logo h1').textContent = `欢迎, ${currentUser.username}`;
    
    // 初始化页面
    loadPosts();
    
    // 文件上传处理
    const fileUpload = document.getElementById('fileUpload');
    const fileInfo = document.getElementById('fileInfo');
    let selectedFiles = [];
    
    fileUpload.addEventListener('change', function(e) {
        selectedFiles = Array.from(e.target.files);
        
        // 检查文件大小
        const tooLargeFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
        if (tooLargeFiles.length > 0) {
            showNotification(`有${tooLargeFiles.length}个文件超过10MB限制`, 'error');
            selectedFiles = selectedFiles.filter(file => file.size <= 10 * 1024 * 1024);
            fileUpload.value = '';
        }
        
        // 检查用户剩余空间
        const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
        if (currentUser.storageUsed + totalSize > 40 * 1024 * 1024) {
            showNotification('上传这些文件将超出您的存储空间限制', 'error');
            selectedFiles = [];
            fileUpload.value = '';
            return;
        }
        
        if (selectedFiles.length > 0) {
            fileInfo.textContent = `已选择 ${selectedFiles.length} 个文件 (${formatFileSize(totalSize)})`;
        } else {
            fileInfo.textContent = '';
        }
    });
    
    // 发布帖子
    const postForm = document.getElementById('postForm');
    postForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const content = document.getElementById('postContent').value.trim();
        
        if (!content && selectedFiles.length === 0) {
            showNotification('内容或文件不能为空', 'error');
            return;
        }
        
        // 创建加载动画
        const submitBtn = postForm.querySelector('.btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发布中...';
        
        // 模拟网络延迟，增强用户体验
        setTimeout(() => {
            // 创建新帖子
            const newPost = {
                id: Date.now().toString(),
                username: currentUser.username,
                content,
                timestamp: new Date().toISOString(),
                files: [],
                images: []
            };
            
            // 处理文件上传
            if (selectedFiles.length > 0) {
                const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
                
                // 更新用户存储使用情况
                const users = getAllUsers();
                const userIndex = users.findIndex(u => u.username === currentUser.username);
                
                if (userIndex !== -1) {
                    users[userIndex].storageUsed += totalSize;
                    localStorage.setItem('users', JSON.stringify(users));
                    
                    // 更新当前用户信息
                    currentUser.storageUsed += totalSize;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                }
                
                // 添加到帖子
                selectedFiles.forEach(file => {
                    const isImage = file.type.startsWith('image/');
                    const fileObj = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        uploadDate: new Date().toISOString(),
                        url: URL.createObjectURL(file)
                    };
                    
                    if (isImage) {
                        newPost.images.push(fileObj);
                    } else {
                        newPost.files.push(fileObj);
                    }
                    
                    // 添加到用户文件列表
                    if (userIndex !== -1) {
                        users[userIndex].files.push({
                            ...fileObj,
                            postId: newPost.id
                        });
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                });
            }
            
            // 保存帖子
            const posts = getAllPosts();
            posts.unshift(newPost);
            saveAllPosts(posts);
            
            // 添加到用户帖子列表
            const users = getAllUsers();
            const userIndex = users.findIndex(u => u.username === currentUser.username);
            if (userIndex !== -1) {
                users[userIndex].posts.push(newPost.id);
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            // 重置表单
            postForm.reset();
            selectedFiles = [];
            fileUpload.value = '';
            fileInfo.textContent = '';
            
            // 恢复按钮状态
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
            showNotification('帖子发布成功', 'success');
            loadPosts();
        }, 800); // 模拟网络请求延迟
    });
    
    // 加载帖子
    function loadPosts() {
        const postsContainer = document.getElementById('postsContainer');
        const posts = getAllPosts();
        
        // 显示加载状态
        postsContainer.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:10px;">加载中...</p></div>';
        
        // 模拟加载延迟
        setTimeout(() => {
            if (posts.length === 0) {
                postsContainer.innerHTML = '<p class="no-posts">还没有帖子，快来发布第一条吧！</p>';
                return;
            }
            
            postsContainer.innerHTML = '';
            
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';
                
                // 帖子头部
                const postHeader = document.createElement('div');
                postHeader.className = 'post-header';
                
                const postAvatar = document.createElement('div');
                postAvatar.className = 'post-avatar';
                postAvatar.innerHTML = '<img src="images/default-avatar.png" alt="用户头像">';
                
                const postUser = document.createElement('span');
                postUser.className = 'post-user';
                postUser.textContent = post.username;
                
                const postTime = document.createElement('span');
                postTime.className = 'post-time';
                postTime.textContent = formatDate(post.timestamp);
                
                postHeader.appendChild(postAvatar);
                postHeader.appendChild(postUser);
                postHeader.appendChild(postTime);
                
                // 帖子内容
                const postContent = document.createElement('div');
                postContent.className = 'post-content';
                postContent.textContent = post.content;
                
                postElement.appendChild(postHeader);
                postElement.appendChild(postContent);
                
                // 图片展示
                if (post.images.length > 0) {
                    const postImages = document.createElement('div');
                    postImages.className = 'post-images';
                    
                    post.images.forEach(image => {
                        const img = document.createElement('img');
                        img.className = 'post-image';
                        img.src = image.url;
                        img.alt = image.name;
                        img.loading = "lazy"; // 延迟加载图片
                        postImages.appendChild(img);
                    });
                    
                    postElement.appendChild(postImages);
                }
                
                // 文件列表
                if (post.files.length > 0) {
                    const postFiles = document.createElement('div');
                    postFiles.className = 'post-files';
                    
                    post.files.forEach(file => {
                        const fileItem = document.createElement('div');
                        fileItem.className = 'file-item';
                        
                        const fileIcon = document.createElement('i');
                        fileIcon.className = `file-icon fas ${getFileIcon(file.name)}`;
                        
                        const fileName = document.createElement('span');
                        fileName.className = 'file-name';
                        fileName.textContent = file.name;
                        
                        const fileSize = document.createElement('span');
                        fileSize.className = 'file-size';
                        fileSize.textContent = formatFileSize(file.size);
                        
                        const fileDownload = document.createElement('a');
                        fileDownload.className = 'file-download';
                        fileDownload.href = file.url;
                        fileDownload.download = file.name;
                        fileDownload.innerHTML = '<i class="fas fa-download"></i>';
                        
                        fileItem.appendChild(fileIcon);
                        fileItem.appendChild(fileName);
                        fileItem.appendChild(fileSize);
                        fileItem.appendChild(fileDownload);
                        postFiles.appendChild(fileItem);
                    });
                    
                    postElement.appendChild(postFiles);
                }
                
                // 帖子操作
                const postActions = document.createElement('div');
                postActions.className = 'post-actions';
                
                // 添加点赞功能
                const likeBtn = document.createElement('button');
                likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> 点赞';
                likeBtn.addEventListener('click', () => {
                    likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> 已点赞';
                    likeBtn.style.color = 'var(--primary)';
                    showNotification('点赞成功', 'success');
                });
                
                postActions.appendChild(likeBtn);
                
                // 如果是当前用户的帖子，显示删除按钮
                if (post.username === currentUser.username) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 删除';
                    deleteBtn.addEventListener('click', () => deletePost(post.id));
                    postActions.appendChild(deleteBtn);
                }
                
                postElement.appendChild(postActions);
                postsContainer.appendChild(postElement);
            });
        }, 600); // 模拟加载延迟
    }
    
    // 删除帖子
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
            loadPosts();
        }
    }
});