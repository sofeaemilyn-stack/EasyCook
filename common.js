// common.js - helper functions used by both pages

// Names used to save data in Local Storage
var PLAN_KEY = "mealPlan";
var SUGGEST_KEY = "suggestions";

// Get a list from Local Storage
function loadData(key) {
  var text = localStorage.getItem(key);
  if (text == null) {
    return []; 
  }
  return JSON.parse(text); 
}

// Save a list into Local Storage
function saveData(key, list) {
  localStorage.setItem(key, JSON.stringify(list)); 
}

// Show a message to the user;"success", "error" or "info"
function showMessage(box, text, type) {
  box.innerText = text;
  box.className = "msg " + type;
  box.hidden = false;
}