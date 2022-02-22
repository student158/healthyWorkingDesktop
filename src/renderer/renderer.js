"use strict";
import {TimeManager} from "./time-manager.js";

class AppStatePane extends HTMLElement {
    elapsedTimeLabel;
    workTime;
    appSettings;
    /**
     * Show working image and state of the app, state can be "Ready", "Running"; show the elapsed time 
     */
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.elapsedTimeLabel = this.querySelector(".elapsed-time");
    }

    render() {
        this.innerHTML = `
<label class="elapsed-time">Elapsed work time: -- / -- mins ( -- %)</label>
        `
    }

    /**
     * 
     * @param {Object} data {workTime: number, elapsedTime: number, elapsedPercentage: number}
     */
    updateElapsedTime(data) {
        const workTime = data.workTime.toFixed(2);
        const elapsedTime = data.elapsedTime.toFixed(2);
        const elapsedPercentage = data.elapsedPercentage.toFixed(2);
        this.elapsedTimeLabel.textContent = `Elapsed work time: ${elapsedTime} / ${workTime} mins ( ${elapsedPercentage} %)`;
    }

    loadAppSettings() {
        const settingsString = localStorage.getItem("settings");
        const settings = JSON.parse(settingsString);
        return settings;
    }
}
customElements.define("app-state-pane", AppStatePane);

class InputPane extends HTMLElement{
    appSettings = this.loadAppSettings();
    workTimeInput;
    restTimeInput;
    defaultWorkTime = this.appSettings.default_work_time;
    defaultRestTime = this.appSettings.default_rest_time;

    /**Contain 2 inputs for work time and rest time */
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.workTimeInput = this.querySelector("#work-time-input");
        this.restTimeInput = this.querySelector("#rest-time-input");
    }

    render() {
        this.innerHTML = `
<p>
    <label for="work-time-input">Enter time working: </label>
    <input type="text" id="work-time-input" placeholder="default ${this.defaultWorkTime} mins">
    <span>mins</span>
</p>
<p>
    <label for="rest-time-input">Enter time rest: </label>
    <input type="text" id="rest-time-input" placeholder="default ${this.defaultRestTime} mins">
    <span>mins</span>
</p>
        `
    }

    /**@returns float value*/
    getWorkTimeInput() {
        const workTimeInput = this.workTimeInput.value;
        if (workTimeInput === "") {
            return this.defaultWorkTime;
        }
        return parseFloat(workTimeInput);
    }

    /**@returns float value */
    getRestTimeInput() {
        const restTimeInput = this.restTimeInput.value;
        if (restTimeInput === "") {
            return this.defaultRestTime;
        }
        return parseFloat(restTimeInput);
    }

    /**Valid when user input number */
    isInputValid() {
        const workTimeInput = this.workTimeInput.value;
        const restTimeInput = this.restTimeInput.value;
        const workTimeIsValid = (!isNaN(parseFloat(workTimeInput)) && parseFloat(workTimeInput) > 0) || workTimeInput === "";
        const restTimeIsValid = (!isNaN(parseFloat(restTimeInput)) && parseFloat(restTimeInput)) || restTimeInput === "";
        return workTimeIsValid && restTimeIsValid;
    }

    loadAppSettings() {
        const settingsString = localStorage.getItem("settings");
        const settings = JSON.parse(settingsString);
        // console.log("Initial settings: ", settings);
        return settings;
    }

    /**Update the default time value and the placeholder in input */
    updateDefaultTime() {
        this.appSettings = this.loadAppSettings();
        this.defaultWorkTime = this.appSettings.default_work_time;
        this.defaultRestTime = this.appSettings.default_rest_time;
        this.workTimeInput.placeholder = `default ${this.defaultWorkTime} mins`;
        this.restTimeInput.placeholder = `default ${this.defaultRestTime} mins`;
    }
}
customElements.define("input-pane", InputPane);

class ButtonPane extends HTMLElement {
    startBtn;
    stopBtn;
    startTimeManagerEventName = "fromButtonPane-start";
    startTimeManagerEvent = new Event(this.startTimeManagerEventName);
    stopTimeManagerEventName = "fromButtonPane-stop";
    stopTimeManagerEvent = new Event(this.stopTimeManagerEventName);

    /**Contains 2 buttons: start and stop */
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.startBtn = this.querySelector("#start");
        this.stopBtn = this.querySelector("#stop");
        this.startBtn.addEventListener('click', () => {
            document.dispatchEvent(this.startTimeManagerEvent);
        });
        this.stopBtn.addEventListener('click', () => {
            document.dispatchEvent(this.stopTimeManagerEvent);
            this.startBtn.removeAttribute("disabled");
            this.stopBtn.setAttribute("disabled", true);
        });
    }

    render() {
        this.innerHTML = `
<button id="start" class="btn btn-primary">Start</button>
<button id="stop" class="btn btn-danger" disabled>Stop</button>
        `
    }

    /**Disable start button and activate stop button */
    disableStartButton() {
        this.stopBtn.removeAttribute("disabled");
        this.startBtn.setAttribute("disabled", true);
    }
}
customElements.define("button-pane", ButtonPane);

