// main.js
"use strict";

const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, shell} = require('electron');
const fs = require('fs');
const path = require('path')

let tray = null;
let standUpNotification;
let canWorkNotification;
let mainWindow;
// app state: true or false
let runInBackground;
let appSettings;

function loadAppSettings() {
  const filePath = path.join(__dirname, "app-settings.json");
  const rawdata = fs.readFileSync(filePath);
  appSettings = JSON.parse(rawdata);
  runInBackground = appSettings.run_in_background;
}

function sendSettingsDataToUI() {
  console.log("func sendSettingsDataToUI runs!!"); //ok
  ipcMain.emit("get_settings_from_main", "hello world!");
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: "Healthy working",
    autoHideMenuBar: true,
	  width: 450,
    icon: path.join(__dirname, 'assets/images/appicon.png'),
	  height: 430,
    webPreferences: {
      preload: path.join(__dirname, 'renderer/preload.js')
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "renderer/index.html")).then((result) => {
    // sendSettingsDataToUI();
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on("close", (e) => {
    if (runInBackground) {
      e.preventDefault();
      mainWindow.hide();
      
      if (!tray) {
        tray = new Tray(path.join(__dirname, "assets/images/appicon.png"));
      
        tray.setToolTip('Click to show the window');

        const trayMenu = Menu.buildFromTemplate([
          {label: 'Quit', 
          type: 'normal', 
          click: () => {
            app.exit();
          }}
        ]);
        tray.setContextMenu(trayMenu);
      
        tray.on('click', () => {
          mainWindow.show();
        });
      }
    }
  });
}

function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    title: "About",
    autoHideMenuBar: true,
	  width: 868,
    icon: path.join(__dirname, 'assets/images/appicon.png'),
	  height: 489,
  });
  aboutWindow.loadFile(path.join(__dirname, "renderer/about.html")).then(() => {
    aboutWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  loadAppSettings();

  createWindow()

  app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  console.log("all window closed!");
  if (!runInBackground) {
    app.quit();
  }
})


/////////////////////////////////////
////   Connection with the UI
/////////////////////////////////////

ipcMain.on("show_about_window", () => {
    createAboutWindow();
});

ipcMain.on("show_standup_notification", () => {
    console.log("main process received signal!");
    const subtitle = "(Auto hide when user leaves table)"
    standUpNotification = new Notification({title: "⚠ You should stand up!!!", body: subtitle, icon: path.join(__dirname, "assets/images/exercise.png"), timeoutType: "never"});
    standUpNotification.show();
}); 

ipcMain.on("show_can_work_notification", () => {
    console.log("trigger show_can_work_noti in main");
    const subtitle = "(Auto hide when user continues working)"
    canWorkNotification = new Notification({title: "✔ You can continue working!", body: subtitle, icon: path.join(__dirname, "assets/images/working.png"), timeoutType: "never"});
    canWorkNotification.show();
});

ipcMain.on("hide_can_work_notification", () => {
    console.log("trigger hide_can_work_noti");
    canWorkNotification.close();
});

ipcMain.on("hide_standup_notification", () => {
    console.log("trigger hide_standup_noti");
    standUpNotification.close();
});

ipcMain.on("update_app_settings", (event, data) => {
    // console.log(data);
    // {
    //   run_in_background: false,
    //   run_in_startup: false,
    //   default_work_time: 25,
    //   default_rest_time: 5,
    //   default_volume: 15
    // }
    runInBackground = data.run_in_background;
    // console.log("run in background: ", runInBackground);
    // save settings data to file
    let dataJSON = JSON.stringify(data, null, 2);
    fs.writeFile(path.join(__dirname, "app-settings.json"), dataJSON, (err) => {
        if (err) throw err;
    })
});

