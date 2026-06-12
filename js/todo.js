$(document).ready(function() {
    let todos = [];
    const STORAGE_KEY = 'todo_list_data';

    function init() {
        todos = loadTodos();
        renderTodos('all');
        updateStats();
        bindEvents();
    }

    function loadTodos() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function saveTodos() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

    function addTodo(content) {
        if (!content.trim()) return;
        
        const newTodo = {
            id: Date.now(),
            content: content.trim(),
            completed: false,
            createdAt: Date.now()
        };
        
        todos.push(newTodo);
        saveTodos();
        renderTodos(currentFilter);
        updateStats();
    }

    function deleteTodo(id) {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos(currentFilter);
        updateStats();
    }

    function toggleTodo(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            saveTodos();
            renderTodos(currentFilter);
            updateStats();
        }
    }

    function editTodo(id, content) {
        const todo = todos.find(t => t.id === id);
        if (todo && content.trim()) {
            todo.content = content.trim();
            saveTodos();
            renderTodos(currentFilter);
        }
    }

    let currentFilter = 'all';

    function renderTodos(filter) {
        currentFilter = filter;
        const $list = $('#todoList');
        const $emptyState = $('#emptyState');
        
        const filteredTodos = todos.filter(todo => {
            if (filter === 'active') return !todo.completed;
            if (filter === 'completed') return todo.completed;
            return true;
        });

        if (filteredTodos.length === 0) {
            $list.hide();
            $emptyState.show();
            return;
        }

        $emptyState.hide();
        $list.show();

        $list.empty();
        
        filteredTodos.forEach(todo => {
            const $item = $('<li>').addClass('todo-item').data('id', todo.id);
            if (todo.completed) {
                $item.addClass('completed');
            }

            const $checkbox = $('<input>')
                .attr('type', 'checkbox')
                .addClass('todo-checkbox')
                .prop('checked', todo.completed);

            const $content = $('<span>').addClass('todo-content').text(todo.content);

            const $actions = $('<div>').addClass('todo-actions');
            const $editBtn = $('<button>').addClass('todo-action-btn edit').text('✏️');
            const $deleteBtn = $('<button>').addClass('todo-action-btn delete').text('🗑️');

            $actions.append($editBtn, $deleteBtn);
            $item.append($checkbox, $content, $actions);
            $list.append($item);
        });
    }

    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        $('.todo-header .stats span:first strong').text(total);
        $('.todo-header .stats span:nth-child(2) strong').text(completed);
        $('.todo-header .stats span:last strong').text(percentage + '%');
    }

    function bindEvents() {
        $('#addBtn').click(function() {
            const content = $('#newTask').val();
            addTodo(content);
            $('#newTask').val('').focus();
        });

        $('#newTask').keypress(function(e) {
            if (e.which === 13) {
                $('#addBtn').click();
            }
        });

        $('#todoList').on('change', '.todo-checkbox', function() {
            const id = $(this).closest('.todo-item').data('id');
            toggleTodo(id);
        });

        $('#todoList').on('click', '.todo-action-btn.delete', function() {
            const id = $(this).closest('.todo-item').data('id');
            deleteTodo(id);
        });

        $('#todoList').on('click', '.todo-action-btn.edit', function() {
            const $item = $(this).closest('.todo-item');
            const $content = $item.find('.todo-content');
            const id = $item.data('id');
            const currentText = $content.text();

            const $input = $('<input>')
                .attr('type', 'text')
                .addClass('todo-content editing')
                .val(currentText);

            $content.replaceWith($input);
            $input.focus().select();

            $input.blur(function() {
                const newText = $(this).val();
                editTodo(id, newText);
            });

            $input.keypress(function(e) {
                if (e.which === 13) {
                    $(this).blur();
                }
            });
        });

        $('.filter-btn').click(function() {
            $('.filter-btn').removeClass('active');
            $(this).addClass('active');
            const filter = $(this).data('filter');
            renderTodos(filter);
        });
    }

    init();
});