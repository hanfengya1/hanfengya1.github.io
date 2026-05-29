(function() {
    // ----------------------------- 1. 血缘解析模块 -----------------------------
    const API_BASE = 'http://10.246.129.82:9090';
    const lineageSqlInput = document.getElementById('lineageSqlInput');
    const lineageParseBtn = document.getElementById('lineageParseBtn');
    const lineageClearBtn = document.getElementById('lineageClearBtn');
    const lineageResultContent = document.getElementById('lineageResultContent');
    const lineageStatsDiv = document.getElementById('lineageStats');
    const upstreamCountSpan = document.getElementById('upstreamCount');

    // 提供示例 SQL
    const defaultLineageSQL = `-- 示例: 查询订单宽表依赖
SELECT 
    o.order_id,
    o.order_amount,
    u.user_name,
    p.product_name
FROM ods.order_info o
LEFT JOIN dim.user_info u ON o.user_id = u.id
LEFT JOIN dim.product_dim p ON o.product_id = p.id
WHERE o.dt = '20250301'`;
    
    if (!lineageSqlInput.value.trim()) {
        lineageSqlInput.value = defaultLineageSQL;
    }

    async function parseSQL() {
        const sql = lineageSqlInput.value.trim();
        if (!sql) {
            showLineageError('请输入 SQL 语句');
            return;
        }
        showLineageLoading();
        try {
            const response = await fetch(`${API_BASE}/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql: sql })
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            displayLineageResult(result);
        } catch (error) {
            console.error('血缘解析失败:', error);
            let errorMsg = `解析失败: ${error.message}<br><br>`;
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMsg += `⚠️ 无法连接后端服务: ${API_BASE}<br>请确保后端血缘服务已启动并允许跨域。`;
            } else {
                errorMsg += `请检查后端接口是否正常。`;
            }
            showLineageError(errorMsg);
        }
    }

    function showLineageLoading() {
        lineageStatsDiv.style.display = 'none';
        lineageResultContent.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p style="margin-top: 16px; color: #4a5568;">正在解析血缘关系，请稍后...</p>
            </div>
        `;
    }

    function displayLineageResult(result) {
        if (!result.success) {
            showLineageError(result.message || '解析失败，后端返回错误');
            return;
        }
        const upstreamTables = result.upstreamTables || [];
        upstreamCountSpan.textContent = upstreamTables.length;
        lineageStatsDiv.style.display = 'flex';

        let html = '';
        if (result.message) {
            html += `<div class="success-message">✅ ${escapeHtml(result.message)}</div>`;
        }
        html += `<div class="tables-container">
                    <div class="table-box">
                        <div class="table-title">⬆️ 上游依赖表 (${upstreamTables.length})</div>
                        <div class="table-list">`;
        if (upstreamTables.length === 0) {
            html += `<div class="empty-state" style="padding: 30px;">未检测到上游依赖表，可能 SQL 未引用任何表</div>`;
        } else {
            upstreamTables.forEach(table => {
                html += `<div class="table-item">📁 ${escapeHtml(table)}</div>`;
            });
        }
        html += `</div></div></div>`;
        lineageResultContent.innerHTML = html;
    }

    function showLineageError(message) {
        lineageStatsDiv.style.display = 'none';
        lineageResultContent.innerHTML = `<div class="error-message">❌ ${message}</div>`;
    }

    function clearLineage() {
        lineageSqlInput.value = '';
        lineageResultContent.innerHTML = `<div class="empty-state">⚡ 点击“解析血缘关系”按钮开始分析</div>`;
        lineageStatsDiv.style.display = 'none';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    lineageParseBtn.addEventListener('click', parseSQL);
    lineageClearBtn.addEventListener('click', clearLineage);
    lineageSqlInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            parseSQL();
        }
    });

    // ----------------------------- 2. 建表转换模块 -----------------------------
    const convertInput = document.getElementById('convertInputSql');
    const convertOutput = document.getElementById('convertOutputSql');
    const convertClearBtn = document.getElementById('convertClearBtn');
    const convertCopyBtn = document.getElementById('convertCopyBtn');

    const exampleHiveSql = `CREATE TABLE IF NOT EXISTS \`stg_dev\`.\`stg_order_change\` (
\`id\` DECIMAL(38,0) COMMENT '唯一标识',
\`create_time\` TIMESTAMP COMMENT '创建时间',
\`create_by_ad\` VARCHAR(50) COMMENT '记录创建人ad',
\`create_by_name\` VARCHAR(100) COMMENT '记录创建人姓名',
\`edit_time\` TIMESTAMP COMMENT '修改时间',
\`delete_flag\` SMALLINT COMMENT '删除标志位 0 否 1-是',
\`order_main_no\` VARCHAR(45) COMMENT '关联订单编号',
\`order_change_no\` VARCHAR(45) COMMENT '变更单号',
\`change_ver\` INT COMMENT '变更版本号，从V0开始编码',
\`change_type\` INT COMMENT '变更类型',
\`change_desc\` VARCHAR(500) COMMENT '变更说明',
\`change_status\` INT COMMENT '变更单状态 0-草稿 1.已作废2.已输入3.审批中4.已审批',
\`bpm_task_id\` VARCHAR(100) COMMENT '新工作流任务ID',
\`bpm_task_status\` INT COMMENT '新工作流任务状态',
\`bpm_pass_date\` TIMESTAMP COMMENT '审核通过时间',
\`file_recycle_status\` INT COMMENT '合同/文件回收状态',
\`sign_type\` INT COMMENT '签署方式 1.线下2.线上',
\`is_manuscript\` SMALLINT COMMENT '是否生成底稿0否,1是',
\`bar_code\` VARCHAR(50) COMMENT '文件回收编码',
\`sour_type\` SMALLINT COMMENT '来源类型:1.手动变更 2.检修结果自动变更',
\`create_timestamp\` BIGINT COMMENT '创建时间戳',
\`edit_timestamp\` BIGINT COMMENT '修改时间戳',
\`bpm_pass_date_timestamp\` BIGINT COMMENT '审核通过时间'
) COMMENT '订单变更单信息表'
STORED AS ORC`;

    if (!convertInput.value.trim()) {
        convertInput.value = exampleHiveSql;
    }

    function convertHiveTable(sql) {
        if (!sql || sql.trim() === '') return '';
        let originalSql = sql.trim();
        let fieldStart = -1, fieldEnd = -1;
        for (let i = 0; i < originalSql.length; i++) {
            if (originalSql[i] === '(') {
                fieldStart = i;
                break;
            }
        }
        if (fieldStart === -1) return originalSql;
        let bracketCount = 1;
        for (let i = fieldStart + 1; i < originalSql.length; i++) {
            if (originalSql[i] === '(') bracketCount++;
            else if (originalSql[i] === ')') {
                bracketCount--;
                if (bracketCount === 0) {
                    fieldEnd = i;
                    break;
                }
            }
        }
        if (fieldEnd === -1) return originalSql;
        const createPartRaw = originalSql.substring(0, fieldStart).trim();
        const fieldsRaw = originalSql.substring(fieldStart + 1, fieldEnd);
        let remaining = originalSql.substring(fieldEnd + 1).trim();
        let createPart = createPartRaw;
        const createRegex = /^CREATE\s+(?:EXTERNAL\s+)?TABLE/i;
        if (createRegex.test(createPart)) {
            createPart = createPart.replace(/^CREATE\s+(?:EXTERNAL\s+)?TABLE/i, 'CREATE EXTERNAL TABLE');
        } else {
            createPart = 'CREATE EXTERNAL TABLE ' + createPart.replace(/^CREATE\s+TABLE/i, '').trim();
        }
        function parseFields(content) {
            let fields = [];
            let current = '';
            let depth = 0;
            let inSingleQuote = false;
            let inDoubleQuote = false;
            for (let i = 0; i < content.length; i++) {
                const ch = content[i];
                if (!inSingleQuote && !inDoubleQuote) {
                    if (ch === '(') depth++;
                    else if (ch === ')') depth--;
                    else if (ch === ',' && depth === 0) {
                        if (current.trim()) fields.push(current.trim());
                        current = '';
                        continue;
                    } else if (ch === "'") inSingleQuote = true;
                    else if (ch === '"') inDoubleQuote = true;
                } else {
                    if (inSingleQuote && ch === "'") inSingleQuote = false;
                    else if (inDoubleQuote && ch === '"') inDoubleQuote = false;
                }
                current += ch;
            }
            if (current.trim()) fields.push(current.trim());
            return fields;
        }
        let fieldDefs = parseFields(fieldsRaw);
        function convertFieldToStrong(fieldDef) {
            if (!fieldDef.trim()) return null;
            const match = fieldDef.match(/^(`?[a-zA-Z0-9_]+`?)\s+([A-Za-z]+(?:\([^)]*\))?)(.*)$/i);
            if (match) {
                let fieldName = match[1];
                let restPart = match[3] || '';
                let commentMatch = restPart.match(/(COMMENT\s+'.*?')/i);
                let comment = commentMatch ? commentMatch[1] : '';
                let newField = `${fieldName} STRING`;
                if (comment) newField += ` ${comment}`;
                return newField;
            }
            let simpleNameMatch = fieldDef.match(/^(`?[a-zA-Z0-9_]+`?)/);
            if (simpleNameMatch) {
                let name = simpleNameMatch[1];
                let commentMatch = fieldDef.match(/COMMENT\s+'.*?'/i);
                let comment = commentMatch ? commentMatch[0] : '';
                let newField = `${name} STRING`;
                if (comment) newField += ` ${comment}`;
                return newField;
            }
            return fieldDef;
        }
        let convertedFields = [];
        for (let f of fieldDefs) {
            let cf = convertFieldToStrong(f);
            if (cf) convertedFields.push(cf);
        }
        if (convertedFields.length === 0) convertedFields = ['`unknown` STRING'];
        let formattedFields = convertedFields.map((f, idx) => `    ${f}`).join(',\n');
        let newFieldsPart = `(\n${formattedFields}\n)`;
        let tableComment = '';
        const commentRegex = /COMMENT\s+'([^']+)'/i;
        const commentMatch = remaining.match(commentRegex);
        if (commentMatch) {
            tableComment = ` COMMENT '${commentMatch[1]}'`;
        }
        const fixedSuffix = `
PARTITIONED BY (dt STRING COMMENT '天分区', et STRING COMMENT '库名称')
STORED AS PARQUET
TBLPROPERTIES (
    'transactional' = 'false',
    'parquet.compression' = 'snappy'
)`;
        let finalSql = `${createPart} ${newFieldsPart}${tableComment}${fixedSuffix}`;
        finalSql = finalSql.replace(/\s*\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n');
        return finalSql;
    }

    function updateConversion() {
        const inputSql = convertInput.value;
        if (inputSql.trim() === '') {
            convertOutput.value = '';
            return;
        }
        try {
            const converted = convertHiveTable(inputSql);
            convertOutput.value = converted;
        } catch (err) {
            console.warn(err);
            convertOutput.value = '转换出错，请检查SQL格式是否包含完整建表语句';
        }
    }

    convertInput.addEventListener('input', updateConversion);
    convertClearBtn.addEventListener('click', () => {
        convertInput.value = '';
        convertOutput.value = '';
        convertInput.focus();
    });
    convertCopyBtn.addEventListener('click', () => {
        const output = convertOutput.value;
        if (!output) {
            alert('没有可复制的内容，请先输入建表语句');
            return;
        }
        navigator.clipboard.writeText(output).then(() => {
            alert('✅ 转换结果已复制到剪贴板');
        }).catch(() => {
            alert('❌ 复制失败，可手动选中复制');
        });
    });
    setTimeout(() => {
        updateConversion();
    }, 50);

    // ----------------------------- 3. Tab 切换逻辑 -----------------------------
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = {
        'lineage-tab': document.getElementById('lineage-tab'),
        'convert-tab': document.getElementById('convert-tab')
    };
    function switchTab(tabId) {
        Object.keys(panels).forEach(id => {
            panels[id].classList.remove('active-panel');
        });
        panels[tabId].classList.add('active-panel');
        tabs.forEach(btn => {
            const target = btn.getAttribute('data-tab');
            if (target === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    tabs.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = btn.getAttribute('data-tab');
            if (targetTab) switchTab(targetTab);
        });
    });
})();