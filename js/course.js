// ================================
// course.js — логіка курсу Python 9 клас
// Сумісний з GitHub Pages + Pyodide
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

/* ------------------------------
   СПИСОК УРОКІВ
-------------------------------- */
function buildLessonsList() {
  const email = localStorage.getItem('currentUserEmail');
  const studentData = JSON.parse(localStorage.getItem(`student_${email}`) || '{}');
  const completed = studentData.completed || [];
  const listEl = document.getElementById('lessons-list');
  listEl.innerHTML = ''; // очищаємо попередній список

  courseData.forEach((topic, i) => {
    // Створюємо елемент теми
    const topicItem = document.createElement('li');
    topicItem.classList.add('topic');
    topicItem.textContent = (i+1) + '. ' + topic.title;
    
    // Створюємо контейнер для уроків цієї теми
    const lessonsUl = document.createElement('ul');
    lessonsUl.classList.add('lessons');
    lessonsUl.style.display = 'none';
    
    topic.lessons.forEach((lesson, j) => {
      const lessonItem = document.createElement('li');
      lessonItem.classList.add('lesson');
      
      // Додаємо клас completed-lesson, якщо урок пройдений
      const lessonId = topic.id + '-' + lesson.id; 
      if (completed.includes(lessonId)) {
        lessonItem.classList.add('completed-lesson');
      }
      // Блокуємо урок, якщо попередні не пройдені
      const lastDoneIndex = Math.max(
        ...completed
          .filter(id => id.startsWith(topic.id))
          .map(id => parseInt(id.split('-')[1]))
      );
      if (j > lastDoneIndex) {
        lessonItem.classList.add('locked');
      }

      // Формуємо вміст: номер і назва уроку (посилання доступне, якщо не locked)
      const lessonLabel = document.createElement('a');
      lessonLabel.textContent = (j+1) + '. ' + lesson.title;
      if (!lessonItem.classList.contains('locked')) {
        lessonLabel.href = lesson.url;
      }
      lessonItem.appendChild(lessonLabel);
      lessonsUl.appendChild(lessonItem);
    });

    listEl.appendChild(topicItem);
    listEl.appendChild(lessonsUl);
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
      setTimeout(() => {
        content.style.opacity = 1;
      }, 50); // плавне відображення
    })
    .catch(() => {
      document.getElementById("content").innerHTML =
        "<p>Помилка завантаження уроку</p>";
    });
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

// -------------------------------
// ЗАПУСК КОДУ УЧНЯ
// -------------------------------
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

/* ------------------------------
   ПЕРЕВІРКА КОДУ
-------------------------------- */
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

  const email = getCurrentStudent();
  if (!email) return;

  const students = JSON.parse(localStorage.getItem(`student_${email}`)) || {};
  students[task.dataset.lessonId] = {
    completedTasks: tests.length,
    totalTasks: tests.length
  };
  localStorage.setItem(`student_${email}`, JSON.stringify(students));

  // Підсвічуємо завдання плавно
  task.classList.add("completed");
  task.style.transition = "background-color 0.5s ease";

  // Додаємо зелений чек для уроку у лівій колонці
  const lessonId = task.dataset.lessonId;
  const lessonLink = document.querySelector(`#lessons-list a[href="#"][onclick*="${lessonId}"]`);
  if (lessonLink) lessonLink.classList.add("completed-lesson");

  // Оновлюємо прогрес-бар
  updateCourseProgress();
}


// -------------------------------
// ПІДКАЗКА
// -------------------------------
function toggleHint(btn) {
  const hint = btn.closest(".task").querySelector(".hint");
  hint.style.display = hint.style.display === "none" ? "block" : "none";
}

  // -------------------------------
// ІНІЦІАЛІЗАЦІЯ КУРСУ
// -------------------------------
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
}

  // Виклик після завантаження DOM
document.addEventListener("DOMContentLoaded", () => {
  initCourse();
});
