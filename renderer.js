"use strict";
import {TimeManager} from "./time-manager.js";

class InputPane extends HTMLElement{
    workTimeInput;
    restTimeInput;
    defaultWorkTime = 25;
    defaultRestTime = 5;

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
            this.stopBtn.removeAttribute("disabled");
            this.startBtn.setAttribute("disabled", true);
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
}
customElements.define("button-pane", ButtonPane);

class VolumeControlPane extends HTMLElement {
    volumeSlider;
    currentVolumeValue = 15;
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
        this.volumeSlider.oninput = () => {
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
}
customElements.define("volume-control-pane", VolumeControlPane);

class SettingsPane extends HTMLElement {
    runInBackgroundCheckBox;
    runInBackground;
    runInStartup;
    updateAppSettingsEventName = "fromSettingsPane-updateAppSettings";
    updateAppSettingsEvent;

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.runInBackgroundCheckBox = this.querySelector("#run-in-background-checkbox");
        // load settings first time
        const settings = this.loadAppSettings();
        this.runInBackground = settings.run_in_background;
        if (this.runInBackground) {
            this.runInBackgroundCheckBox.setAttribute("checked", "true");
        }

        this.runInBackgroundCheckBox.addEventListener("click", async () => {
            const isChecked = this.runInBackgroundCheckBox.checked;
            const appSettings = {run_in_background: isChecked, run_in_startup: false};
            this.updateAppSettings(appSettings);
            this.updateAppSettingsEvent = new CustomEvent(this.updateAppSettingsEventName, {detail: appSettings});
            document.dispatchEvent(this.updateAppSettingsEvent);
        });
    }

    render() {
        this.innerHTML = `
<div class="modal fade" id="settings-pane" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">Settings</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div>
                    <label for="default-work-time">Default worktime: </label>
                    <input type="text" id="default-work-time" value="25">
                    <span>mins</span>
                </div>
                <div>
                    <label for="default-rest-time">Default rest time: </label>
                    <input type="text" id="default-rest-time" value="5">
                    <span>mins</span>
                </div>
                <div>
                    <label>Default volume: </label>
                    <input type="text" class="default-volume-level" value="15">
                    <span>%</span>
                </div>
                
                <div>
                    <input type="checkbox" id="run-in-background-checkbox">
                    <label for="run-in-background-checkbox" class="ml-4">Run in background</label>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Save changes</button>
            </div>
        </div>
    </div>
</div>
        `;
    }

    loadAppSettings() {
        const previousSettings = localStorage.getItem("settings");
        if (!previousSettings) {
            localStorage.setItem("settings", `{"run_in_background": false, "run_in_startup": false}`);
            return {run_in_background: false, run_in_startup: false};
        }
        else {
            const settings = JSON.parse(previousSettings);
            return settings;
        }
    }

    /**Update settings data to the localStorage */
    updateAppSettings(settingsData) {
        localStorage.settings = JSON.stringify(settingsData);
    }

}
customElements.define("settings-pane", SettingsPane);

let appSettings;
window.api.getSettingsDataFromMain((event, data) => {
    console.log("get settings from main, writen in UI");
    console.log(data);
});

/**
 * 
 * @return an object contains settings data
 */
function initializeSettingsFirstTime() {
    const previousData = localStorage.getItem("testData");
    if (!previousData) {
        console.log({run_in_background: false, run_in_startup: false});
    }
    else {
        console.log(previousData);
    }
}

let settings;
initializeSettingsFirstTime();

const videoEl = document.getElementById('inputVideo');

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
    const appSettings = e.detail;
    window.api.updateAppSettings(appSettings);
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


