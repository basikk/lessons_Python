// Масив шаблонів додаткових завдань для уроків
// Ключ — id уроку, значення — масив завдань

const extraTaskTemplates = {
   "lesson1": [
    {
      title: "Подвоїти число",
      description: "Введіть число, виведіть його подвоєним",
      code: "x = int(input())\nprint(x*2)",
      hint: "Скористайтеся операцією множення * 2",
      tests: [
        { input: ["2"], expected: "4" },
        { input: ["5"], expected: "10" }
      ]
    },
    {
      title: "Триплікувати число",
      description: "Введіть число, виведіть його потрійним",
      code: "x = int(input())\nprint(x*3)",
      hint: "Скористайтеся операцією множення * 3",
      tests: [
        { input: ["2"], expected: "6" },
        { input: ["4"], expected: "12" }
      ]
    }
  ],
    "lesson2": [
    {
      title: "Подвоїти число",
      description: "Введіть число, виведіть його подвоєним",
      code: "x = int(input())\nprint(x*2)",
      hint: "Скористайтеся операцією множення * 2",
      tests: [
        { input: ["2"], expected: "4" },
        { input: ["5"], expected: "10" }
      ]
    },
    {
      title: "Триплікувати число",
      description: "Введіть число, виведіть його потрійним",
      code: "x = int(input())\nprint(x*3)",
      hint: "Скористайтеся операцією множення * 3",
      tests: [
        { input: ["2"], expected: "6" },
        { input: ["4"], expected: "12" }
      ]
    }
  ],
  "lesson3": [
    {
      title: "Перевірка парності",
      description: "Введіть число, виведіть 'Парне' або 'Непарне'",
      code: "x = int(input())\nprint('Парне' if x%2==0 else 'Непарне')",
      hint: "Залишок від ділення на 2 покаже парність числа",
      tests: [
        { input: ["2"], expected: "Парне" },
        { input: ["3"], expected: "Непарне" }
      ]
    }
  ]



  
};
