const { ipcRenderer, clipboard } = require('electron');

// DOM 元素
const addBtn = document.getElementById('addBtn');
const copyReportBtn = document.getElementById('copyReportBtn');
const inputSection = document.getElementById('inputSection');
const todoInput = document.getElementById('todoInput');
const submitBtn = document.getElementById('submitBtn');
const weeksContainer = document.getElementById('weeksContainer');
const historyToggle = document.getElementById('historyToggle');
const historyStats = document.getElementById('historyStats');

// 统计元素
const currentTotal = document.getElementById('currentTotal');
const currentCompleted = document.getElementById('currentCompleted');
const currentPending = document.getElementById('currentPending');
const historyTotal = document.getElementById('historyTotal');

// 状态
let todos = [];
let isInputExpanded = false;

// 当前周结束时刻（下周一 0 点，左闭右开区间）
function getCurrentWeekEndExclusive() {
    const e = new Date(getCurrentWeekStart());
    e.setDate(e.getDate() + 7);
    return e;
}

// 时间戳是否落在本周内
function isTimestampInCurrentWeek(isoOrDate) {
    const t = new Date(isoOrDate).getTime();
    const start = getCurrentWeekStart().getTime();
    const end = getCurrentWeekEndExclusive().getTime();
    return t >= start && t < end;
}

// 迁移旧数据字段
function migrateTodos() {
    let changed = false;
    todos.forEach((t) => {
        if (typeof t.starred !== 'boolean') {
            t.starred = false;
            changed = true;
        }
    });
    return changed;
}

// 初始化
async function init() {
    todos = await ipcRenderer.invoke('get-todos');
    if (migrateTodos()) {
        await saveTodos();
    }
    render();
    setupEventListeners();
}

