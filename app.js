// app.js - Recipe Finder page
// API used: TheMealDB (free, no key needed)

var API = "https://www.themealdb.com/api/json/v1/1/";

// Find the HTML elements we need
var searchInput = document.getElementById("searchInput");
var categorySelect = document.getElementById("categorySelect");
var ingredientInput = document.getElementById("ingredientInput");
var results = document.getElementById("results");
var resultsTitle = document.getElementById("resultsTitle");
var statusBox = document.getElementById("status");
var detail = document.getElementById("detail");

var currentMeal = null;     
var unitMode = "original";  
var currentFactor = 1;     


// Get data from the API. 
// Returns null if the request fails.
async function getData(endpoint) {
  try {
    var response = await fetch(API + endpoint);
    var data = await response.json(); 
    return data;
  } catch (error) {
    // Error handling: the request failed (for example no internet)
    showMessage(statusBox, "Cannot connect to the recipe service. Please check your internet.", "error");
    return null;
  }
}

// Fill the category dropdown when the app opens
async function loadCategories() {
  var data = await getData("list.php?c=list");
  if (data == null) {
    categorySelect.innerHTML = "<option value=''>Categories not available</option>";
    return;
  }
  categorySelect.innerHTML = "<option value=''>-- Choose a category --</option>";
  for (var i = 0; i < data.meals.length; i++) {
    var option = document.createElement("option"); 
    option.value = data.meals[i].strCategory;
    option.innerText = data.meals[i].strCategory;
    categorySelect.appendChild(option); 
  }
}

// Show recipes as picture cards
function showCards(meals, title) {
  statusBox.hidden = true;
  detail.hidden = true;
  results.hidden = false;
  resultsTitle.hidden = false;
  resultsTitle.innerText = title;

  // Error handling: empty results
  if (meals == null || meals.length == 0) {
    results.innerHTML = "";
    showMessage(statusBox, "No recipes found. Try another word, category or ingredient.", "info");
    return;
  }

  var html = "";
  for (var i = 0; i < meals.length; i++) {
    html += "<div class='card' onclick=\"showDetail('" + meals[i].idMeal + "')\">";
    html += "<img src='" + meals[i].strMealThumb + "/preview'>";
    html += "<h3>" + meals[i].strMeal + "</h3>";
    html += "</div>";
  }
  results.innerHTML = html;
}

// to search by recipe name
async function searchByName() {
  var word = searchInput.value.trim();
  // Error handling: invalid input
  if (word == "") {
    showMessage(statusBox, "Please type a recipe name.", "error");
    return;
  }
  var data = await getData("search.php?s=" + word);
  if (data != null) {
    showCards(data.meals, "Results for " + word);
  }
}

// Show all recipes in the chosen category
async function filterByCategory() {
  if (categorySelect.value == "") {
    return;
  }
  var data = await getData("filter.php?c=" + categorySelect.value);
  if (data != null) {
    showCards(data.meals, categorySelect.value + " recipes");
  }
}

// Show recipes that use the ingredient the user has
async function filterByIngredient() {
  var word = ingredientInput.value.trim();
  if (word == "") {
    showMessage(statusBox, "Please type an ingredient.", "error");
    return;
  }
  var apiWord = word.replaceAll(" ", "_");
  var data = await getData("filter.php?i=" + apiWord);
  if (data != null) {
    showCards(data.meals, "Recipes with " + word);
  }
}

// Get the ingredients of a meal as a list.
function getIngredients(meal) {
  var list = [];
  for (var i = 1; i <= 20; i++) {
    var name = meal["strIngredient" + i];
    var measure = meal["strMeasure" + i];
    if (name != null && name != "") {
      list.push({ name: name, measure: measure });
    }
  }
  return list;
}

