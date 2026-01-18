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
      setTimeout(() => {
        content.style.opacity = 1;
      }, 50); // плавне відображення
      saveLastLesson(lessonId);
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

  const lastLesson = getLastLesson(current);
  if (lastLesson) {
    loadLesson(lastLesson);
  }
}

  // Виклик після завантаження DOM
document.addEventListener("DOMContentLoaded", () => {
  initCourse();
});