// 获取周起始日期（周一），时间归零
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// 格式化日期
function formatDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 格式化周标签
function formatWeekLabel(weekStart) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${formatDate(start)} - ${formatDate(end)}`;
}

// 获取当前周起始
function getCurrentWeekStart() {
    return getWeekStart(new Date());
}

// 判断周类型
function getWeekType(weekStart) {
    const currentWeekStart = getCurrentWeekStart();
    const ws = new Date(weekStart).getTime();
    const cs = currentWeekStart.getTime();
    
    if (ws === cs) return 'current';
    if (ws < cs) return 'past';
    return 'future';
}

// 获取周类型标签
function getWeekTypeLabel(type) {
    const labels = {
        current: '本周',
        past: '历史',
        future: '未来'
    };
    return labels[type] || '';
}

// 切换输入框显示
function toggleInput() {
    isInputExpanded = !isInputExpanded;
    if (isInputExpanded) {
        inputSection.classList.add('expanded');
        addBtn.classList.add('expanded');
        addBtn.setAttribute('aria-expanded', 'true');
        addBtn.title = '收起输入';
        setTimeout(() => todoInput.focus(), 300);
    } else {
        inputSection.classList.remove('expanded');
        addBtn.classList.remove('expanded');
        addBtn.setAttribute('aria-expanded', 'false');
        addBtn.title = '添加待办';
        todoInput.value = '';
    }
}

// 添加待办
async function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;
    
    // 统一使用标准化的周起始时间
    const normalizedWeekStart = getCurrentWeekStart().toISOString();
    
    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false,
        starred: false,
        createdAt: new Date().toISOString(),
        weekStart: normalizedWeekStart
    };
    
    todos.push(newTodo);
    await saveTodos();
    
    todoInput.value = '';
    todoInput.focus();
    render();
}

// 切换完成状态（记录完成时间，用于周报）
async function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        if (todo.completed) {
            todo.completed = false;
            delete todo.completedAt;
        } else {
            todo.completed = true;
            todo.completedAt = new Date().toISOString();
        }
        await saveTodos();
        render();
    }
}

// 切换星标（高优先级）
async function toggleStar(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.starred = !todo.starred;
        await saveTodos();
        render();
    }
}

// 删除待办
async function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    await saveTodos();
    render();
}

// 保存数据
async function saveTodos() {
    await ipcRenderer.invoke('save-todos', todos);
}

// 复制本周周报（以「本周内勾选完成」为准）
function copyWeeklyReport() {
    const doneThisWeek = todos.filter(
        (t) => t.completed && t.completedAt && isTimestampInCurrentWeek(t.completedAt)
    );
    doneThisWeek.sort((a, b) => {
        if (!!a.starred !== !!b.starred) return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
        return new Date(a.completedAt) - new Date(b.completedAt);
    });

    const rangeLabel = formatWeekLabel(getCurrentWeekStart().toISOString());
    let body;
    if (doneThisWeek.length === 0) {
        body = '（本周暂无完成记录；仅统计带完成时间的条目）';
    } else {
        body = doneThisWeek
            .map((t, i) => `${i + 1}. ${t.starred ? '★ ' : ''}${t.text}`)
            .join('\n');
    }
    const text = `工作周报（${rangeLabel}）\n本周完成：\n${body}`;
    clipboard.writeText(text);
}

// 标准化周起始日期字符串（去掉时间部分）
function normalizeWeekStart(weekStartStr) {
    const d = new Date(weekStartStr);
    // 获取周一日期并归零时间
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

// 按周分组
function groupByWeek() {
    const groups = {};
    
    todos.forEach(todo => {
        // 使用标准化后的周起始作为 key，兼容旧数据
        const normalizedWs = normalizeWeekStart(todo.weekStart);
        
        if (!groups[normalizedWs]) {
            groups[normalizedWs] = {
                weekStart: normalizedWs,
                label: formatWeekLabel(normalizedWs),
                type: getWeekType(normalizedWs),
                todos: []
            };
        }
        groups[normalizedWs].todos.push(todo);
    });
    
    // 按时间倒序（最新的周在前）
    return Object.values(groups).sort((a, b) => 
        new Date(b.weekStart) - new Date(a.weekStart)
    );
}

// 渲染
function render() {
    // 按周分组
    const weekGroups = groupByWeek();
    
    // 计算本周和历史统计
    let currentWeekTotal = 0, currentWeekCompleted = 0, currentWeekPending = 0;
    let historyPending = 0;
    
    weekGroups.forEach(group => {
        if (group.type === 'current') {
            currentWeekTotal = group.todos.length;
            currentWeekCompleted = group.todos.filter(t => t.completed).length;
            currentWeekPending = currentWeekTotal - currentWeekCompleted;
        } else if (group.type === 'past') {
            // 历史周只统计未完成的
            historyPending += group.todos.filter(t => !t.completed).length;
        }
    });
    
    // 更新统计显示
    currentTotal.textContent = currentWeekTotal;
    currentCompleted.textContent = currentWeekCompleted;
    currentPending.textContent = currentWeekPending;
    historyTotal.textContent = historyPending;
    
    // 渲染列表
    if (weekGroups.length === 0) {
        weeksContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-text">还没有待办事项<br>点击右上角的 + 添加</div>
            </div>
        `;
        return;
    }
    
    weeksContainer.innerHTML = weekGroups.map(group => {
        // 本周、未来周：显示全部
        // 历史周：同样显示全部（含已完成），便于核对与误点取消；未完成排在前面
        const displayTodos = group.todos;

        if (displayTodos.length === 0) {
            return '';
        }

        const sorted = [...displayTodos].sort((a, b) => {
            if (group.type === 'past') {
                if (!!a.completed !== !!b.completed) {
                    return (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
                }
            }
            if (!!a.starred !== !!b.starred) return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
            return (a.id || 0) - (b.id || 0);
        });

        const checkTitle = (done) => (done ? '取消完成（恢复为未完成）' : '标为完成');

        return `
            <div class="week-section">
                <div class="week-header">
                    <span class="week-date">${group.label}</span>
                    <span class="week-label ${group.type}">${getWeekTypeLabel(group.type)}</span>
                </div>
                <ul class="todo-list">
                    ${sorted.map(todo => {
                        const pastDone = group.type === 'past' && todo.completed;
                        return `
                        <li class="todo-item ${todo.starred ? 'todo-item--starred' : ''}${pastDone ? ' todo-item--past-done' : ''}" data-todo-id="${todo.id}">
                            <button type="button" class="star-btn ${todo.starred ? 'star-btn--on' : ''}" data-todo-id="${todo.id}" title="${todo.starred ? '取消高优先级' : '标为高优先级'}">${todo.starred ? '★' : '☆'}</button>
                            <div class="checkbox-wrapper" title="${checkTitle(todo.completed)}">
                                <input type="checkbox" 
                                       class="todo-checkbox" 
                                       data-todo-id="${todo.id}"
                                       title="${checkTitle(todo.completed)}"
                                       aria-label="${checkTitle(todo.completed)}"
                                       ${todo.completed ? 'checked' : ''} />
                                <span class="checkbox-custom"></span>
                            </div>
                            <span class="todo-text ${todo.completed ? 'completed' : ''}">${escapeHtml(todo.text)}</span>
                            <button type="button" class="delete-btn" data-todo-id="${todo.id}">删除</button>
                        </li>
                    `;
                    }).join('')}
                </ul>
            </div>
        `;
    }).join('');
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 切换历史统计显示
function toggleHistoryStats() {
    historyStats.classList.toggle('hidden');
    historyToggle.classList.toggle('rotated');
}

function parseTodoId(el) {
    const raw = el && el.getAttribute && el.getAttribute('data-todo-id');
    const id = raw != null ? Number(raw) : NaN;
    return Number.isFinite(id) ? id : null;
}

function onWeeksContainerChange(e) {
    const input = e.target;
    if (!input || !input.classList || !input.classList.contains('todo-checkbox')) return;
    const id = parseTodoId(input);
    if (id != null) toggleTodo(id);
}

function onWeeksContainerClick(e) {
    const starBtn = e.target.closest('.star-btn');
    if (starBtn) {
        e.preventDefault();
        const id = parseTodoId(starBtn);
        if (id != null) toggleStar(id);
        return;
    }
    const delBtn = e.target.closest('.delete-btn');
    if (delBtn) {
        e.preventDefault();
        const id = parseTodoId(delBtn);
        if (id != null) deleteTodo(id);
        return;
    }
}

// 事件监听
function setupEventListeners() {
    // 添加按钮
    addBtn.addEventListener('click', toggleInput);
    
    // 提交按钮
    submitBtn.addEventListener('click', addTodo);
    
    // 回车键
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    // ESC 关闭输入框
    todoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleInput();
        }
    });
    
    // 历史统计切换按钮
    historyToggle.addEventListener('click', toggleHistoryStats);

    copyReportBtn.addEventListener('click', () => {
        copyWeeklyReport();
        const prev = copyReportBtn.textContent;
        copyReportBtn.textContent = '已复制';
        setTimeout(() => {
            copyReportBtn.textContent = prev;
        }, 1200);
    });

    weeksContainer.addEventListener('change', onWeeksContainerChange);
    weeksContainer.addEventListener('click', onWeeksContainerClick);
}

// 启动
init();