class VolumeControlPane extends HTMLElement {
    appSettings = this.loadAppSettings();
    volumeSlider;
    currentVolumeValue = this.appSettings.default_volume;
    changeVolumeEventName = "fromVolumeControlPane-changeVolume";
    changeVolumeEvent;

    /**Slider to change the notification volume */
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.volumeSlider = this.querySelector("#volume-slider");
        const volumeValue = this.querySelector("#volume-value");
        // update the value display when move the slider
        this.volumeSlider.oninput = async () => {
            volumeValue.textContent = this.volumeSlider.value + " %";
            const volumeData = parseFloat(this.volumeSlider.value);
            this.changeVolumeEvent = new CustomEvent(this.changeVolumeEventName, {detail: volumeData});
            document.dispatchEvent(this.changeVolumeEvent);
        };
    }

    render() {
        this.innerHTML = `
<label for="volume-slider">Volume: </label>
<input type="range" min="0" max="100" value=${this.currentVolumeValue} id="volume-slider">
<span id="volume-value">${this.currentVolumeValue} %</span>
        `;
    }

    loadAppSettings() {
        const settingsString = localStorage.getItem("settings");
        const settings = JSON.parse(settingsString);
        // console.log("Initial settings: ", settings);
        return settings;
    }
}
customElements.define("volume-control-pane", VolumeControlPane);

class SettingsPane extends HTMLElement {
    appSettings = this.loadAppSettings();
    runInBackground = this.appSettings.run_in_background;
    defaultWorkTime = this.appSettings.default_work_time;
    defaultRestTime = this.appSettings.default_rest_time;
    defaultVolume = this.appSettings.default_volume;
    runInStartup;

    updateAppSettingsEventName = "fromSettingsPane-updateAppSettings";
    updateAppSettingsEvent;

    settingsForm;
    defaultWorkTimeInput;
    defaultRestTimeInput;
    defaultVolumeInput;
    runInBackgroundCheckBox;
    saveChangesBtn;
    closeBtn;
    crossCloseBtn;
    settingsModal;

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.settingsForm = this.querySelector(".settings-form");
        this.defaultWorkTimeInput = this.querySelector(".default-work-time");
        this.defaultRestTimeInput = this.querySelector(".default-rest-time");
        this.defaultVolumeInput = this.querySelector(".default-volume");
        this.saveChangesBtn = this.querySelector(".save-changes-btn");
        this.closeBtn = this.querySelector(".close-btn");
        this.crossCloseBtn = this.querySelector(".cross-close-btn");
        this.runInBackgroundCheckBox = this.querySelector("#run-in-background-checkbox");
        this.settingsModal = new bootstrap.Modal(this.querySelector('#settings-pane'), {keyboard: false});

        this.populateDefaultInput();

        this.closeBtn.addEventListener("click", () => {
            this.populateDefaultInput();
        });

        this.crossCloseBtn.addEventListener("click", () => {
            this.populateDefaultInput();
        });

        this.settingsForm.addEventListener("submit", (event) => {
            event.preventDefault();
            this.updateAppSettings();
            this.settingsModal.hide();

        });
    }

    render() {
        this.innerHTML = `
<div class="modal fade" id="settings-pane" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">Settings</h5>
                <button type="button" class="btn-close cross-close-btn" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form class="settings-form">
                <div class="modal-body">
                    <div>
                        <label for="default-work-time">Default work time: </label>
                        <input type="number" min="1" class="default-work-time" value="${this.defaultWorkTime}" required>
                        <span>mins</span>
                    </div>
                    <div class="mt-2">
                        <label for="default-rest-time">Default rest time: </label>
                        <input type="number" min="1" required class="default-rest-time" value="${this.defaultRestTime}">
                        <span>mins</span>
                    </div>
                    <div class="mt-2">
                        <label>Default volume: </label>
                        <input type="number" min="0" max="100" required class="default-volume" value="${this.defaultVolume}">
                        <span>%</span>
                    </div>
                    
                    <div class="mt-2">
                        <input type="checkbox" id="run-in-background-checkbox">
                        <label for="run-in-background-checkbox" class="ml-4">Run in background</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary close-btn" data-bs-dismiss="modal">Close</button>
                    <input class="btn btn-primary save-changes-btn" type="submit" value="Save changes">
                </div>
            </form>
        </div>
    </div>
</div>
        `;
    }

    /**When user want to change settings but not save -> use old settings and repolulate the input */
    populateDefaultInput() {
        this.defaultWorkTimeInput.value = this.appSettings.default_work_time;
        this.defaultRestTimeInput.value = this.appSettings.default_rest_time;
        this.defaultVolumeInput.value = this.appSettings.default_volume;
        const run_in_background = this.appSettings.run_in_background;
        if (run_in_background) {
            this.runInBackgroundCheckBox.checked = true;
        }
        else {
            this.runInBackgroundCheckBox.checked = false;
        }
    }

    /**Return object of app settings */
    loadAppSettings() {
        const settingsString = localStorage.getItem("settings");
        const settings = JSON.parse(settingsString);
        // console.log("Initial settings: ", settings);
        return settings;
    }

    /**Update settings data to the localStorage */
    async updateAppSettings() {
        const defaultWorkTimeInputValue = Number(this.defaultWorkTimeInput.value);
        const defaultRestTimeInputValue = Number(this.defaultRestTimeInput.value);
        const defaultVolumeInputValue = Number(this.defaultVolumeInput.value);
        const isRunInBackground = this.runInBackgroundCheckBox.checked;
        this.appSettings.default_work_time = defaultWorkTimeInputValue;
        this.appSettings.default_rest_time = defaultRestTimeInputValue;
        this.appSettings.default_volume = defaultVolumeInputValue;
        this.appSettings.run_in_background = isRunInBackground;

        localStorage.settings = JSON.stringify(this.appSettings);

        this.updateAppSettingsEvent = new CustomEvent(this.updateAppSettingsEventName, {detail: this.appSettings});
        document.dispatchEvent(this.updateAppSettingsEvent);
        // console.log(localStorage);
    }

}
customElements.define("settings-pane", SettingsPane);

