// ================================
// course.js — логіка курсу Python 9 клас
// Працює з GitHub Pages + Pyodide
// ================================

/* ------------------------------
   ДАНІ ПРО КУРС
-------------------------------- */



const courseData = [
  {topic:"Основи Python", lessons:[
      {id:"lesson1", title:"Змінні та типи даних"}
      
  ]},
  {topic:"Основні алгоритмичні структури", lessons:[
      {id:"lesson2", title:"Лінійні алгоритми"},
      {id:"lesson3", title:"Алгоритми розгалужень"},
      {id:"lesson4", title:"Цикли"},
      {id:"lesson5", title:"Списки"},
      {id:"lesson6", title:"Робота з фінкціями"}
     
  ]}
];




/* ------------------------------
   ЛОГІН УЧНЯ
-------------------------------- */

function loginStudent() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  if (!email) {
    alert("Введіть email!");
    return;
  }

  localStorage.setItem("currentStudent", email);

  if (!localStorage.getItem(`student_${email}`)) {
    localStorage.setItem(`student_${email}`, JSON.stringify({}));
  }

  location.reload();
}

function getCurrentStudent() {
  return localStorage.getItem("currentStudent");
}

const current = getCurrentStudent();

if (!current) {
  document.getElementById("content").innerHTML =
    "<h2>Будь ласка, увійдіть для початку курсу.</h2>";
}

/* ------------------------------
   ПОБУДОВА СПИСКУ УРОКІВ + ПРОГРЕС
-------------------------------- */

function buildLessonsList() {
  const studentData =
    JSON.parse(localStorage.getItem(`student_${current}`)) || {};

  let totalTasks = 0;
  let completedTasks = 0;

  courseData.forEach(topic =>
    topic.lessons.forEach(l => {
      const p = studentData[l.id];
      totalTasks += p ? p.totalTasks : 1;
      completedTasks += p ? p.completedTasks : 0;
    })
  );

  const percent = Math.round((completedTasks / totalTasks) * 100);
  const progressEl = document.getElementById("course-progress");
  progressEl.style.width = percent + "%";
  progressEl.textContent = percent + "%";

  const lessonsList = document.getElementById("lessons-list");

  courseData.forEach(topic => {
    const div = document.createElement("div");
    div.className = "lesson-topic";

    const h3 = document.createElement("h3");
    h3.textContent = topic.topic;
    h3.onclick = () => {
      const ol = div.querySelector("ol");
      ol.style.display = ol.style.display === "none" ? "block" : "none";
    };

    div.appendChild(h3);

    const ol = document.createElement("ol");

    topic.lessons.forEach(lesson => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.textContent = lesson.title;

      const flat = courseData.flatMap(t => t.lessons);
      const index = flat.findIndex(l => l.id === lesson.id);

      let unlocked = true;
      if (index > 0) {
        const prevId = flat[index - 1].id;
        const prev = studentData[prevId];
        unlocked = prev && prev.completedTasks === prev.totalTasks;
      }

      if (!unlocked) {
        li.className = "locked";
      } else {
        a.href = "#";
        a.onclick = e => {
          e.preventDefault();
          loadLesson(lesson.id);
        };
      }

      li.appendChild(a);
      ol.appendChild(li);
    });

    div.appendChild(ol);
    lessonsList.appendChild(div);
  });
}

if (current) buildLessonsList();

/* ------------------------------
   ЗАВАНТАЖЕННЯ УРОКУ
-------------------------------- */

function loadLesson(lessonId){
    fetch(`lessons/${lessonId}.html`)
        .then(r=>r.text())
        .then(html=>{
            const contentEl = document.getElementById("content");
            contentEl.innerHTML = html;
            contentEl.classList.remove('fade-in');
            void contentEl.offsetWidth; // тригер перезапуску анімації
            contentEl.classList.add('fade-in');
        })
        .catch(()=>{
            document.getElementById("content").innerHTML="<p>Помилка завантаження уроку</p>";
        });
}

/* ------------------------------
   PYODIDE
-------------------------------- */

let pyodideReady = false;

async function initPy() {
  if (!pyodideReady) {
    window.pyodide = await loadPyodide();
    pyodideReady = true;
  }
}

/* ------------------------------
   ЗАПУСК КОДУ УЧНЯ
-------------------------------- */

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
   ПЕРЕВІРКА РІШЕННЯ
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

  // ✅ Усі тести пройдено
  output.textContent = "✅ Усі тести пройдено!";

  // ==============================
  // Оновлюємо localStorage для поточного учня
  // ==============================
  const email = getCurrentStudent();
  if (!email) return; // без логіну нічого не робимо
  const students = JSON.parse(localStorage.getItem(`student_${email}`)) || {};

  // Кількість завдань для уроку = кількість тестів
  students[task.dataset.lessonId] = {
    completedTasks: tests.length,
    totalTasks: tests.length
  };
  localStorage.setItem(`student_${email}`, JSON.stringify(students));

  // ==============================
  // Додаємо клас completed до завдання
  // ==============================
  task.classList.add("completed");
  task.style.transition = "background-color 0.5s ease";

  // ==============================
  // Додаємо зелений клас до уроку у лівій колонці, якщо всі завдання завершено
  // ==============================
  const lessonId = task.dataset.lessonId;
  const lessonLink = document.querySelector(`#lessons-list a[href="#"][onclick*="${lessonId}"]`);
  if (lessonLink) {
    lessonLink.classList.add("completed-lesson"); // додаємо клас для зеленої галочки
  }

  // ==============================
  // Оновлюємо загальний прогрес
  // ==============================
  updateCourseProgress();
}




/* ------------------------------
   ПІДКАЗКА
-------------------------------- */

function toggleHint(btn) {
  const hint = btn.closest(".task").querySelector(".hint");
  hint.style.display = hint.style.display === "none" ? "block" : "none";
}
