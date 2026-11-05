// main.js - opens the app window
const { app, BrowserWindow } = require('electron');

function createWindow() {
  var win = new BrowserWindow({ width: 1100, height: 780 });
  win.setMenuBarVisibility(false);
  win.loadFile('index.html'); // the first page
}


app.whenReady().then(createWindow);

// Close the app when the window is closed
app.on('window-all-closed', function () {
  app.quit();
});