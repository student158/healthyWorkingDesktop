export class SoundManager {
    standUpSound = new Audio("sound/stand.mp3");
    
    constructor() {
        this.standUpSound.volume = 0.15; // set 15% by default
    }

    /**Ring continuously to notify user stand up */
    notifyStandUp() {
        this.standUpSound.play();
    }

    /**@param value scale 100, float*/
    changeVolume(value) {
        this.standUpSound.volume = value/100;
    }
}