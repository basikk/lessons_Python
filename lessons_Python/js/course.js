// Підтримує:
// - Вхід учня без перезавантаження
// - Список уроків із темами та розблокуванням
// - Підсвітку завершених уроків і завдань
// - Прогрес-бар
// - Плавне завантаження уроку (fade-in)
// - Pyodide для запуску та перевірки коду
// ================================

// ================================
// course.js — логіка курсу Python 9 клас
// Працює з GitHub Pages + Pyodide
// ================================

// -------------------------------
// ДАНІ ПРО КУРС
// -------------------------------
const courseData = [
  { topic: "Основи Python", lessons: [
      { id: "lesson1", title: "Змінні та типи даних" }
  ]},
  { topic: "Основні алгоритмічні структури", lessons: [
      { id: "lesson2", title: "Лінійні алгоритми" },
      { id: "lesson3", title: "Алгоритми розгалужень" },
      { id: "lesson4", title: "Цикли" },
      { id: "lesson5", title: "Списки" },
      { id: "lesson6", title: "Робота з функціями" }
  ]}
];

// -------------------------------
// ЛОГІН УЧНЯ
// -------------------------------
function loginStudent() {
   const emailInput = document.getElementById("email");
    const email = document.getElementById("email").value.trim().toLowerCase();

  if (!email) {
    alert("Введіть email!");
    return;
  }

   // Зберігаємо поточного учня
  localStorage.setItem("currentStudent", email);

  // Якщо нового учня, створюємо об'єкт для прогресу
  if (!localStorage.getItem(`student_${email}`)) {
    localStorage.setItem(`student_${email}`, JSON.stringify({}));
  }

   // Перезавантажуємо сторінку, щоб ініціалізувати курс для нового учня
  location.reload();
}

function getCurrentStudent() {
  return localStorage.getItem("currentStudent");
}

// автоповернення до останього завдання
function getLastLessonKey(email) {
  return `lastLesson_${email}`;
}

function saveLastLesson(lessonId) {
  const email = getCurrentStudent();
  if (!email) return;
  localStorage.setItem(getLastLessonKey(email), lessonId);
}

function getLastLesson(email) {
  if (!email) return null;
  return localStorage.getItem(getLastLessonKey(email));
}

// -------------------------------
// ПРОГРЕС-БАР
// -------------------------------
function updateCourseProgress() {
  const current = getCurrentStudent();
  if (!current) return;

  const studentData = JSON.parse(localStorage.getItem(`student_${current}`)) || {};
  let totalTasks = 0, completedTasks = 0;

   // Підраховуємо загальну кількість завдань і завершені завдання
  courseData.forEach(topic => topic.lessons.forEach(l => {
    const p = studentData[l.id];
    totalTasks += p ? p.totalTasks : 1;
    completedTasks += p ? p.completedTasks : 0;
  }));

  const percent = Math.round((completedTasks / totalTasks) * 100);
  const progressEl = document.getElementById("course-progress");
  progressEl.style.width = percent + "%";
  progressEl.textContent = percent + "%";
}

// -------------------------------
//  ПОБУДОВА  СПИСОК УРОКІВ
// -------------------------------


function buildLessonsList() {
  const current = getCurrentStudent();  // отримуємо поточного учня
  if (!current) return;

  const studentData = JSON.parse(localStorage.getItem(`student_${current}`)) || {};
  const lessonsList = document.getElementById("lessons-list");
  lessonsList.innerHTML = ""; // очищаємо контейнер перед побудовою

  courseData.forEach(topic => {
    const div = document.createElement("div");
    div.className = "lesson-topic";

    // Заголовок теми (розкривний)
    const h3 = document.createElement("h3");
    h3.textContent = topic.topic;

      // Клік по заголовку відкриває/закриває список уроків
    h3.onclick = () => {
      const ol = div.querySelector("ol");
      ol.style.display = ol.style.display === "none" ? "block" : "none";
    };
    div.appendChild(h3);

     // Створюємо один список уроків для цієї теми
    const ol = document.createElement("ol");

    // Додаємо нумерацію уроків у темі
    topic.lessons.forEach((lesson, idx) => {
      const li = document.createElement("li");
      
      const a = document.createElement("a");
      a.textContent = lesson.title;
      li.appendChild(a);

      // Перевірка, чи урок розблоковано
      const flatLessons = courseData.flatMap(t => t.lessons);
      const index = flatLessons.findIndex(l => l.id === lesson.id);
      let unlocked = true;

      if (index > 0) {
        const prevId = flatLessons[index - 1].id;
        const prev = studentData[prevId];
        unlocked = prev && prev.completedTasks === prev.totalTasks;
      }

      if (!unlocked) {
        li.className = "locked"; // затемнення для заблокованих уроків
      } else {
        a.href = "#";
        a.onclick = e => {
          e.preventDefault();
          loadLesson(lesson.id);
        };

        // Якщо урок завершено, додаємо зелений клас
        if (studentData[lesson.id] &&
            studentData[lesson.id].completedTasks === studentData[lesson.id].totalTasks) {
          a.classList.add("completed-lesson");
        }
      }

      li.appendChild(a);
      ol.appendChild(li);
    });

    div.appendChild(ol); // додаємо список уроків теми до div
    lessonsList.appendChild(div);
  });

}


