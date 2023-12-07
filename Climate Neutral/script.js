import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";

const auth = getAuth();

let categoriesCount = 0;
let scenariosCount = 0;
let categories = [];
let scenarios = [];
let values = [];
let categoryWiseData = {}
let totalDimensionlessScores;

function camelCase(str) {
  // Using replace method with regEx
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index == 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
}

const addCategoriesBtn = document.getElementById("addCategoriesBtn");
const addNewCategoryBtn = document.getElementById("addNewCategoryBtn");
const editCategoriesBtn = document.getElementById("editCategoriesBtn");
// const saveCategoriesBtn = document.getElementById("saveCategoriesBtn");
const categoriesModal = document.getElementById("categoriesModal");
const categoriesForm = document.getElementById("categoriesForm");
const categoryTemplate = document.getElementById("singleCategory");

const addScenariosBtn = document.getElementById("addScenariosBtn");
const addNewScenarioBtn = document.getElementById("addNewScenarioBtn");
// const closeScenarioModalBtn = document.getElementById("closeScenarioModalBtn");
// const saveScenariosBtn = document.getElementById("saveScenariosBtn");
const scenariosModal = document.getElementById("scenariosModal");
const scenariosForm = document.getElementById("scenariosForm");
const scenarioTemplate = document.getElementById("singleScenario");

const addValuesBtn = document.getElementById("addValuesBtn");
const descriptiveInputTemplate = document.getElementById("descriptiveInput");
const valuesTable = document.getElementById("valuesTable");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const modalDialog = document.getElementById("modalDialog");
const closeModalBtn = document.getElementById("closeModalBtn");

const loadFromLS = document.getElementById("loadFromLS");
const saveToLS = document.getElementById("saveToLS");
const exportData = document.getElementById("export");

const valuesForm = document.getElementById("valuesForm");
const plotType = document.getElementById("plotType");

const uploadBtn = document.getElementById("upload")

createCategory();
createCategory();
createCategory();
createScenario();
createScenario();

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Signed out successfully");
    })
    .catch((error) => {
      alert("Error while signing out: " + error.message);
    });
});

addNewCategoryBtn.addEventListener("click", () => createCategory());
addNewScenarioBtn.addEventListener("click", () => createScenario());

plotType.addEventListener("change", (e) => {
  const type = e.target.value;
  generatePlot(type);
});

loadFromLS.addEventListener("click", () => {

  categories = JSON.parse(localStorage.getItem("categories"));
  scenarios = JSON.parse(localStorage.getItem("scenarios"));
  categoryWiseData = JSON.parse(localStorage.getItem("data"))
  if(!categories || !scenarios || !categoryWiseData){
    alert("You haven't saved any data yet")
  }
  else{
    if (
      !confirm(
        "This is override your currently entered data. Are you sure you want to continue?"
      )
    )
      return;
  scenariosCount = 0;
  categoriesCount = 0;

  categoriesForm.querySelectorAll("fieldset").forEach((f) => f.remove());
  categories.map((category) => createCategory(category));
  scenariosForm.querySelectorAll("fieldset").forEach((f) => f.remove());
  scenarios.map((scenario) => createScenario(scenario));

  if(categoryWiseData){
    addValuesBtn.click()
    Object.entries(categoryWiseData).forEach(([key, value]) => {
      const element = document.getElementById(key);
      console.log(element)
            if (element) {
        element.value = value;
      }
    });
  }
}

});

saveToLS.addEventListener("click", () => {
  localStorage.clear()
  localStorage.setItem("categories", JSON.stringify(categories));
  localStorage.setItem("scenarios", JSON.stringify(scenarios));
  const formData = new FormData(valuesForm);
  const formObject = Object.fromEntries(formData);
  localStorage.setItem("data", JSON.stringify(formObject))
  alert("Saved to local storage succesfully")
});

exportData.addEventListener("click", () => {

  localStorage.clear()
  localStorage.setItem("categories", JSON.stringify(categories));
  localStorage.setItem("scenarios", JSON.stringify(scenarios));
  const formData = new FormData(valuesForm);
  const formObject = Object.fromEntries(formData);
  localStorage.setItem("data", JSON.stringify(formObject))

  const dataToSave = {
    categories: categories,
    scenarios: scenarios,
    categoryScenario: formObject
  };

  const jsonData = JSON.stringify(dataToSave);

  const blob = new Blob([jsonData], { type: "application/json" });

  const downloadLink = document.createElement("a");
  downloadLink.href = window.URL.createObjectURL(blob);
  downloadLink.download = "data.json";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
});


addCategoriesBtn.addEventListener("click", () => {
  modalDialog.showModal();
});

closeModalBtn.addEventListener("click", handleCloseModal);

function handleCloseModal() {
  modalDialog.close();
  updateStep(1, 0);
}

categoriesForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  var object = [];
  let currentObject = {};

  formData.forEach(function (value, key) {
    if (key.startsWith("categoryName")) {
      object.push(currentObject);
      currentObject = {};
    }
    currentObject[key.slice(0, -1)] = value;
  });

  object.push(currentObject);

  object.shift();

  categories = object;
  localStorage.setItem("categories", JSON.stringify(categories));
  updateStep();
});

scenariosForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const object = Object.fromEntries(formData);

  const _scenarios = Object.values(object).map((scenario) => ({
    name: scenario,
    categories: [],
  }));

  scenarios = _scenarios;
  localStorage.setItem("scenarios", JSON.stringify(scenarios));
  addValuesBtn.click();
  handleCloseModal();
});

addValuesBtn.addEventListener("click", (e) => {
  addValues(scenarios, categories)
});

valuesForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const formObject = Object.fromEntries(formData);
  console.log(formObject)
  localStorage.setItem("data", JSON.stringify(formObject))

  categories = JSON.parse(localStorage.getItem("categories"));
  scenarios = JSON.parse(localStorage.getItem("scenarios"));

  const _categories = categories.map(
    (categoryObject) => categoryObject.categoryName
  );

  values = formObject;

  Object.entries(formObject).forEach(([key, value]) => {
    const [category, scenario] = key.split("@@");
    scenarios = scenarios.map((_scenario) => {
      if (camelCase(_scenario.name) === scenario) {
        _scenario.categories = [
          ..._scenario.categories,
          { name: category, value },
        ];
      }
      return _scenario;
    });
  });

  const categoryWiseData = _categories.reduce(
    (acc, category) => ({
      ...acc,
      [camelCase(category)]: [],
    }),
    {}
  );

  scenarios.forEach((scenario) => {
    scenario.categories.forEach((category) => {
      categoryWiseData[category.name] = [
        ...categoryWiseData[category.name],
        +category.value,
      ];
    });
  });
  console.log(scenarios)

  const dimensionlessScores = Object.entries(categoryWiseData).map(
    ([category, values]) => {
      let { weight, optimizationDir } = categories.find(
        (cat) => camelCase(cat.categoryName) === category
      );

      weight = +weight;
      optimizationDir = +optimizationDir;

      const categoryMin =
        optimizationDir === "up" ? Math.min(...values) : Math.max(...values);
      const categoryMax =
        optimizationDir === "up" ? Math.max(...values) : Math.min(...values);

      const dimensionlessScore = values.map(
        (value) =>
          ((value - categoryMin) / (categoryMax - categoryMin)) * weight
      );
      return dimensionlessScore;
    }
  );

  totalDimensionlessScores = dimensionlessScores[0]
    .map((col, i) => dimensionlessScores.map((row) => row[i]))
    .map((scores) => scores.reduce((sum, score) => sum + score, 0));
     
    var temp = new Set(totalDimensionlessScores)
    totalDimensionlessScores = Array.from(temp)

    const maxScore = Math.max(...totalDimensionlessScores)
    const recommended = scenarios[totalDimensionlessScores.indexOf(maxScore)].name
    console.log(maxScore, recommended)
    document.querySelector(".recommended").innerHTML = "Your recomended scenario is " + recommended

  document.querySelector(".plotContainer").classList.remove("hidden");
  document.querySelector("#export").classList.remove("hidden");
  generatePlot();
});

function generatePlot(type = "bar") {
  let data;

  if (type === "bar") {
    data = [
      {
        x: scenarios.map((scenario) => scenario.name),
        y: totalDimensionlessScores,
        type,
      },
    ];
  } else if (type === "pie") {
    data = [
      {
        values: totalDimensionlessScores,
        labels: scenarios.map((scenario) => scenario.name),
        type: "pie",
      },
    ];
  }

  Plotly.newPlot("valuePlot", data);
  document.querySelector("#valuePlot").scrollIntoView({
    behavior: "smooth",
  });
}

function createCategory(value) {
  categoriesCount++;
  const newCategory = categoryTemplate.content.cloneNode(true);

  if (value) {
    newCategory.querySelector("#categoryName").value = value.categoryName;
    newCategory.querySelector("#scoringType").value = value.scoringType;
    newCategory.querySelector("#weight").value = value.weight;
    newCategory.querySelector("#optimizationDir").value = value.optimizationDir;
  }

  newCategory.querySelector("legend").innerText += " " + categoriesCount;
  newCategory.querySelector("#categoryName").name += categoriesCount;
  newCategory.querySelector("#categoryName").id += categoriesCount;
  newCategory.querySelector("[for=categoryName]").htmlFor += categoriesCount;
  newCategory.querySelector("#scoringType").name += categoriesCount;
  newCategory.querySelector("#scoringType").id += categoriesCount;
  newCategory.querySelector("[for=scoringType]").htmlFor += categoriesCount;
  newCategory.querySelector("#weight").name += categoriesCount;
  newCategory.querySelector("#weight").id += categoriesCount;
  newCategory.querySelector("[for=weight]").htmlFor += categoriesCount;
  newCategory.querySelector("#optimizationDir").name += categoriesCount;
  newCategory.querySelector("#optimizationDir").id += categoriesCount;
  newCategory.querySelector("[for=optimizationDir]").htmlFor += categoriesCount;

  newCategory
    .getElementById("deleteCategoryBtn")
    .addEventListener("click", deleteCategory);

  categoriesForm.insertBefore(
    newCategory,
    categoriesForm.querySelector(".footer")
  );
}

