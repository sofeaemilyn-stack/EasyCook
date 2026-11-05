// planner.js - Meal Plan page: Create, Read, Update, Delete

var planForm = document.getElementById("planForm");
var formMsg = document.getElementById("formMsg");
var listMsg = document.getElementById("listMsg");
var planList = document.getElementById("planList");
var sugList = document.getElementById("sugList");
var filterDay = document.getElementById("filterDay");

// READ: show the saved meals
function showPlan() {
  var plan = loadData(PLAN_KEY);
  var html = "";
  var count = 0;

  for (var i = 0; i < plan.length; i++) {
    // Only show meals for the chosen day (or all days)
    if (filterDay.value == "All" || filterDay.value == plan[i].day) {
      count++;
      html += "<div class='plan-item'>";
      html += "<div class='plan-info'>";
      html += "<h3>" + plan[i].name + "</h3>";
      html += "<p>" + plan[i].day + " - " + plan[i].mealType + " - " + plan[i].servings + " servings</p>";
      if (plan[i].notes != "") {
        html += "<p class='hint'>Notes: " + plan[i].notes + "</p>";
      }
      html += "</div>";
      html += "<div class='plan-actions'>";
      html += "<button class='secondary' onclick='editMeal(" + plan[i].id + ")'>Edit</button>";
      html += "<button class='danger' onclick='deleteMeal(" + plan[i].id + ")'>Delete</button>";
      html += "</div></div>";
    }
  }

  planList.innerHTML = html;
  if (count == 0) {
    showMessage(listMsg, "No meals to show. Add a meal using the form or the Recipe Finder.", "info");
  } else {
    listMsg.hidden = true;
  }
}

// Show the saved suggestions
function showSuggestions() {
  var history = loadData(SUGGEST_KEY);
  if (history.length == 0) {
    sugList.innerHTML = "<p class='hint'>No suggestions yet. Try the Recipe Finder page.</p>";
    return;
  }
  var html = "";
  for (var i = 0; i < history.length; i++) {
    html += "<div class='sug-item'><strong>" + history[i].name + "</strong><br>";
    html += "<span class='hint'>" + history[i].reason + " (" + history[i].date + ")</span></div>";
  }
  sugList.innerHTML = html;
}

// CREATE and UPDATE: runs when the form is saved
function saveMeal(event) {
  event.preventDefault(); // stop the page from reloading

  var id = document.getElementById("planId").value;
  var name = document.getElementById("mealName").value.trim();
  var servings = Number(document.getElementById("mealServings").value);

  // Input validation
  if (name == "") {
    showMessage(formMsg, "Meal name is required.", "error");
    return;
  }
  if (Number.isInteger(servings) == false || servings < 1 || servings > 50) {
    showMessage(formMsg, "Servings must be a whole number from 1 to 50.", "error");
    return;
  }

  var plan = loadData(PLAN_KEY);

  if (id == "") {
    // CREATE: add a new meal
    var newMeal = {
      id: Date.now(),
      name: name,
      category: "",
      day: document.getElementById("mealDay").value,
      mealType: document.getElementById("mealType").value,
      servings: servings,
      notes: document.getElementById("mealNotes").value.trim()
    };
    plan.push(newMeal);
    showMessage(formMsg, "Meal added to your plan.", "success");
  } else {
    // UPDATE: find the meal and change its values
    for (var i = 0; i < plan.length; i++) {
      if (plan[i].id == id) {
        plan[i].name = name;
        plan[i].day = document.getElementById("mealDay").value;
        plan[i].mealType = document.getElementById("mealType").value;
        plan[i].servings = servings;
        plan[i].notes = document.getElementById("mealNotes").value.trim();
      }
    }
    showMessage(formMsg, "Meal updated.", "success");
  }

  saveData(PLAN_KEY, plan);
  clearForm();
  showPlan();
}

// Put a meal into the form so the user can edit it
function editMeal(id) {
  var plan = loadData(PLAN_KEY);
  for (var i = 0; i < plan.length; i++) {
    if (plan[i].id == id) {
      document.getElementById("planId").value = plan[i].id;
      document.getElementById("mealName").value = plan[i].name;
      document.getElementById("mealDay").value = plan[i].day;
      document.getElementById("mealType").value = plan[i].mealType;
      document.getElementById("mealServings").value = plan[i].servings;
      document.getElementById("mealNotes").value = plan[i].notes;
      document.getElementById("formTitle").innerText = "Edit meal";
      document.getElementById("saveBtn").innerText = "Update meal";
      document.getElementById("cancelBtn").hidden = false;
      formMsg.hidden = true;
    }
  }
}

// DELETE: remove a meal
function deleteMeal(id) {
  var sure = confirm("Delete this meal?");
  if (sure == false) {
    return;
  }
  var plan = loadData(PLAN_KEY);
  var newPlan = [];
  for (var i = 0; i < plan.length; i++) {
    if (plan[i].id != id) {
      newPlan.push(plan[i]); // keep every meal except the deleted one
    }
  }
  saveData(PLAN_KEY, newPlan);
  showPlan();
}

// Empty the form and go back to "Add" mode
function clearForm() {
  planForm.reset();
  document.getElementById("planId").value = "";
  document.getElementById("formTitle").innerText = "Add a meal";
  document.getElementById("saveBtn").innerText = "Save meal";
  document.getElementById("cancelBtn").hidden = true;
}

// Remove all saved suggestions
function clearSuggestions() {
  saveData(SUGGEST_KEY, []);
  showSuggestions();
}

// EVENT HANDLING
planForm.addEventListener("submit", saveMeal);
document.getElementById("cancelBtn").addEventListener("click", function () {
  clearForm();
  formMsg.hidden = true;
});
filterDay.addEventListener("change", showPlan);
document.getElementById("clearSugBtn").addEventListener("click", clearSuggestions);

// Start: show the saved data
showPlan();
showSuggestions();

