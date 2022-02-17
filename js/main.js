"use strict";
let tryBtn = document.querySelector("#try-html-extension");
tryBtn.addEventListener('click', () => {tryBtn.textContent = "changed!";})

class SoundManager {
    standUpSound = new Audio("sound/stand.mp3");
    constructor() {
        this.standUpSound.volume = 0.3; // set 30% by default
    }

    /**Ring continuously to notify user stand up */
    notifyStandUp() {
        this.standUpSound.play();
    }
}


class TimeManager {
    state = "can-work"; // or "need-rest"
    allowedWorkTime = 5*60; // default is 20 mins
    sufficientRestTime = 5*60;
    timeIn = 0;
    timeOut = 0;
    soundManager = new SoundManager();

    standUpNotification = null;
    canContinueNotification = null;
    standUpNotificationIsShown = false;
    canContinueNotificationIsShown = false;

    faceDetectionModelFolderPath = "models";

    constructor(webcamData) {
        this.webcamData = webcamData;
    }

    /**Like sleep in python, stop the current execution in ... sec */
    sleep(sec) {
        return new Promise(resolve => setTimeout(resolve, sec*1000*0.25));
    }

    async start() {
        await faceapi.loadSsdMobilenetv1Model(this.faceDetectionModelFolderPath);
        // while (true) {
        //     await this.sleep(1);
        //     let faceDetections = await faceapi.detectAllFaces(this.webcamData);
        //     let faceIsDetected = faceDetections.length >= 1;
        //     if (this.state === "can-work") {
        //         if (faceIsDetected) {
        //             this.timeIn ++;
        //             this.timeOut = 0;
        //             console.log("time in: ", this.timeIn, "time out: ", this.timeOut);

        //             if (this.timeIn >= this.allowedWorkTime) {
        //                 this.state = "need-rest";
        //                 this.timeOut = 0;
        //                 this.standUpNotificationIsShown = false;
        //             }
        //             // first time return to desk after stand up
        //             if (this.canContinueNotificationIsShown) {
        //                 this.canContinueNotificationIsShown = false;
        //                 // after user return to desk, after 3 secs the notification disappear
        //                 setTimeout(() => {this.canContinueNotification.close();}, 3000);
        //                 // reset timeout when first time return to desk
        //                 this.timeOut = 0;
        //             }
        //         } else {
        //             this.timeOut ++;
        //             console.log("time in: ", this.timeIn, "time out: ", this.timeOut);
        //             // can work is actually set the timeIn to 0. If healthy + rest enough -> timeIn 0 again
        //             if (this.timeOut >= this.sufficientRestTime) {
        //                 this.timeIn = 0;
        //             }
        //         }
        //     } 
        //     else { //when this.state is "need-rest"
        //         if (faceIsDetected) {
        //             this.timeIn ++;
        //             console.log("time in: ", this.timeIn, "time out: ", this.timeOut);
        //             if (!this.standUpNotificationIsShown) {
        //                 this.standUpNotification = this.createStandUpNotification();
        //                 this.standUpNotificationIsShown = true;
        //                 // close the standup notification after 10 secs
        //                 setTimeout(() => {
        //                     this.standUpNotification.close();
        //                     this.standUpNotification = null;
        //                 }, 10000);
        //             }
        //             this.soundManager.notifyStandUp();
        //         } 
        //         else {
        //             this.timeOut ++;
        //             console.log("time in: ", this.timeIn, "time out: ", this.timeOut);
        //             if (this.timeOut >= this.sufficientRestTime) {
        //                 this.state = "can-work";
        //                 this.timeIn = 0;
        //                 this.canContinueNotification = this.createContinueWorkNotification();
        //                 this.canContinueNotificationIsShown = true;
        //             }
        //         }
        //     }
        // }
        setInterval(async () => {
            let faceDetections = await faceapi.detectAllFaces(this.webcamData);
            let faceIsDetected = faceDetections.length >= 1;
            if (this.state === "can-work") {
                if (faceIsDetected) {
                    this.timeIn ++;
                    this.timeOut = 0;
                    console.log("time in: ", this.timeIn, "time out: ", this.timeOut);

                    if (this.timeIn >= this.allowedWorkTime) {
                        this.state = "need-rest";
                        this.timeOut = 0;
                        this.standUpNotificationIsShown = false;
                    }
                    // first time return to desk after stand up
                    if (this.canContinueNotificationIsShown) {
                        this.canContinueNotificationIsShown = false;
                        // after user return to desk, after 3 secs the notification disappear
                        setTimeout(() => {this.canContinueNotification.close();}, 3000);
                        // reset timeout when first time return to desk
                        this.timeOut = 0;
                    }
                } else {
                    this.timeOut ++;
                    console.log("time in: ", this.timeIn, "time out: ", this.timeOut);
                    // can work is actually set the timeIn to 0. If healthy + rest enough -> timeIn 0 again
                    if (this.timeOut >= this.sufficientRestTime) {
                        this.timeIn = 0;
                    }
                }
            } 
            else { //when this.state is "need-rest"
                if (faceIsDetected) {
                    this.timeIn ++;
                    console.log("time in: ", this.timeIn, "time out: ", this.timeOut);
                    if (!this.standUpNotificationIsShown) {
                        this.standUpNotification = this.createStandUpNotification();
                        this.standUpNotificationIsShown = true;
                        // close the standup notification after 10 secs
                        setTimeout(() => {
                            this.standUpNotification.close();
                            this.standUpNotification = null;
                        }, 10000);
                    }
                    this.soundManager.notifyStandUp();
                } 
                else {
                    this.timeOut ++;
                    console.log("time in: ", this.timeIn, "time out: ", this.timeOut);
                    if (this.timeOut >= this.sufficientRestTime) {
                        this.state = "can-work";
                        this.timeIn = 0;
                        this.canContinueNotification = this.createContinueWorkNotification();
                        this.canContinueNotificationIsShown = true;
                    }
                }
            }
        }, 900);
    }