function deleteCategory(event) {
  if (categoriesCount < 3) return alert("Need atleast 3 category");
  const categoryFieldset = event.target.closest(".category-inputs");

  categoriesForm.removeChild(categoryFieldset);
  categoriesCount--;
}

function createScenario(value) {
  scenariosCount++;
  const newScenario = scenarioTemplate.content.cloneNode(true);
  if (value) {
    newScenario.querySelector("#scenarioName").value = value.name;
  }
  newScenario.querySelector("legend").innerText += " " + scenariosCount;
  newScenario.querySelector("#scenarioName").name += scenariosCount;
  newScenario.querySelector("#scenarioName").id += scenariosCount;
  newScenario.querySelector("[for=scenarioName]").htmlFor += scenariosCount;

  newScenario
    .getElementById("deleteScenarioBtn")
    .addEventListener("click", deleteScenario);

  scenariosForm.insertBefore(
    newScenario,
    scenariosForm.querySelector(".footer")
  );
}

function deleteScenario(event) {
  if (scenariosCount < 3) return alert("Need atleast 2 scenarios");
  const scenarioFieldset = event.target.closest(".scenario-inputs");

  categoriesForm.removeChild(scenarioFieldset);
  scenariosCount--;
}

const stepper = document.querySelector(".stepper");
let currentStep = 0;

const updateStep = (delta = 1, step) => {
  if (isFinite(step)) {
    currentStep = step;
    return stepper.style.setProperty("--x", step);
  }
  modalDialog.scrollTo({ top: 0, behavior: "smooth" });
  currentStep += delta;
  stepper.style.setProperty("--x", currentStep);
};

addScenariosBtn.addEventListener("click", () => updateStep());
editCategoriesBtn.addEventListener("click", () => updateStep(-1));

uploadBtn.addEventListener("click", () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function(event) {
  var file = event.target.files[0];
  console.log(file)
  if (file) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var content = event.target.result;
      try {
        var jsonData = JSON.parse(content);
        localStorage.setItem("categories", JSON.stringify(jsonData.categories));
        localStorage.setItem("scenarios", JSON.stringify(jsonData.scenarios));

        categoriesForm.querySelectorAll("fieldset").forEach((f) => f.remove());
        jsonData.categories.map((category) => createCategory(category));
        scenariosForm.querySelectorAll("fieldset").forEach((f) => f.remove());
        jsonData.scenarios.map((scenario) => createScenario(scenario));
        addValues(jsonData.scenarios, jsonData.categories)
        if(jsonData.categoryScenario){
          localStorage.setItem("data", JSON.stringify(jsonData.categoryScenario))
        Object.entries(jsonData.categoryScenario).forEach(([key, value]) => {
          const element = document.getElementById(key);
          if (element) {
            element.value = value;
          }
        });
      }
        // Use jsonData as needed
        console.log('Parsed JSON:', jsonData);
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    }
    reader.readAsText(file);
  }
})

function addValues (scenarios, categories) {
  if (!scenarios || !categories)
    return alert("Please enter categories and scenarios!");

  valuesTable.innerHTML = "";
  document.querySelector(".tableContainer").classList.remove("hidden");

  const headerRow = document.createElement("tr");
  headerRow.classList.add("header_row");
  const firstCell = document.createElement("th");
  // firstCell.innerText = "Scenario";
  headerRow.appendChild(firstCell);

  for (let category of categories) {
    const headerCell = document.createElement("th");
    headerCell.innerText = category.categoryName;
    headerRow.appendChild(headerCell);
  }

  valuesTable.appendChild(headerRow);

  for (let scenario of Object.values(scenarios)) {
    const row = document.createElement("tr");
    const scenarioCell = document.createElement("td");
    scenarioCell.innerText = scenario.name;
    row.appendChild(scenarioCell);

    for (let i = 0; i < categories.length; i++) {
      const valueCell = document.createElement("td");
      let valueInput;

      if (categories[i].scoringType === "numeric") {
        valueInput = document.createElement("input");
        valueInput.setAttribute("type", "number");
        valueInput.setAttribute(
          "name",
          camelCase(categories[i].categoryName) +
            "@@" +
            camelCase(scenario.name)
        );
        valueInput.setAttribute(
          "id",
          camelCase(categories[i].categoryName) +
            "@@" +
            camelCase(scenario.name)
        );
      } else if (categories[i].scoringType === "descriptive") {
        valueInput =
          descriptiveInputTemplate.content.cloneNode(true).children[0];
        valueInput
          .querySelector("select")
          .setAttribute(
            "name",
            camelCase(categories[i].categoryName) +
              "@@" +
              camelCase(scenario.name)
          );
          valueInput
          .querySelector("select")
          .setAttribute(
            "id",
            camelCase(categories[i].categoryName) +
              "@@" +
              camelCase(scenario.name)
          );
      }

      valueCell.appendChild(valueInput);
      row.appendChild(valueCell);
    }

    valuesTable.appendChild(row);
  }

  valuesTable.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}