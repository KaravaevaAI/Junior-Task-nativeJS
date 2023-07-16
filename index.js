// Global
const newTaskBlock = document.querySelector('.new-task');
const filtersBlock = document.querySelector('.filters');
const tasksBlock = document.querySelector('.tasks');
const confirmBlock = document.querySelector('.confirm');
const loadingBlock = document.querySelector('.loading');

const addTaskBtn = newTaskBlock.querySelector('.new-task__btn');
const addTaskField = newTaskBlock.querySelector('.new-task__text_content');
const dropDownBtns = document.querySelectorAll('.dd-list');
const filtersByStatusBtns = filtersBlock.querySelectorAll('.filters__status_checkbox');
const findByTextBtn = filtersBlock.querySelector('.filters__find-by-text_btn');
const sortByDateBtn = filtersBlock.querySelector('.filters__sort-by-date_btn');
const sortByPriorityBtn = filtersBlock.querySelector('.filters__sort-by-priority_btn');
const findByTextField = filtersBlock.querySelector('.filters__find-by-text_text');

let actualTasks = [];

class Task {

    constructor(priority, text, date) {
        this.priority = priority;
        this.text = text;
        this.status = 'active';

        let hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
        let minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
        this.date = `${date.toLocaleDateString('ru-RU')} ${hours}:${minutes}`;
    }
}

// HTTP Requests
async function getTasks() {
    loadingBlock.classList.add('show');
    responseGet = await fetch('http://localhost:4000/items', { method: 'GET' });
    actualTasks = await responseGet.json();
    loadingBlock.classList.remove('show');
}
// HTTP Requests (END)

// Draw Elements
function drawTaskCards(arr) {
    tasksBlock.textContent = '';
    if (arr.length > 0) arr.forEach(task => createTaskCard(task));
    else createElemWithText('div', tasksBlock, 'Совпадений не найдено...', 'task');
}

function createElem(tag, parent, ...classes) {
    let elem = document.createElement(tag);
    for (let c of classes) elem.classList.add(c);
    parent == tasksBlock ? parent.prepend(elem) : parent.append(elem);
    return elem;
}

function createElemWithText(tag, parent, text, ...classes) {
    let elem = createElem(tag, parent, ...classes);
    elem.textContent = text;
    return elem;
}
// Draw Elements (END)

// Window's Event Listeners
window.addEventListener('resize', () => {
    document.querySelector('.visible')?.classList.remove('visible');
    document.querySelectorAll('.task__content_text')?.forEach(elem => resetTextAreasHeight(elem));
});

window.addEventListener('click', e => {
    if (!e.target.closest('.new-task') || e.target.closest('.new-task__btn')) {
        addTaskField.value = '';
        resetTextAreasHeight(addTaskField);
    }
    if (!e.target.closest('.dd-list')) {
        document.querySelector('.visible')?.classList.remove('visible');
    }
});

window.addEventListener('mousedown', e => {
    let changingTask = document.querySelector('.changing');
    if (!e.target.closest('.task__content_text') && !e.target.closest('.btn_save') && changingTask) {
        resetChanged(changingTask);
    }
});
// Window's Event Listeners (END)

// Reset CSS style
function resetChanged(elem) {
    elem.classList.remove('changing');
    changingText = elem.querySelector('.task__content_text');
    changingText.value = actualTasks.find(task => task.id == elem.id).text;
    resetTextAreasHeight(changingText);
}

function resetSort() {
    filtersBlock.querySelectorAll('.sort-d').forEach(elem => elem.classList.remove('sort-d'));
    if (!sortByDateBtn.parentElement.classList.contains('selected-sort')) {
        sortByDateBtn.parentElement.classList.add('selected-sort');
        sortByPriorityBtn.parentElement.classList.remove('selected-sort');
    }
}

function resetFilters() {
    filtersByStatusBtns.forEach(item => {
        if (!item.parentElement.classList.contains('selected-filter')) {
            item.parentElement.classList.add('selected-filter');
        }
    })
    filtersBlock.querySelector('.dd-list__selected').textContent = 'любой';
}

function resetTextAreasHeight(elem) {
    elem.style.height = 'auto';
    elem.style.height = elem.scrollHeight + 'px';
}
// Reset CSS style (END)
// Global (END)

