// app.js
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function formatFuncCell(funcStr) {
    if (!funcStr) return '<span class="func-cell">-</span>';
    return `<span class="func-cell">${escapeHtml(funcStr)}</span>`;
}

function formatDateCell(dateStr) {
    if (!dateStr) return '-';
    return `<span class="date-cell">${escapeHtml(dateStr)}</span>`;
}

$(document).ready(function() {
    $('#functionTable').DataTable({
        ajax: {
            url: '/data/loadfuncton.json',   // 修正为实际文件名
            dataSrc: '',
            error: function(xhr, error, thrown) {
                console.error('JSON 加载失败:', error);
                $('#functionTable').html('<tbody><tr><td colspan="4">无法加载数据文件，请确认路径 data/loadfuncton.json 是否正确，且通过 HTTP 服务器访问。</td></tr></tbody>');
            }
        },
        columns: [
            { data: '主键' },
            { 
                data: '函数',
                render: function(data, type) {
                    return type === 'display' ? formatFuncCell(data) : data;
                }
            },
            { data: '用法' },
            {
                data: '日期',
                render: function(data, type) {
                    return type === 'display' ? formatDateCell(data) : data;
                }
            }
        ],
        language: {
            search: "🔍 搜索:",
            lengthMenu: "显示 _MENU_ 条",
            info: "第 _START_ 至 _END_ 条，共 _TOTAL_ 条",
            paginate: {
                first: "首页",
                last: "尾页",
                next: "下一页",
                previous: "上一页"
            },
            emptyTable: "暂无数据",
            infoEmpty: "没有符合条件的记录"
        },
        pageLength: 15,
        lengthMenu: [[10, 15, 25, 50, -1], [10, 15, 25, 50, "全部"]],
        order: [[0, 'asc']],
        autoWidth: false
    });
});