// Show the full details of one recipe
async function showDetail(id) {
  var data = await getData("lookup.php?i=" + id);
  if (data == null || data.meals == null) {
    return;
  }
  currentMeal = data.meals[0];
  var ingredients = getIngredients(currentMeal);



  document.getElementById("mealImage").src = currentMeal.strMealThumb;
  document.getElementById("mealName").innerText = currentMeal.strMeal;
  document.getElementById("mealCategory").innerText = currentMeal.strCategory;
  document.getElementById("mealArea").innerText = currentMeal.strArea;
  document.getElementById("mealCount").innerText = ingredients.length;
  document.getElementById("instructions").innerText = currentMeal.strInstructions;
  document.getElementById("calcMsg").hidden = true;
  document.getElementById("calcResult").innerHTML = "";
  document.getElementById("planMsg").hidden = true;

  // Show the ingredient list in the original units
  currentFactor = 1;
  unitMode = "original";
  document.getElementById("unitSelect").value = "original";
  showIngredientList();

    //pop-up for recipe
  statusBox.hidden = true;
  detail.hidden = false;
  detail.scrollTop = 0; 
}

// Go back to the list of recipes
function goBack() {
  detail.hidden = true;
}

// UNIT CONVERTER: show all ingredients in grams or ounces 

function readNumber(text) {
  if (text.indexOf("/") != -1) {
    var parts = text.split("/");
    return Number(parts[0]) / Number(parts[1]);
  }
  return parseFloat(text);
}

function parseMeasure(measure) {
  var text = measure.trim();
  if (text == "") {
    return null;
  }
  var words = text.split(" ");
  var first = words[0];
  var number = 0;
  var rest = "";

  if (first.indexOf("/") != -1) {
    
    number = readNumber(first);
    rest = words.slice(1).join(" ");
  } else if (isNaN(parseFloat(first))) {
    return null; 
  } else {
    number = parseFloat(first);
    var attached = first.replace(String(number), ""); // "200g" gives "g"
    var next = 1;
  
    if (attached == "" && words.length > 1 && words[1].indexOf("/") != -1) {
      number = number + readNumber(words[1]);
      next = 2;
    }
    rest = (attached + " " + words.slice(next).join(" ")).trim();
  }
  return { number: number, rest: rest };
}

// Make unit names the same, e.g: "Cups" and "cup" both become "cup"
function cleanUnit(text) {
  var u = text.toLowerCase().replace(".", "").replace(",", "");
  if (u == "cup" || u == "cups") return "cup";
  if (u == "tbsp" || u == "tbs" || u == "tblsp" || u == "tablespoon" || u == "tablespoons") return "tbsp";
  if (u == "tsp" || u == "teaspoon" || u == "teaspoons") return "tsp";
  if (u == "g" || u == "gram" || u == "grams") return "g";
  if (u == "kg") return "kg";
  if (u == "oz" || u == "ounce" || u == "ounces") return "oz";
  if (u == "lb" || u == "lbs" || u == "pound" || u == "pounds") return "lb";
  if (u == "ml") return "ml";
  if (u == "l" || u == "litre" || u == "liter") return "l";
  return ""; 
}

// Grams in 1 cup of different ingredients 
function gramsPerCup(name) {
  var n = name.toLowerCase();
  if (n.indexOf("flour") != -1) return 125;
  if (n.indexOf("sugar") != -1) return 200;
  if (n.indexOf("butter") != -1) return 227;
  if (n.indexOf("rice") != -1) return 185;
  if (n.indexOf("oil") != -1) return 218;
  if (n.indexOf("honey") != -1) return 340;
  if (n.indexOf("salt") != -1) return 288;
  if (n.indexOf("milk") != -1 || n.indexOf("water") != -1 || n.indexOf("cream") != -1 ||
      n.indexOf("stock") != -1 || n.indexOf("juice") != -1) return 240;
  return 200; // guess that others is 200g
}

// Change an amount into grams. Returns null if we cannot convert it.
function toGrams(number, unit, name) {
  if (unit == "g") return number;
  if (unit == "kg") return number * 1000;
  if (unit == "oz") return number * 28.35;
  if (unit == "lb") return number * 453.6;
  if (unit == "ml") return number;    
  if (unit == "l") return number * 1000;
  if (unit == "cup") return number * gramsPerCup(name);
  if (unit == "tbsp") return number / 16 * gramsPerCup(name); // 16 tbsp = 1 cup
  if (unit == "tsp") return number / 48 * gramsPerCup(name);  // 48 tsp = 1 cup
  return null;
}