// Add New Task
addTaskField.addEventListener('input', () => resetTextAreasHeight(addTaskField));
addTaskBtn.addEventListener('click', async () => {
    const priority = newTaskBlock.querySelector('.dd-list__selected').textContent;
    const text = addTaskField.value.trim();
    if (text != '') {
        await fetch('http://localhost:4000/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(new Task(priority, text, new Date()))
        })
        await getTasks();
        resetSort();
        resetFilters();
        drawTaskCards(actualTasks);
        newTaskBlock.querySelector('.warning')?.classList.remove('warning');
        newTaskBlock.querySelector('.dd-list__selected').textContent = 'средний';
    }
    else {
        const parent = newTaskBlock.querySelector('.new-task__text_warning').parentElement;
        if (!parent.classList.contains('warning')) parent.classList.add('warning');
    }
    findByTextField.value = '';
});
// Add New Task (END)

// Create Task Card
function createTaskCard(taskData) {
    let task = createElem('div', tasksBlock, 'task', taskData.status);
    task.id = taskData.id;
    createElemWithText('div', task, taskData.priority, 'task__priority', 'title');
    let taskContent = createElem('div', task, 'task__content');
    let taskDelete = createElem('button', task, 'task__delete', 'btn', 'btn_delete');

    let taskInfo = createElem('div', taskContent, 'task__content_info');
    let taskText = createElemWithText('textarea', taskInfo, taskData.text, 'task__content_text');
    createElemWithText('div', taskInfo, taskData.date, 'task__content_date');

    let taskStatus = createElem('div', taskContent, 'task__content_status');
    let taskDone = createElem('button', taskStatus, 'task__content_done', 'btn', 'btn_done');
    let taskCancel = createElem('button', taskStatus, 'task__content_cancel', 'btn', 'btn_cancel');
    let taskSave = createElem('button', taskStatus, 'task__content_save', 'btn', 'btn_save');

    taskText.style.height = (taskText.scrollHeight) + 'px';
    taskText.addEventListener('input', () => resetTextAreasHeight(taskText));
    taskText.addEventListener('mousedown', () => startChanges(taskData));
    taskDone.addEventListener('click', () => changeStatus(taskData, 'done'));
    taskCancel.addEventListener('click', () => changeStatus(taskData, 'canceled'));
    taskDelete.addEventListener('click', () => deleteTask(taskData));
    taskSave.addEventListener('click', () => saveChanges(taskData));
}

function startChanges(taskData) {
    let taskCard = document.getElementById(taskData.id);
    let changingTask = tasksBlock.querySelector('.changing');
    if (!changingTask) {
        taskCard.classList.add('changing');
        return;
    }
    if (changingTask != taskCard) {
        resetChanged(changingTask);
        taskCard.classList.add('changing');
    }
}

function changeStatus(taskData, newStatus) {
    let taskCard = document.getElementById(taskData.id);
    let changingTask = actualTasks.find(t => t.id == taskData.id);
    let exStatus = changingTask.status;
    changingTask.status = newStatus;
    fetch(`http://localhost:4000/items/${taskData.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(changingTask)
    });
    let filters = getFilters();
    if (!filters.includes(newStatus)) {
        taskCard.remove();
        actualTasks.splice(actualTasks.findIndex(task => task.id == taskData.id), 1);
        if (actualTasks.length == 0) createElemWithText('div', tasksBlock, 'Совпадений не найдено...', 'task');
        return;
    }
    taskCard.classList.remove(exStatus);
    taskCard.classList.add(newStatus);
}

function deleteTask(taskData) {
    confirmBlock.querySelector('.task__priority').textContent = taskData.priority;
    confirmBlock.querySelector('.task__content_text').textContent = taskData.text;
    confirmBlock.querySelector('.task__content_date').textContent = taskData.date;
    toggleConfirm();

    confirmBlock.onclick = e => {
        let target = e.target;
        if (target.closest('.confirm__bg') || target.closest('.confirm__btns_cancel')) toggleConfirm();
        else if (target.closest('.confirm__btns_delete')) {
            fetch(`http://localhost:4000/items/${taskData.id}`, { method: 'DELETE' });
            toggleConfirm();
            actualTasks.splice(actualTasks.findIndex(t => t.id == taskData.id), 1);
            document.getElementById(taskData.id).remove();
        }
    }

    function toggleConfirm() {
        confirmBlock.classList.toggle('show');
        confirmBlock.classList.toggle(`${actualTasks.find(t => t.id == taskData.id).status}`);
    }
}

