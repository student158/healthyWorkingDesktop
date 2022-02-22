import {SoundManager} from "./sound-manager.js";

export class TimeManager {
    timeManagerOperationState = "paused";
    state = "can-work"; // or "need-rest"
    allowedWorkTime = 20*60; // default is 20 mins
    sufficientRestTime = 5*60;
    timeIn = 0;
    timeOut = 0;
    soundManager = new SoundManager();

    standUpNotification = null;
    canContinueNotification = null;
    standUpNotificationIsShown = false;
    canContinueNotificationIsShown = false;
    // after the app notify, if the user stand up and move outside -> change to true
    standUpNotificationDisappeared = false;

    faceDetectionModelFolderPath = "face-api/models";

    sendOperationDataToDocumentEvent;
    sendOperationDataToDocumentEventName = "fromTimeManager-sendData";

    // ID of setInterval method, use when stop the time manager
    timeManagerSessionId;

    /**Track time user sit, trigger notification */
    constructor(webcamData) {
        this.webcamData = webcamData;
        faceapi.loadSsdMobilenetv1Model(this.faceDetectionModelFolderPath);
    }

    start() {
        this.timeManagerOperationState = "running";
        this.timeManagerSessionId = setInterval(async () => {
            this.sendOperationDataToDocument();
            let faceDetections = await faceapi.detectAllFaces(this.webcamData);
            let faceIsDetected = faceDetections.length >= 1;
            if (this.state === "can-work") {
                if (faceIsDetected) {
                    this.timeIn ++;
                    this.timeOut = 0;
                    // console.log("time in: ", this.timeIn, "time out: ", this.timeOut);

                    if (this.timeIn >= this.allowedWorkTime) {
                        this.state = "need-rest";
                        this.timeOut = 0;
                        // reset variable in the need-rest case
                        this.standUpNotificationIsShown = false;
                        this.standUpNotificationDisappeared = false;
                    }
                    // first time return to desk after stand up
                    if (this.canContinueNotificationIsShown) {
                        this.canContinueNotificationIsShown = false;
                        // after user return to desk, after 3 secs the notification disappear
                        setTimeout(() => {this.hideCanWorkNotification();}, 3000);
                        // reset timeout when first time return to desk
                        this.timeOut = 0;
                    }
                } else {
                    this.timeOut ++;
                    // console.log("time in: ", this.timeIn, "time out: ", this.timeOut);
                    // can work is actually set the timeIn to 0. If healthy + rest enough -> timeIn 0 again
                    if (this.timeOut >= this.sufficientRestTime) {
                        this.timeIn = 0;
                    }
                }
            } 
            else { //when this.state is "need-rest"
                if (faceIsDetected) {
                    this.timeIn ++;
                    // console.log("time in: ", this.timeIn, "time out: ", this.timeOut);
                    if (!this.standUpNotificationIsShown) {
                        this.showStandUpNotification();
                        this.standUpNotificationIsShown = true;
                    }
                    this.soundManager.notifyStandUp();
                } 
                else {
                    this.timeOut ++;
                    // console.log("time in: ", this.timeIn, "time out: ", this.timeOut);
                    if (this.standUpNotificationIsShown && !this.standUpNotificationDisappeared && this.timeOut >= 5) {
                        setTimeout(() => {
                            this.hideStandUpNotification();
                        }, 500);
                        this.standUpNotificationDisappeared = true;
                    }
                    if (this.timeOut >= this.sufficientRestTime) {
                        this.state = "can-work";
                        this.timeIn = 0;
                        this.showCanWorkNotification();
                        this.canContinueNotificationIsShown = true;
                    }
                }
            }
        }, 1000);
    }

    /**Stop and reset all the variables */
    stop() {
        clearInterval(this.timeManagerSessionId);
        this.timeIn = 0;
        this.timeOut = 0;
        this.state = "can-work";
        this.standUpNotification = null;
        this.canContinueNotification = null;
        this.standUpNotificationIsShown = false;
        this.canContinueNotificationIsShown = false;
        this.standUpNotificationDisappeared = false;
    }

    sendOperationDataToDocument() {
        const data = {
            state: this.state,
            timeIn: this.timeIn,
            timeOut: this.timeOut,
            allowedWorkTime: this.allowedWorkTime,
            sufficientRestTime: this.sufficientRestTime
        }
        this.sendOperationDataToDocumentEvent = new CustomEvent(this.sendOperationDataToDocumentEventName, {detail: data});
        document.dispatchEvent(this.sendOperationDataToDocumentEvent);
    }

    /**allowedWorkTime: float, in secs */
    setAllowedWorkTime(allowedWorkTime) {
        this.allowedWorkTime = allowedWorkTime;
    }

    /**sufficientRestTime: float, in secs
     * @param sufficientRestTime float, in secs
     */
    setSufficientRestTime(sufficientRestTime) {
        this.sufficientRestTime = sufficientRestTime;
    }

    hideCanWorkNotification() {
        window.api.hideCanWorkNotification();
    }
    
    showCanWorkNotification() {
        window.api.showCanWorkNotification();
    }
    
    showStandUpNotification() {
        window.api.showStandupNotification();
    }

    hideStandUpNotification() {
        window.api.hideStandUpNotification();
    }

    /**
     * @param value float, scale 100 */
    changeVolume(value) {
        this.soundManager.changeVolume(value);
    }

}