// -------------------------------
// ЗАВАНТАЖЕННЯ УРОКУ
// -------------------------------
function loadLesson(lessonId) {
 const content = document.getElementById("content");
  content.style.opacity = 0; // для fade-in ефекту
  
    fetch(`lessons/${lessonId}.html`)
    .then(r => r.text())
    .then(html => {
      content.innerHTML = html;
      updateLessonProgress();
      
      setTimeout(() => {  content.style.opacity = 1; }, 50); // плавне відображення
      saveLastLesson(lessonId);
   
      })
    .catch(() => {
      document.getElementById("content").innerHTML =
        "<p>Помилка завантаження уроку</p>";
    });
}

// -------------------------------
// ОНОВЛЕННЯ ПРОГРЕСУ ПОТОЧНОГО УРОКУ
// -------------------------------
function updateLessonProgress() {
  const progressEl = document.querySelector(".lesson-progress");
  if (!progressEl) return;

  const lessonId = progressEl.dataset.lessonId;
  const current = getCurrentStudent();
  if (!current || !lessonId) return;

  const studentData =
    JSON.parse(localStorage.getItem(`student_${current}`)) || {};

  const lessonData = studentData[lessonId] || {
    completedTasks: 0,
    totalTasks: 1
  };

  const percent = Math.round(
    (lessonData.completedTasks / lessonData.totalTasks) * 100
  );

  progressEl.querySelector(".lesson-progress-percent").textContent =
    percent + "%";

  progressEl.querySelector(".lesson-progress-fill").style.width =
    percent + "%";
}





// -------------------------------
// PYODIDE
// -------------------------------
let pyodideReady = false;
async function initPy() {
  if (!pyodideReady) {
    window.pyodide = await loadPyodide();
    pyodideReady = true;
  }
}

// --------------- ЗАПУСК КОДУ УЧНЯ   ------*/

async function runStudentCode(task) {
  await initPy();

  const code = task.querySelector("textarea").value;
  const inputs = task.querySelectorAll(".user-input");
  let index = 0;

  pyodide.globals.set("input", () => inputs[index++]?.value || "");

  pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
`);

  try {
    await pyodide.runPythonAsync(code);
    const res = pyodide.runPython("sys.stdout.getvalue()");
    task.querySelector(".output").textContent = res || "(немає виводу)";
  } catch (e) {
    task.querySelector(".output").textContent = e;
  }
}

/* ---------  ПЕРЕВІРКА КОДУ т -------------------------------- */
async function checkStudentCode(task) {
  await initPy();

  const code = task.querySelector("textarea").value;
  const tests = JSON.parse(task.dataset.tests);
  const output = task.querySelector(".output");

  for (let test of tests) {
    const inputs = task.querySelectorAll(".user-input");
    test.input.forEach((v, i) => (inputs[i].value = v));

    let index = 0;
    pyodide.globals.set("input", () => inputs[index++]?.value || "");

    pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
`);

    try {
      await pyodide.runPythonAsync(code);
      const res = pyodide.runPython("sys.stdout.getvalue()").trim();

      if (res !== String(test.expected).trim()) {
        output.textContent =
          `❌ Ввід: ${test.input.join(", ")} | Очікується: ${test.expected} | Отримано: ${res}`;
        return;
      }
    } catch (e) {
      output.textContent = e;
      return;
    }
  }

  // ✅ Тести пройдено
  output.textContent = "✅ Усі тести пройдено!";

  // Оновлення прогресу уроку після проходження завдання
  const lessonId = task.dataset.lessonId;
  const email = getCurrentStudent();
  if (!email) return;

 // Отримуємо дані учня
