/**
 * 密码验证函数
 * @param {string} correctPwd - 正确密码
 * @param {string} verifyId - 验证容器ID
 * @param {string} contentId - 内容容器ID
 * @param {string} msgId - 消息提示ID
 */
function checkPassword(correctPwd, verifyId, contentId, msgId) {
    const pwdInput = document.getElementById('pwd');
    const content = document.getElementById(contentId);
    const verify = document.getElementById(verifyId);
    const msg = document.getElementById(msgId);
    
    if (pwdInput.value === correctPwd) {
        content.classList.add('show');
        verify.style.display = 'none';
        msg.textContent = '';
    } else {
        msg.textContent = '密码错误，请重试！';
    }
}

// 回车键支持
document.addEventListener('DOMContentLoaded', function() {
    const pwdInput = document.getElementById('pwd');
    if (pwdInput) {
        pwdInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                // 触发验证按钮点击
                const btn = document.querySelector('#password-verify button');
                if (btn) btn.click();
            }
        });
    }
});