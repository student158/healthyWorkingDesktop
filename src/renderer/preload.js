const {ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld('api', {
    showAboutWindow: () => ipcRenderer.send("show_about_window"),
    showStandupNotification: () => ipcRenderer.send("show_standup_notification"),
    showCanWorkNotification: () => ipcRenderer.send("show_can_work_notification"),
    hideCanWorkNotification: () => ipcRenderer.send("hide_can_work_notification"),
    hideStandUpNotification: () => ipcRenderer.send("hide_standup_notification"),
    updateAppSettings: (data) => ipcRenderer.send("update_app_settings", data)
});