function saveChanges(taskData) {
    let taskCard = document.getElementById(taskData.id);
    taskCard.classList.remove('changing');
    let changingTask = actualTasks.find(t => t.id == taskData.id);
    let text = taskCard.querySelector('.task__content_text');
    if (text.value.trim() == '') {
        text.value = changingTask.text;
    }
    else {
        text.value = text.value.trim();
        changingTask.text = text.value;
        fetch(`http://localhost:4000/items/${taskData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(changingTask)
        });
    }
    resetTextAreasHeight(text);
}
// Create Task Card (END)

// Drop Down
dropDownBtns.forEach(item => {
    item.addEventListener('click', e => {
        const target = e.target;
        const visible = document.querySelector('.visible');
        if (!visible || visible != item) {
            visible?.classList.remove('visible');
            item.classList.add('visible');
            return;
        }
        item.querySelector('.dd-list__selected').textContent = target.textContent;
        item.classList.remove('visible');
        if (target.closest('.filters')) filterTasks(); // Filter By Priority
    })
});
// Drop Down (END)

// Sorts
// Sort By Date
sortByDateBtn.addEventListener('click', () => {
    changeSort(sortByDateBtn.parentElement);
    let a = actualTasks.slice();
    if (sortByDateBtn.parentElement.classList.contains('sort-d')) a.reverse();
    drawTaskCards(a);
})
// Sort By Date (END)

// Sort By Priority
sortByPriorityBtn.addEventListener('click', () => {
    changeSort(sortByPriorityBtn.parentElement);
    let a = [];
    if (sortByPriorityBtn.parentElement.classList.contains('sort-d')) {
        a = actualTasks.filter(task => task.priority == 'высокий');
        a.push(...actualTasks.filter(task => task.priority == 'средний'));
        a.push(...actualTasks.filter(task => task.priority == 'низкий'));
    }
    else {
        a = actualTasks.filter(task => task.priority == 'низкий');
        a.push(...actualTasks.filter(task => task.priority == 'средний'));
        a.push(...actualTasks.filter(task => task.priority == 'высокий'));
    }
    drawTaskCards(a);
})
// Sort By Priority (END)

function changeSort(parent) {
    findByTextField.value = '';
    if (parent.classList.contains('selected-sort')) {
        parent.classList.toggle('sort-d');
        return;
    }
    filtersBlock.querySelector('.selected-sort').classList.remove('selected-sort');
    parent.classList.add('selected-sort');
}
// Sorts (END)

// Filters
// Filter By Status
filtersByStatusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.parentElement.classList.toggle('selected-filter');
        filterTasks();
    })
})
// Filter By Status (END)

// Filter By Priority (in Drop Down Block)

async function filterTasks() {
    findByTextField.value = '';
    resetSort();
    await getTasks();
    let filters = getFilters();
    actualTasks = actualTasks.filter(task => filters.includes(task.status) && filters.includes(task.priority));
    drawTaskCards(actualTasks);
}

function getFilters() {
    let filters = [];
    let priority = filtersBlock.querySelector('.dd-list__selected').textContent;
    priority == 'любой' ? filters.push('низкий', 'средний', 'высокий') : filters.push(priority);
    filtersByStatusBtns.forEach(item => {
        if (item.parentElement.classList.contains('selected-filter')) {
            filters.push(item.parentElement.classList[0]);
        }
    });
    return filters;
}
// Filters (END)

// Find By Text
findByTextBtn.addEventListener('click', () => findByText());
findByTextField.addEventListener('keyup', e => {
    if (e.key == 'Enter') findByText(e);
})

function findByText() {
    let text = findByTextField.value.trim();
    findByTextField.value = text;
    if (text == '') return;
    let a = actualTasks.filter(task => task.text.toLowerCase().startsWith(text.toLowerCase()));
    drawTaskCards(a);
}
// Find By Text (END)