function formatMeasure(measure, name) {
  var parsed = parseMeasure(measure || "");
  if (parsed == null) {
    return measure || ""; 
  }
  var number = parsed.number * currentFactor;

  if (unitMode == "grams" || unitMode == "ounces") {
    var unit = cleanUnit(parsed.rest.split(" ")[0]);
    var grams = toGrams(number, unit, name);
    if (grams != null) {
      if (unitMode == "ounces") {
        return (Math.round(grams / 28.35 * 10) / 10) + " oz";
      }
      return Math.round(grams) + " g";
    }
  }
  // untuk unit that cannot be convert
  return (Math.round(number * 100) / 100) + " " + parsed.rest;
}

// Show the ingredient list using the chosen unit
function showIngredientList() {
  var ingredients = getIngredients(currentMeal);
  var html = "";
  for (var i = 0; i < ingredients.length; i++) {
    html += "<li>" + formatMeasure(ingredients[i].measure, ingredients[i].name) + " " + ingredients[i].name + "</li>";
  }
  document.getElementById("ingList").innerHTML = html;
}


// CALCULATION: new ingredient amounts and estimated cost
function calculate() {
  var calcMsg = document.getElementById("calcMsg");
  var servings = Number(document.getElementById("servInput").value);
  var cost = Number(document.getElementById("costInput").value);

  // Input 
  if (Number.isInteger(servings) == false || servings < 1 || servings > 50) {
    showMessage(calcMsg, "Servings must be a whole number from 1 to 50.", "error");
    return;
  }
  if (cost < 0 || cost > 1000) {
    showMessage(calcMsg, "Cost must be between RM 0 and RM 1000.", "error");
    return;
  }
  calcMsg.hidden = true;

  var factor = servings / 4; // the original recipe serves 4 people
  var ingredients = getIngredients(currentMeal);
  var totalCost = ingredients.length * cost * factor;
  var costPerServing = totalCost / servings;

  // new ingredient amounts (scaled and in the chosen unit)
  currentFactor = factor;
  showIngredientList();

  // Show the results with labels and units
  document.getElementById("calcResult").innerHTML =
    "<p><strong>Scale factor:</strong> " + factor.toFixed(2) + "x</p>" +
    "<p><strong>Estimated total cost:</strong> RM " + totalCost.toFixed(2) + "</p>" +
    "<p><strong>Cost per serving:</strong> RM " + costPerServing.toFixed(2) + "</p>";
}

// CREATE: save this recipe to the meal plan in Local Storage
function addToPlan() {
  var servings = Number(document.getElementById("servInput").value);
  if (Number.isInteger(servings) == false || servings < 1 || servings > 50) {
    servings = 4; //standard serving
  }
  var plan = loadData(PLAN_KEY);
  var newMeal = {
    id: Date.now(), 
    name: currentMeal.strMeal,
    category: currentMeal.strCategory,
    day: document.getElementById("planDay").value,
    mealType: document.getElementById("planType").value,
    servings: servings,
    notes: ""
  };
  plan.push(newMeal);
  saveData(PLAN_KEY, plan);

  var planMsg = document.getElementById("planMsg");
  showMessage(planMsg, currentMeal.strMeal + " was added to your meal plan.", "success");
  planMsg.scrollIntoView(); // show the message inside the pop-up
}


// SUGGESTION LOGIC: choose a category using the meal time and diet
function chooseCategory(time, diet) {
  var category = "";

  switch (time) {
    case "breakfast":
      if (diet == "vegetarian") {
        category = "Vegetarian";
      } else {
        category = "Breakfast";
      }
      break;
    case "lunch":
      if (diet == "vegetarian") {
        category = "Vegetarian";
      } else if (diet == "seafood") {
        category = "Seafood";
      } else {
        category = "Chicken";
      }
      break;
    case "dinner":
      if (diet == "vegetarian") {
        category = "Vegan";
      } else if (diet == "seafood") {
        category = "Seafood";
      } else {
        category = "Beef";
      }
      break;
    case "snack":
      if (diet == "vegetarian") {
        category = "Dessert";
      } else {
        category = "Starter";
      }
      break;
  }
  return category;
}

