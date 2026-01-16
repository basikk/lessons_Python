const courseData = [
    {topic:"Основи Python", lessons:[
        {id:"lesson1", title:"Змінні та типи даних"},
        {id:"lesson2", title:"Лінійні алгоритми"}
    ]},
    {topic:"Алгоритми розгалужень", lessons:[
        {id:"lesson3", title:"Алгоритми розгалужень"}
    ]}
];

function loginStudent(){
    const email = document.getElementById("email").value.trim().toLowerCase();
    if(!email){ alert("Введіть email!"); return; }
    localStorage.setItem("currentStudent", email);
    if(!localStorage.getItem(`student_${email}`)){
        localStorage.setItem(`student_${email}`, JSON.stringify({}));
    }
    location.reload();
}

function getCurrentStudent(){ return localStorage.getItem("currentStudent"); }
const current = getCurrentStudent();
if(!current){
    document.getElementById('content').innerHTML="<h2>Будь ласка, увійдіть для початку курсу.</h2>";
}

function buildLessonsList(){
    const studentData = JSON.parse(localStorage.getItem(`student_${current}`)) || {};
    let totalTasks=0, completedTasks=0;
    courseData.forEach(topic=>topic.lessons.forEach(l=>{
        const p=studentData[l.id];
        totalTasks+=p?p.totalTasks:1;
        completedTasks+=p?p.completedTasks:0;
    }));
    const percent=Math.round((completedTasks/totalTasks)*100);
    const progressEl=document.getElementById("course-progress");
    progressEl.style.width=percent+"%";
    progressEl.textContent=percent+"%";

    const lessonsList=document.getElementById("lessons-list");
    courseData.forEach(topic=>{
        const div=document.createElement("div");
        div.className="lesson-topic";
        const h3=document.createElement("h3");
        h3.textContent=topic.topic;
        h3.onclick=()=>{ div.querySelector("ol").style.display = div.querySelector("ol").style.display==="none"?"block":"none"; };
        div.appendChild(h3);

        const ol=document.createElement("ol");
        topic.lessons.forEach((lesson,index)=>{
            const li=document.createElement("li");
            const a=document.createElement("a");
            a.textContent=lesson.title;
            const flatLessons=courseData.flatMap(t=>t.lessons);
            const prevIndex=flatLessons.findIndex(l=>l.id===lesson.id)-1;
            let unlocked=true;
            if(prevIndex>=0){
                const prevLessonId=flatLessons[prevIndex].id;
                unlocked=studentData[prevLessonId] && studentData[prevLessonId].completedTasks===studentData[prevLessonId].totalTasks;
            }
            if(!unlocked){ li.className="locked"; } 
            else { a.href=`lessons/${lesson.id}.html`; }
            li.appendChild(a);
            ol.appendChild(li);
        });
        div.appendChild(ol);
        lessonsList.appendChild(div);
    });
}

if(current) buildLessonsList();

let pyodideReady=false;
async function initPy(){ if(!pyodideReady){ window.pyodide=await loadPyodide(); pyodideReady=true; } }
async function runStudentCode(task){
    await initPy();
    const code=task.querySelector("textarea").value;
    const inputs=task.querySelectorAll(".user-input");
    let index=0;
    pyodide.globals.set("input",()=>inputs[index++].value);
    pyodide.runPython(`import sys; from io import StringIO; sys.stdout=StringIO()`);
    try{ await pyodide.runPythonAsync(code); const res=pyodide.runPython("sys.stdout.getvalue()"); task.querySelector(".output").textContent=res||"(немає виводу)"; }
    catch(e){ task.querySelector(".output").textContent=e; }
}

async function checkStudentCode(task){
    await initPy();
    const code=task.querySelector("textarea").value;
    const tests=JSON.parse(task.dataset.tests);
    const out=task.querySelector(".output");
    for(let t of tests){
        const inputEls=task.querySelectorAll(".user-input");
        t.input.forEach((v,i)=>inputEls[i].value=v);
        let index=0;
        pyodide.globals.set("input",()=>inputEls[index++].value);
        pyodide.runPython(`import sys; from io import StringIO; sys.stdout=StringIO()`);
        try{
            await pyodide.runPythonAsync(code);
            const res=pyodide.runPython("sys.stdout.getvalue()").trim();
            if(res!==String(t.expected).trim()){ out.textContent=`❌ Ввід: ${t.input.join(", ")}. Очікується: ${t.expected}. Отримано: ${res}`; return; }
        }catch(e){ out.textContent=e; return; }
    }
    out.textContent="✅ Усі тести пройдено!";
    const email=getCurrentStudent();
    const students=JSON.parse(localStorage.getItem(`student_${email}`));
    students[task.dataset.lessonId]={completedTasks:tests.length,totalTasks:tests.length};
    localStorage.setItem(`student_${email}`,JSON.stringify(students));
}



function toggleHint(btn) {
  const hint = btn.closest(".task").querySelector(".hint");
  hint.style.display = hint.style.display === "none" ? "block" : "none";
}