const students = JSON.parse(localStorage.getItem(`student_${email}`)) || {};


// Якщо урок ще не ініціалізований — рахуємо кількість завдань в уроці
if (!students[lessonId]) {
  const total = document.querySelectorAll(`.task[data-lesson-id="${lessonId}"]`).length;
  students[lessonId] = {
    completedTasks: 0,  // спочатку 0
    totalTasks: total   // кількість усіх завдань у цьому уроці
  };
}

// Додаємо +1 тільки якщо завдання ще не відмічено як завершене
if (!task.classList.contains("completed")) {
  students[lessonId].completedTasks += 1;
}

// Зберігаємо прогрес у localStorage
localStorage.setItem(`student_${email}`, JSON.stringify(students));

    
  
  // Підсвічуємо завдання плавно
  task.classList.add("completed");
  task.style.transition = "background-color 0.5s ease";

  // Додаємо зелений чек для уроку у лівій колонці
  const lessonLink = document.querySelector(`#lessons-list a[href="#"][onclick*="${lessonId}"]`);
  if (lessonLink) lessonLink.classList.add("completed-lesson");

 
  updateCourseProgress();       // Оновлюємо прогрес-бар всього курсу
  updateLessonProgress();       // Оновлюємо прогрес-бар окремого уроку
}


/* ------------ ГЕНЕРАЦІЯ НОВОГО ЗАВДАННЯ    */
/**
 * Додає 1 додаткове завдання для поточного уроку (або lessonId, якщо передали).
 * Працює з extraTaskTemplates = { lesson1:[...], lesson2:[...], ... } з extraTasks.js
 */