function initializeSettingsFirstTime() {
    const previousData = localStorage.getItem("settings");
    if (!previousData) {
        localStorage.setItem("settings", `{"run_in_background": false, "run_in_startup": false, "default_work_time": 25, "default_rest_time": 5, "default_volume": 15}`);
    }
}
initializeSettingsFirstTime();

const aboutButton = document.querySelector(".about-btn");
aboutButton.addEventListener("click", () => {
    window.api.showAboutWindow();
});

const videoEl = document.getElementById('inputVideo');

const appStatePaneHolder = document.querySelector("#app-state-pane-holder");
const appStatePane = new AppStatePane();
appStatePaneHolder.appendChild(appStatePane);

const inputPaneHolder = document.querySelector("#input-pane-holder");
const inputPane = new InputPane();
inputPaneHolder.appendChild(inputPane);

const buttonPaneHolder = document.querySelector("#button-pane-holder");
const buttonPane = new ButtonPane();
buttonPaneHolder.appendChild(buttonPane);

const volumePaneHolder = document.querySelector("#volume-pane-holder");
const volumePane = new VolumeControlPane();
volumePaneHolder.appendChild(volumePane);

const settingsPaneHolder = document.querySelector("#settings-pane-holder");
const settingsPane = new SettingsPane();
settingsPaneHolder.appendChild(settingsPane);

let webcamStream;
const timeManager = new TimeManager(videoEl);

// Action center of the app. Child elements will send events to document to communicate with each other
document.addEventListener(buttonPane.startTimeManagerEventName, () => {
    // startTimeManager();
    // console.log(inputPane.isInputValid()); // test isInputValid
    const inputIsValid = inputPane.isInputValid();
    if (inputIsValid) {
        const workTime = inputPane.getWorkTimeInput();
        const restTime = inputPane.getRestTimeInput();
        timeManager.setAllowedWorkTime(workTime*60);
        timeManager.setSufficientRestTime(restTime*60);
        buttonPane.disableStartButton();
        startTimeManager();
    }
    else {
        alert("The input must be positive number");
    }
});
document.addEventListener(buttonPane.stopTimeManagerEventName, () => {
    const tracks = webcamStream.getTracks();
    tracks.forEach(function(track) {
        track.stop();
    });
    timeManager.stop();
});
document.addEventListener(volumePane.changeVolumeEventName, (e) => {
    const volumeValue = e.detail;
    timeManager.changeVolume(volumeValue);
});
document.addEventListener(settingsPane.updateAppSettingsEventName, (e) => {
    inputPane.updateDefaultTime();
    const appSettings = e.detail;
    window.api.updateAppSettings(appSettings);
});
document.addEventListener(timeManager.sendOperationDataToDocumentEventName, (event) => {
    const data = event.detail;
    const workTime = data.allowedWorkTime/60;
    const elapsedTime = data.timeIn/60;
    const elapsedPercentage = elapsedTime/workTime*100;
    appStatePane.updateElapsedTime({workTime: workTime, elapsedTime: elapsedTime, elapsedPercentage: elapsedPercentage});
});

async function startTimeManager() {
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        /* use the stream */
        videoEl.srcObject = webcamStream;
    } catch(err) {
        /* handle the error */
        console.error(err);
    }
    timeManager.start();
}


