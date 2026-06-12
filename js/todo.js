$(document).ready(function() {
    let todos = [];
    let notes = [];
    const TODO_STORAGE_KEY = 'todo_list_data';
    const NOTE_STORAGE_KEY = 'note_list_data';

    function init() {
        todos = loadTodos();
        notes = loadNotes();
        renderTodos('all');
        renderNotes();
        bindEvents();
    }

    function loadTodos() {
        const stored = localStorage.getItem(TODO_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function saveTodos() {
        localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
    }

    function loadNotes() {
        const stored = localStorage.getItem(NOTE_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function saveNotes() {
        localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(notes));
    }

    function addTodo(content) {
        if (!content.trim()) return;
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const contentWithDate = content.trim() + ` (${dateStr})`;
        
        const newTodo = {
            id: Date.now(),
            content: contentWithDate,
            completed: false,
            createdAt: Date.now()
        };
        
        todos.push(newTodo);
        saveTodos();
        renderTodos(currentFilter);
    }

    function deleteTodo(id) {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos(currentFilter);
    }

    function toggleTodo(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            saveTodos();
            renderTodos(currentFilter);
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

    function addNote(content) {
        if (!content.trim()) return;
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const contentWithDate = content.trim() + `\n(${dateStr})`;
        
        const newNote = {
            id: Date.now(),
            content: contentWithDate,
            createdAt: Date.now()
        };
        
        notes.push(newNote);
        saveNotes();
        renderNotes();
    }

    function deleteNote(id) {
        notes = notes.filter(note => note.id !== id);
        saveNotes();
        renderNotes();
    }

    function editNote(id, content) {
        const note = notes.find(n => n.id === id);
        if (note && content.trim()) {
            note.content = content.trim();
            saveNotes();
            renderNotes();
        }
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    function renderNotes() {
        const $list = $('#noteList');
        const $emptyState = $('#noteEmptyState');

        if (notes.length === 0) {
            $list.hide();
            $emptyState.show();
            return;
        }

        $emptyState.hide();
        $list.show();

        $list.empty();

        const sortedNotes = [...notes].sort((a, b) => b.createdAt - a.createdAt);
        
        sortedNotes.forEach(note => {
            const $item = $('<li>').addClass('note-item').data('id', note.id);

            const $content = $('<p>').addClass('note-content').text(note.content);

            const $meta = $('<div>').addClass('note-meta');
            const $time = $('<span>').addClass('note-time').text(formatDate(note.createdAt));
            
            const $actions = $('<div>').addClass('note-actions');
            const $editBtn = $('<button>').addClass('note-action-btn edit').text('编辑');
            const $deleteBtn = $('<button>').addClass('note-action-btn delete').text('删除');
            
            $actions.append($editBtn, $deleteBtn);
            $meta.append($time, $actions);
            $item.append($content, $meta);
            $list.append($item);
        });
    }

    function switchTab(tabName) {
        $('.tab-btn').removeClass('active');
        $(`[data-tab="${tabName}"]`).addClass('active');
        
        $('.tab-content').removeClass('active');
        $(`#${tabName}-tab`).addClass('active');
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

        $('.tab-btn').click(function() {
            const tabName = $(this).data('tab');
            switchTab(tabName);
        });

        $('#addNoteBtn').click(function() {
            const content = $('#newNote').val();
            addNote(content);
            $('#newNote').val('').focus();
        });

        $('#newNote').keypress(function(e) {
            if (e.which === 13 && e.ctrlKey) {
                $('#addNoteBtn').click();
            }
        });

        $('#clearNoteBtn').click(function() {
            $('#newNote').val('').focus();
        });

        $('#noteList').on('click', '.note-action-btn.delete', function() {
            const id = $(this).closest('.note-item').data('id');
            deleteNote(id);
        });

        $('#noteList').on('click', '.note-action-btn.edit', function() {
            const $item = $(this).closest('.note-item');
            const $content = $item.find('.note-content');
            const id = $item.data('id');
            const currentText = $content.text();

            const $textarea = $('<textarea>')
                .addClass('note-content editing')
                .val(currentText);

            $content.replaceWith($textarea);
            $textarea.focus();
            $textarea.scrollTop(0);

            $textarea.blur(function() {
                const newText = $(this).val();
                editNote(id, newText);
            });

            $textarea.keypress(function(e) {
                if (e.which === 13 && e.ctrlKey) {
                    $(this).blur();
                }
            });
        });
    }

    init();
});