function addExtraTask(lessonId) {
  // ------------------------------
  // 0) Перевіряємо, чи підключений файл extraTasks.js і чи існує extraTaskTemplates
  // ------------------------------
  if (typeof extraTaskTemplates === "undefined") {
    alert("extraTaskTemplates не знайдено. Перевір, чи підключений js/extraTasks.js перед course.js");
    console.error("extraTaskTemplates is undefined. Check script order in index.html.");
    return;
  }

  // ------------------------------
  // 1) Якщо lessonId не передали — намагаємось визначити його з DOM уроку
  //    1) з блоку прогресу уроку (.lesson-progress)
  //    2) або з першого завдання (.task)
  // ------------------------------
  if (!lessonId) {
    const progressEl = document.querySelector(".lesson-progress[data-lesson-id]");
    if (progressEl) lessonId = progressEl.dataset.lessonId;

    if (!lessonId) {
      const firstTask = document.querySelector(".task[data-lesson-id]");
      if (firstTask) lessonId = firstTask.dataset.lessonId;
    }
  }

  // Нормалізуємо id (часта причина undefined/не збігається через пробіли)
  lessonId = String(lessonId || "").trim().toLowerCase();

  if (!lessonId) {
    alert("Не вдалося визначити lessonId для додаткових завдань.");
    console.error("addExtraTask(): lessonId is empty/undefined. Add data-lesson-id in lesson or pass it to addExtraTask('lesson1').");
    return;
  }

  // ------------------------------
  // 2) Беремо масив шаблонів саме для цього уроку
  // ------------------------------
  const tasksForLesson = extraTaskTemplates[lessonId];

  // Діагностика: що саме бачимо
  console.log("addExtraTask() lessonId =", lessonId);
  console.log("extraTaskTemplates keys =", Object.keys(extraTaskTemplates));
  console.log("tasksForLesson =", tasksForLesson);

  if (!Array.isArray(tasksForLesson) || tasksForLesson.length === 0) {
    alert(`Для уроку "${lessonId}" немає додаткових завдань (або id не збігається з ключем у extraTaskTemplates).`);
    return;
  }

  // ------------------------------
  // 3) Рахуємо тільки ВЖЕ ДОДАНІ додаткові завдання цього уроку (.task.extra)
  //    (базові завдання уроку не повинні впливати на індексацію шаблонів)
  // ------------------------------
  const existingExtraTasks = document.querySelectorAll(`.task.extra[data-lesson-id="${lessonId}"]`);
  const nextTaskIndex = existingExtraTasks.length;

  if (nextTaskIndex >= tasksForLesson.length) {
    alert("Всі додаткові завдання для цього уроку вже додані.");
    return;
  }

  // ------------------------------
  // 4) Беремо наступний шаблон
  // ------------------------------
  const template = tasksForLesson[nextTaskIndex];

  // Скільки потрібно input-ів? (по першому тесту)
  const inputsCount = template?.tests?.[0]?.input?.length || 1;

  let inputsHtml = "";
  for (let i = 0; i < inputsCount; i++) {
    inputsHtml += `
      <label>
        Ввід ${i + 1}:
        <input class="user-input" type="text" placeholder="значення ${i + 1}">
      </label>
    `;
  }

  // ------------------------------
  // 5) Створюємо DOM-блок завдання
  // ------------------------------
  const newTask = document.createElement("div");
  newTask.className = "task medium extra";      // extra — важливо!
  newTask.dataset.lessonId = lessonId;
  newTask.dataset.tests = JSON.stringify(template.tests || []);

  newTask.innerHTML = `
    <h2>${template.title || "Додаткове завдання"}</h2>
    <p>${template.description || ""}</p>

    ${inputsHtml}

    <textarea rows="6">${template.code || ""}</textarea>

    <div class="buttons">
      <button onclick="runStudentCode(this.closest('.task'))">▶ Запустити</button>
      <button onclick="checkStudentCode(this.closest('.task'))">✔ Перевірити</button>
      <button onclick="toggleHint(this)">💡 Підказка</button>
    </div>

    <div class="hint" style="display:none;">
      <p>${template.hint || ""}</p>
    </div>

    <pre class="output"></pre>
  `;

  // ------------------------------
  // 6) Вставляємо після останнього завдання цього уроку (будь-якого: базового чи додаткового)
  // ------------------------------
  const allLessonTasks = document.querySelectorAll(`.task[data-lesson-id="${lessonId}"]`);
  const lastTask = allLessonTasks[allLessonTasks.length - 1];

  if (lastTask) {
    lastTask.parentNode.insertBefore(newTask, lastTask.nextSibling);
  } else {
    document.getElementById("content").appendChild(newTask);
  }

  // ------------------------------
  // 7) Оновлюємо прогрес (totalTasks +1)
  // ------------------------------
  const email = getCurrentStudent();
  if (!email) return;

  const students = JSON.parse(localStorage.getItem(`student_${email}`)) || {};

  if (!students[lessonId]) {
    const total = document.querySelectorAll(`.task[data-lesson-id="${lessonId}"]`).length;
    students[lessonId] = { completedTasks: 0, totalTasks: total };
  } else {
    students[lessonId].totalTasks += 1;
  }

  localStorage.setItem(`student_${email}`, JSON.stringify(students));

  updateCourseProgress();
  updateLessonProgress();

  // Плавна поява
  newTask.style.opacity = 0;
  newTask.style.transition = "opacity 0.5s ease";
  setTimeout(() => { newTask.style.opacity = 1; }, 50);
}









// ПІДКАЗКА

function toggleHint(btn) {
  const hint = btn.closest(".task").querySelector(".hint");
  hint.style.display = hint.style.display === "none" ? "block" : "none";
}


// ІНІЦІАЛІЗАЦІЯ КУРСУ
function initCourse() {
  const current = getCurrentStudent();
  const contentEl = document.getElementById("content");

  if (!current) {
    contentEl.innerHTML = "<h2>Будь ласка, увійдіть для початку курсу.</h2>";
    return;
  }

  // будуємо список уроків і прогрес
  buildLessonsList();
  updateCourseProgress();

    const lastLesson = getLastLesson(current);
  if (lastLesson) {
    loadLesson(lastLesson);
  }
}

  // Виклик після завантаження DOM
document.addEventListener("DOMContentLoaded", () => {
  initCourse();
});
