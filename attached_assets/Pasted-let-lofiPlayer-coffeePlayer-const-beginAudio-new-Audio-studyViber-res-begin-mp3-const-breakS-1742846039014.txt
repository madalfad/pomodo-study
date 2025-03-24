let lofiPlayer, coffeePlayer;
const beginAudio = new Audio('studyViber_res/begin.mp3');
const breakStartAudio = new Audio('studyViber_res/breakstart.mp3');
const breakEndAudio = new Audio('studyViber_res/breakend.mp3');

let lofiWorkVolume, lofiBreakVolume, coffeeWorkVolume, coffeeBreakVolume;

// Load the IFrame Player API code asynchronously.
function onYouTubeIframeAPIReady() {
    lofiPlayer = new YT.Player('lofi-player', {
        height: '360',
        width: '640',
        videoId: 'jfKfPfyJRdk',
        playerVars: { 'autoplay': 1, 'controls': 1 },
        events: { 'onReady': onLofiPlayerReady }
    });

    coffeePlayer = new YT.Player('coffee-player', {
        height: '360',
        width: '640',
        videoId: '0QKdqm5TX6c',
        playerVars: { 'autoplay': 1, 'controls': 1 },
        events: { 'onReady': onCoffeePlayerReady }
    });
}

function onLofiPlayerReady(event) {
    lofiWorkVolume = localStorage.getItem('lofi-work-volume') || 50;
    lofiBreakVolume = localStorage.getItem('lofi-break-volume') || 20;
    event.target.setVolume(currentMode === 'work' ? lofiWorkVolume : lofiBreakVolume);
    document.getElementById('lofi-work-volume').value = lofiWorkVolume;
    document.getElementById('lofi-work-volume-value').innerText = lofiWorkVolume;
    document.getElementById('lofi-break-volume').value = lofiBreakVolume;
    document.getElementById('lofi-break-volume-value').innerText = lofiBreakVolume;
    event.target.playVideo();
}

function onCoffeePlayerReady(event) {
    coffeeWorkVolume = localStorage.getItem('coffee-work-volume') || 15;
    coffeeBreakVolume = localStorage.getItem('coffee-break-volume') || 30;
    event.target.setVolume(currentMode === 'work' ? coffeeWorkVolume : coffeeBreakVolume);
    document.getElementById('coffee-work-volume').value = coffeeWorkVolume;
    document.getElementById('coffee-work-volume-value').innerText = coffeeWorkVolume;
    document.getElementById('coffee-break-volume').value = coffeeBreakVolume;
    document.getElementById('coffee-break-volume-value').innerText = coffeeBreakVolume;
    event.target.playVideo();
}

document.getElementById('lofi-work-volume').addEventListener('input', function () {
    let volume = this.value;
    if (currentMode === 'work') {
        lofiPlayer.setVolume(volume);
    }
    localStorage.setItem('lofi-work-volume', volume);
    document.getElementById('lofi-work-volume-value').innerText = volume;
});

document.getElementById('lofi-break-volume').addEventListener('input', function () {
    let volume = this.value;
    if (currentMode !== 'work') {
        lofiPlayer.setVolume(volume);
    }
    localStorage.setItem('lofi-break-volume', volume);
    document.getElementById('lofi-break-volume-value').innerText = volume;
});

document.getElementById('coffee-work-volume').addEventListener('input', function () {
    let volume = this.value;
    if (currentMode === 'work') {
        coffeePlayer.setVolume(volume);
    }
    localStorage.setItem('coffee-work-volume', volume);
    document.getElementById('coffee-work-volume-value').innerText = volume;
});

document.getElementById('coffee-break-volume').addEventListener('input', function () {
    let volume = this.value;
    if (currentMode !== 'work') {
        coffeePlayer.setVolume(volume);
    }
    localStorage.setItem('coffee-break-volume', volume);
    document.getElementById('coffee-break-volume-value').innerText = volume;
});

let timerInterval;
let isRunning = false;
let currentMode = 'work';
let workTime = 25 * 60;
let breakTime = 5 * 60;
let extendedBreakTime = 15 * 60;
let timeLeft = workTime;

const timerDisplay = document.getElementById('timer-display');
const startButton = document.getElementById('start-timer');
const pauseButton = document.getElementById('pause-timer');
const resetButton = document.getElementById('reset-timer');
const workTimeInput = document.getElementById('work-time');
const breakTimeInput = document.getElementById('break-time');
const extendedBreakTimeInput = document.getElementById('extended-break-time');

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    beginAudio.play();
    console.log("Timer started");
    updateModeLabel(); // Update the mode label
    updateTimerDisplay(); // Update the timer display
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            console.log("Time's up, switching mode");
            switchMode();
        }
    }, 1000);
}

function pauseTimer() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
    } else {
        isRunning = true;
        beginAudio.play();
        console.log("Timer resumed");
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                console.log("Time's up, switching mode");
                switchMode();
            }
        }, 1000);
    }
}

function resetTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    timeLeft = workTime;
    currentMode = 'work';
    updateTimerDisplay();
}

startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);

workTimeInput.addEventListener('change', () => {
    workTime = workTimeInput.value * 60;
    if (currentMode === 'work') {
        timeLeft = workTime;
        updateTimerDisplay();
    }
});

breakTimeInput.addEventListener('change', () => {
    breakTime = breakTimeInput.value * 60;
    if (currentMode === 'break') {
        timeLeft = breakTime;
        updateTimerDisplay();
    }
});

extendedBreakTimeInput.addEventListener('change', () => {
    extendedBreakTime = extendedBreakTimeInput.value * 60;
    if (currentMode === 'extendedBreak') {
        timeLeft = extendedBreakTime;
        updateTimerDisplay();
    }
});

updateTimerDisplay();

let shortBreaksBeforeLong = 4;
let currentShortBreakCount = 0;

const shortBreaksBeforeLongInput = document.getElementById('short-breaks-before-long');
const breakCounterDisplay = document.getElementById('break-counter');
const modeLabel = document.getElementById('mode-label');

function updateBreakCounter() {
    breakCounterDisplay.textContent = `${currentShortBreakCount + 1}/${shortBreaksBeforeLong}`;
}

function updateModeLabel() {
    modeLabel.textContent = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
}

function fadeVolume(player, fromVolume, toVolume, duration) {
    fromVolume = Number(fromVolume);
    toVolume = Number(toVolume);
    // video is music or ambience
    videoTitle = player.getVideoData().title;
    console.log(`Fading volume for ${videoTitle} from ${fromVolume} to ${toVolume} over ${duration}ms`);
    const stepTime = 100;
    const steps = duration / stepTime;
    const volumeStep = (toVolume - fromVolume) / steps;
    let currentVolume = fromVolume;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
        currentVolume += volumeStep;
        player.setVolume(currentVolume);
        currentStep++;

        if (currentStep >= steps) {
            clearInterval(fadeInterval);
            console.log(`Fade complete. Final volume for ${videoTitle}: ${currentVolume}`);
        }
    }, stepTime);
}

function switchMode() {
    console.log(`Switching mode from ${currentMode}`);
    if (currentMode === 'work') {
        currentMode = 'break';
        timeLeft = breakTime;
        breakStartAudio.play();
        fadeVolume(lofiPlayer, lofiWorkVolume, lofiBreakVolume, 1000);
        fadeVolume(coffeePlayer, coffeeWorkVolume, coffeeBreakVolume, 1000);
    } else if (currentMode === 'break') {
        currentShortBreakCount++;
        if (currentShortBreakCount >= shortBreaksBeforeLong) {
            currentShortBreakCount = 0;
            currentMode = 'extendedBreak';
            timeLeft = extendedBreakTime;
        } else {
            currentMode = 'work';
            timeLeft = workTime;
            breakEndAudio.play();
            fadeVolume(lofiPlayer, lofiBreakVolume, lofiWorkVolume, 1000);
            fadeVolume(coffeePlayer, coffeeBreakVolume, coffeeWorkVolume, 1000);
        }
    } else {
        currentMode = 'work';
        timeLeft = workTime;
        breakEndAudio.play();
        fadeVolume(lofiPlayer, lofiBreakVolume, lofiWorkVolume, 1000);
        fadeVolume(coffeePlayer, coffeeBreakVolume, coffeeWorkVolume, 1000);
    }
    console.log(`New mode: ${currentMode}, timeLeft: ${timeLeft}`);
    updateModeLabel();
    updateBreakCounter();
    updateTimerDisplay();
}

shortBreaksBeforeLongInput.addEventListener('change', () => {
    shortBreaksBeforeLong = shortBreaksBeforeLongInput.value;
    updateBreakCounter();
});

updateModeLabel();
updateBreakCounter();

document.getElementById('music-selector').addEventListener('change', function () {
    const videoId = this.value;
    lofiPlayer.loadVideoById(videoId);
});

document.getElementById('ambiance-selector').addEventListener('change', function () {
    const videoId = this.value;
    coffeePlayer.loadVideoById(videoId);
});

const skipButton = document.getElementById('skip-timer');

function skipTimer() {
    timeLeft = 0; // Set the timer to 0:00.01
    updateTimerDisplay();
}

skipButton.addEventListener('click', skipTimer);

const toggleVolumeButton = document.getElementById('toggle-volume');

function toggleVolume() {
    if (!isRunning) {
        if (currentMode === 'work') {
            fadeVolume(lofiPlayer, lofiWorkVolume, lofiBreakVolume, 1000);
            fadeVolume(coffeePlayer, coffeeWorkVolume, coffeeBreakVolume, 1000);
            currentMode = 'break';
        } else {
            fadeVolume(lofiPlayer, lofiBreakVolume, lofiWorkVolume, 1000);
            fadeVolume(coffeePlayer, coffeeBreakVolume, coffeeWorkVolume, 1000);
            currentMode = 'work';
        }
        updateModeLabel();
    }
}

toggleVolumeButton.addEventListener('click', toggleVolume);
