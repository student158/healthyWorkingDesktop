const {ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld('api', {
    showStandupNotification: () => ipcRenderer.send("show_standup_notification"),
    showCanWorkNotification: () => ipcRenderer.send("show_can_work_notification"),
    hideCanWorkNotification: () => ipcRenderer.send("hide_can_work_notification"),
    hideStandUpNotification: () => ipcRenderer.send("hide_standup_notification"),
    updateAppSettings: (data) => ipcRenderer.send("update_app_settings", data),
    getSettingsDataFromMain: (callback) => ipcRenderer.on("get_settings_from_main", callback)
});