// Suggest recipe for the user
async function suggestRecipe() {
  var sugResult = document.getElementById("sugResult");
  var time = document.getElementById("sugTime").value;
  var diet = document.getElementById("sugDiet").value;
  var ingredient = document.getElementById("sugIng").value.trim();

  // Input validation: the ingredient must not be a number
  if (ingredient != "" && isNaN(ingredient) == false) {
    showMessage(sugResult, "Ingredient must be a word, not a number.", "error");
    return;
  }

  // loading message
  showMessage(sugResult, "Finding a recipe...", "info");
  sugResult.scrollIntoView();

  var category = chooseCategory(time, diet);
  var choices = []; // recipes that fit the user

  if (ingredient == "") {
    // No ingredient: use every recipe in the catergory
    var data = await getData("filter.php?c=" + category);
    if (data != null && data.meals != null) {
      choices = data.meals;
    }
  } else {
    // Ingredient given: keep only recipes that are also in the category
    var data2 = await getData("filter.php?i=" + ingredient.replaceAll(" ", "_"));
    if (data2 != null && data2.meals != null) {
      var max = Math.min(data2.meals.length, 12); // 12 recipes are being checked
      for (var i = 0; i < max; i++) {
        var full = await getData("lookup.php?i=" + data2.meals[i].idMeal);
        if (full != null && full.meals[0].strCategory == category) {
          choices.push(full.meals[0]);
        }
      }
    }
  }

  // No suitable suggestion
  if (choices.length == 0) {
    showMessage(sugResult, "No " + category + " recipe found. Try another ingredient, meal time or diet.", "info");
    return;
  }

  // Pick one random recipe
  var number = Math.floor(Math.random() * choices.length);
  var pick = choices[number];
  var reason = "Suggested for " + time + " (diet: " + diet + "). Category: " + category + ".";

  showMessage(sugResult, "", "success");
  sugResult.innerHTML = "<strong>" + pick.strMeal + "</strong><br>" + reason +
    "<br><button class='link' onclick=\"showDetail('" + pick.idMeal + "')\">View recipe</button>";
  sugResult.scrollIntoView();

  // Save the suggestion in Local Storage
  var history = loadData(SUGGEST_KEY);
  history.unshift({ name: pick.strMeal, reason: reason, date: new Date().toLocaleString() });
  saveData(SUGGEST_KEY, history);
}

// connect buttons to functions
document.getElementById("searchBtn").addEventListener("click", searchByName);
document.getElementById("ingredientBtn").addEventListener("click", filterByIngredient);
document.getElementById("sugBtn").addEventListener("click", suggestRecipe);
document.getElementById("calcBtn").addEventListener("click", calculate);
document.getElementById("addPlanBtn").addEventListener("click", addToPlan);
document.getElementById("backBtn").addEventListener("click", goBack);
categorySelect.addEventListener("change", filterByCategory);

// When the unit dropdown changes, show all ingredients in that unit
document.getElementById("unitSelect").addEventListener("change", function () {
  unitMode = document.getElementById("unitSelect").value;
  showIngredientList();
});

// Press Enter in the search box to search
searchInput.addEventListener("keydown", function (event) {
  if (event.key == "Enter") {
    searchByName();
  }
});

// Choose the meal time that matches the time chosen
var hour = new Date().getHours();
var timeBox = document.getElementById("sugTime");
if (hour < 11) {
  timeBox.value = "breakfast";
} else if (hour < 15) {
  timeBox.value = "lunch";
} else if (hour < 18) {
  timeBox.value = "snack";
} else {
  timeBox.value = "dinner";
}

// Start: load the categories
loadCategories();

addToPlan()