    createStandUpNotification() {
        let options = [];
        return new Notification("You should stand up!", {icon: "images/exercise.png", body: "hello", requireInteraction: true});
    }

    createContinueWorkNotification() {
        let options = {requireInteraction: true, icon: "images/working.png", body: "Hello!"};
        return new Notification("You can continue working!", options);
    }

}


var notification;
const startBtn = document.querySelector("#start-btn");
const videoEl = document.getElementById('inputVideo');
const timeManager = new TimeManager(videoEl);
startBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        /* use the stream */
        videoEl.srcObject = stream;
    } catch(err) {
        /* handle the error */
        console.error(err);
    }
    timeManager.start();});

async function run() {
    const videoEl = document.getElementById('inputVideo');
    // navigator.getUserMedia(
    //     { video: {} },
    //     stream => videoEl.srcObject = stream,
    //     err => console.error(err)
    // );
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        /* use the stream */
        videoEl.srcObject = stream;
    } catch(err) {
        /* handle the error */
        console.error(err);
    }
    console.log("this function run"); //only run once

    await faceapi.loadSsdMobilenetv1Model('/models');
    
    // while (true) {
    //     let fullFaceDescriptions = await faceapi.detectAllFaces(videoEl);
    //     // console.log(fullFaceDescriptions);
    //     let detectionResult = null;
    //     if (fullFaceDescriptions.length >= 1) {
    //         detectionResultSpan.textContent = "True";
    //     } else {
    //         detectionResultSpan.textContent = "False";
    //     }
    // }

    setInterval(async () => {
        let detectionResultSpan = document.querySelector("#detection-result");
        let fullFaceDescriptions = await faceapi.detectAllFaces(videoEl);
        // console.log(fullFaceDescriptions);
        let detectionResult = null;
        if (fullFaceDescriptions.length >= 1) {
            detectionResultSpan.textContent = "True";
            // notification.close(); // ok worked!!!!
            audioObj.play();
        } else {
            detectionResultSpan.textContent = "False";
        }
    }, 1000);
}


// test notification
const notificationBtn = document.querySelector("#test-notification");
notificationBtn.addEventListener('click', () => {notify();});
function notify() {
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        notification = new Notification("Hi there!", {requireInteraction: true});
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
            // var notification = new Notification("Hi there!");
            notify();
        }
        });
    }

    // At last, if the user has denied notifications, and you
    // want to be respectful there is no need to bother them any more.
    }