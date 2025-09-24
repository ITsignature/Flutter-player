/**
 * Project: ITS Video Player
 * File: its-video-player.js
 * Description: Custom JavaScript for the ITS Video Player.
 *
 * Author: ITSignature Pvt Ltd
 * Website: https://www.itsignature.com
 *
 * Created: 2025-03-19
 * Last Updated: 2025-04-11
 * Version: 2.5
 *
 * License: Proprietary and Confidential
 *
 * Copyright (c) 2025 ITSignature Pvt Ltd. All Rights Reserved.
 *
 * This file is the sole property of ITSignature Pvt Ltd. Unauthorized
 * copying, modification, distribution, or disclosure of this file,
 * in whole or in part, is strictly prohibited without prior written
 * permission from ITSignature Pvt Ltd.
 */
// (function preventDebugging() {

//   console.log("Js has been imported")


//   function blockDebugger() {
//     let isIphone = /iPhone/i.test(navigator.userAgent);
//     if (!isIphone) {
//       window.close();
//     }
//     document.body.innerHTML =
//       "<h1>Access Denied</h1><p>Debugging is not allowed on this page.</p>";
//     setTimeout(() => {
//       window.close();
//     }, 1000);
//   }

//   // Block Right-Click Context Menu
//   document.addEventListener("contextmenu", (event) => event.preventDefault());

//   // Block Keyboard Shortcuts for DevTools
//   document.addEventListener("keydown", (event) => {
//     if (
//       event.key === "F12" ||
//       (event.ctrlKey && event.shiftKey && event.key === "I") ||
//       (event.ctrlKey && event.shiftKey && event.key === "J") ||
//       (event.ctrlKey && event.key === "U")
//     ) {
//       event.preventDefault();
//       return false;
//     }
//   });

//   // Detect DevTools Open Using Performance Timing
//   setInterval(() => {
//     let start = performance.now();
//     debugger;
//     let end = performance.now();
//     if (end - start > 100) {
//       blockDebugger();
//     }
//   }, 1000);

//   // Detect DevTools Open by Monitoring Console
//   console.log("%cStop!", "color: red; font-size: 50px;");
//   Object.defineProperty(console, "_commandLineAPI", {
//     get: function () {
//       blockDebugger();
//       throw new Error("Debugging not allowed");
//     },
//   });

//   // Detect DevTools Open Using Window Resize
//   window.addEventListener("resize", function () {
//     if (
//       window.outerWidth - window.innerWidth > 400 ||
//       window.outerHeight - window.innerHeight > 400
//     ) {
//       let isIphone = /iPhone/i.test(navigator.userAgent);
//       if (!isIphone) {
//         blockDebugger();
//       }
//     }
//   });

//   // Detect Console Open by Checking Execution Time
//   const devtoolsCheck = () => {
//     const start = new Date();
//     debugger;
//     const end = new Date();
//     if (end - start > 100) {
//       blockDebugger();
//     }
//   };
//   setInterval(devtoolsCheck, 1000);
// })();

// var bridge = null;
// new QWebChannel(qt.webChannelTransport, function(channel) {
//   bridge = channel.objects.bridge;
// });

class ITSVideoPlayer {
  static players = [];
  static isDebuggingPrevented = false;

  constructor(
    playerId,
    videoId,
    userName,
    logoUrl = null,
    fullScreenButtonText = "Watch The Lesson",
    fullScreenButtonClasses = "fullscreen-button",
    orientation = "landscape"
  ) {
    if (1 == 1) {

      this.playerId = playerId;
      this.videoId = videoId;
      this.decryptedVideoId = window.atob(videoId);
      this.userName = userName;
      this.logoUrl = logoUrl;
      this.player = null;
      this.isIphone = /iPhone/i.test(navigator.userAgent);
      this.isPlaying = false;
      this.inactivityTimeout = null;
      this.isToggling = false;
      this.isVideoLoading = true;
      this.topOverlayTimeout = null;
      this.showSkipIconTimeout = null;
      this.pauseVideoTimeout = null;
      this.playPauseIconTimeOut = null;
      this.videoOverLayTimeout = null;
      this.videoIntervals = {};
      this.currentStartTime = null;
      this.isTryingToPause = false;
      this.fullScreenButtonText = fullScreenButtonText;
      this.fullScreenButtonClasses = fullScreenButtonClasses;
      this.orientation = orientation;
      // this.hasStartedOnce   = false; // added new line to capture the start of the video
      // this.startupWatchdog  = null;       // ⬅ NEW: id of the timeout/interval
      // in constructor (or right after creating the YT.Player)
      this._gotReady = false;
      this._readyT = setTimeout(() => {
        if (!this._gotReady) bridge?.onYoutubeError?.(-98); // timeout code
      }, 45 * 1000); // 60 minutes (use 60*1000 for 60s)

      console.log("Player ID: ", this.playerId);

      this.playerDiv = document.getElementById(`${playerId}`);

      this.addMetaTagIfNotExists(
        "viewport",
        "width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1"
      );

      this.injectPlayerHTML();

      ITSVideoPlayer.players.push(this);

      if (ITSVideoPlayer.players.length === 1) {
        this.setYouTubeAPIReadyCallback();
      }

      this.fullscreenContainer = this.playerDiv.querySelector(
        "#fullscreen-container"
      );
      this.fullscreenButton =
        this.playerDiv.querySelector("#fullscreen-button");
      this.controlsContainer = this.playerDiv.querySelector(
        ".controls-container"
      );
      this.seekBar = this.playerDiv.querySelector("#seekBar");
      this.timeDisplay = this.playerDiv.querySelector("#timeDisplay");
      this.playPauseBtn = this.playerDiv.querySelector(".play-pause-btn");
      this.videoOverlay = this.playerDiv.querySelector(".video-overlay");
      this.skipBackwardIcon = this.playerDiv.querySelector(
        "#skip-backward-icon"
      );
      this.skipForwardIcon = this.playerDiv.querySelector("#skip-forward-icon");
      this.playPauseIcon = this.playerDiv.querySelector("#play-pause-icon");
      this.playIcon = this.playerDiv.querySelector("#play-icon");
      this.pauseIcon = this.playerDiv.querySelector("#pause-icon");
      this.volumeSlider = this.playerDiv.querySelector("#volumeSlider");
      this.volumeControl = this.playerDiv.querySelector("#volume-control");
      this.settingsButton = this.playerDiv.querySelector("#settings-button");
      this.speedControls = this.playerDiv.querySelector("#speed-control");
      this.qualityControls = this.playerDiv.querySelector("#quality-control");
      this.topOverlay = this.playerDiv.querySelector("#top-overlay");
      
      this.title = this.playerDiv.querySelector("#fullscreen-title");
      
      this.itsPlayerImg = null;

      // if (0this.checkSecretTokenAvialble()) {
      this.initITSPlayer();
      this.initEventListeners();
      // }
    }
  }

  getCleanDomain(url) {
    return window.location.hostname.replace(/^www\./, "");
  }

  checkSecretTokenAvialble() {
    let secretToken = document.getElementById("app-id");

    if (secretToken) {
      let dataId = secretToken.getAttribute("data-id");
      let secretTokenValue = window.atob(dataId);
      let hostedDomain = window.atob(secretTokenValue);
      let cleanDomain = this.getCleanDomain();

      console.log(hostedDomain, cleanDomain);

      if (cleanDomain == hostedDomain) {
        console.log("✅ Domain check passed!");
        console.log("✅ Initializing ITS Player...");

        return true; //false

      }
      return true; //false
    }
    return true;//falser
  }

  initITSPlayer() {
    if (1 == 1) {
      if (window.YT && window.YT.Player) {
        this.onYouTubeIframeAPIReady();
      } else {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        this.fullscreenButton.innerHTML = this.getLoaderHTML();
      }
    } else {
      console.log(
        "Debugger or iphone safari is active. YouTube API will not be loaded."
      );
    }
  }

  // isDebuggerActive() {
  //   const start = performance.now();
  //   debugger;
  //   const end = performance.now();
  //   return end - start > 100;
  // }





  handleDebuggerDetected() {
    // Replace player HTML with access denied message
    document.body.innerHTML = `<div style="color: red; text-align: center; font-size: 20px;">Access Denied - Debugging Detected</div>`;
    console.log("Debugger detected. Player instance has been disabled.");
  }

  injectPlayerHTML() {
    this.playerDiv.innerHTML = `
        <div id="fullscreen-container" class="fullscreen-container">
      <div id="top-overlay" class="top-overlay"></div>

      <h1 style="position: absolute; top: 10%; color: white; z-index: 9999;" id="fullscreen-title"></h1>

      <!-- Skip icons -->
      <div class="skip-icon skip-backward" id="skip-backward-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="icon icon-tabler icons-tabler-outline icon-tabler-chevrons-left">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M11 7l-5 5l5 5" />
          <path d="M17 7l-5 5l5 5" />
        </svg>
      </div>
      <div class="skip-icon skip-forward" id="skip-forward-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="icon icon-tabler icons-tabler-outline icon-tabler-chevrons-right">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M7 7l5 5l-5 5" />
          <path d="M13 7l5 5l-5 5" />
        </svg>
      </div>

      <div class="play-pause-icon" id="play-pause-icon">
        <svg id="play-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white"
          class="icon icon-tabler icons-tabler-filled icon-tabler-player-play">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
        </svg>
        <svg id="pause-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white"
          class="icon icon-tabler icons-tabler-filled icon-tabler-player-pause" style="display: none;">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
          <path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
        </svg>
      </div>

      <div id="${this.playerId}-videoPlayer" class="videoPlayer"></div>

      <div class="video-overlay blue"></div>

      <div class="controls-container">
        <button class="play-pause-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"
            class="icon icon-tabler icons-tabler-filled icon-tabler-player-play">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
          </svg>
        </button>
        <input type="range" class="seek-bar" id="seekBar" min="0" max="1" step="0.01" value="0">
        <span class="time-display" id="timeDisplay">0:00 / 0:00</span>

        <div class="volume-control" id="volume-control">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-volume-2">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M15 8a5 5 0 0 1 0 8" />
              <path
                d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
            </svg>
          </span>
          <input type="range" id="volumeSlider" class="volumeSlider" min="0" max="100" value="100" step="1">
        </div>

        <div id="settings-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="icon icon-tabler icons-tabler-outline icon-tabler-settings">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path
              d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
            <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
          </svg>
        </div>

        <div class="speed-control" id="speed-control">
          <span>Speed: </span>
          <button data-speed="0.5">0.5x</button>
          <button data-speed="1" class="active">1x</button>
          <button data-speed="1.5"">1.5x</button>
        <button data-speed=" 2">2x</button>
        </div>

        <div id="quality-control" class="quality-control">
          <button data-quality="hd1080">1080p</button>
          <button data-quality="hd720">720p</button>
          <button data-quality="large">480p</button>
          <button data-quality="medium">360p</button>
          <button data-quality="small">240p</button>
        </div>

      </div>
    </div>

    <button id="fullscreen-button" class="${this.fullScreenButtonClasses}">
      ${this.fullScreenButtonText}
    </button>`;
  }

  checkSafari() {
    const isIphone = /iPhone/i.test(navigator.userAgent);
    const isSafari =
      /Safari/i.test(navigator.userAgent) &&
      !/CriOS/i.test(navigator.userAgent); // Exclude Chrome on iOS

    if (isIphone && isSafari) {
      this.fullscreenButton.style.display = "none";

      ITSVideoPlayer.players.forEach((player) => {
        console.log(`YouTube API is ready for player: ${player.playerId}`);
        // Call any additional initialization code for each player
        player.fullscreenButton.style.display = "none"; // You can add your custom player setup logic here
      });

      alert(
        "This site cannot run on Safari. Please use Google Chrome for a better experience."
      );

      let itsModal = document.querySelector("#itsModal");

      if (itsModal) {
        itsModal.style.display = "none";
      }
      this.isVideoLoading = true;
      return;
    }
  }
  

  onYouTubeIframeAPIReady() {
    this.player = new YT.Player(`${this.playerId}-videoPlayer`, {
      height: "100%",
      width: "100%",
      videoId: this.decryptedVideoId,
      playerVars: {
        rel: 0,
        controls: 0,
        modestbranding: 1,
        playsinline: 0,
        showshowinfo: 0,
        enablejsapi: 1,
      },
      events: {
        onReady: this.onPlayerReady.bind(this),
        onError: this.onPlayerError.bind(this),
        // onStateChange: this.onPlayerStateChange.bind(this), 
      },
    });
    //     /* --- watchdog: if PLAYING never arrives within 10 s,   log custom error --- */
    // this.startupWatchdog = setTimeout(() => {
    //   if (!this.hasStartedOnce) {
    //     console.error("YouTube Player Error: -88");   // Python will treat as fatal
    //   }
    // }, 10_000);   // 10 000 ms = 10 s

    
    

    /* test-only: emit a fake fatal error 5 s after the API reports ready */
// setTimeout(() => {
//   console.log("YouTube Player Error: 150");   // <-- should now be visible
// }, 8000);


  }

  setYouTubeAPIReadyCallback() {
    window.onYouTubeIframeAPIReady = () => this.handleYouTubeAPIReady();
  }

  handleYouTubeAPIReady() {
    // Call the readiness function for each player instance
    ITSVideoPlayer.players.forEach((player) => {
      console.log(`YouTube API is ready for player: ${player.playerId}`);
      // Call any additional initialization code for each player
      player.onYouTubeIframeAPIReady(); // You can add your custom player setup logic here
    });
  }

  togglePlay() {
    if (this.isToggling) return; // If already toggling, ignore the subsequent call

    this.isToggling = true; // Set flag to true, indicating toggling is in progress

    if (this.isPlaying) {
      if (this.logoUrl != null) {
        this.playPauseIcon.innerHTML = `<img src="${this.logoUrl}" id="its-player-img" alt="Logo" width="250rem;" />`;
        this.itsPlayerImg = this.playerDiv.querySelector("#its-player-img");
        this.itsPlayerImg.addEventListener("click", () => {
          this.togglePlay();
        });
        this.playPauseIcon.style.top = "90%";
        this.playPauseIcon.style.left = "8%";
      }
      this.topOverlay.classList.remove("hidden");
      if (!this.isIphone) {
        if (this.topOverlayTimeout) {
          clearTimeout(this.topOverlayTimeout);
        }
      }
      this.isTryingToPause = true;
      this.showControls();

      this.playIcon.style.display = "block";
      this.pauseIcon.style.display = "none";
      this.videoOverlay.style.background = "rgba(0, 0, 0, 0)";

      clearTimeout(this.pauseVideoTimeout);
      this.pauseVideoTimeout = setTimeout(() => {
        this.player.pauseVideo();
        this.isToggling = false; // Reset flag after video is paused
      }, 100);
    } else {
      this.playPauseIcon.style.top = "50%";
      this.playPauseIcon.style.left = "50%";
      this.playPauseIcon.innerHTML = this.getOverLayPlayButtonHTML();
      this.playIcon.style.display = "none";
      this.pauseIcon.style.display = "block";

      clearTimeout(this.playPauseIconTimeOut);
      this.playPauseIconTimeOut = setTimeout(() => {
        this.playPauseIcon.style.display = "none";
      }, 1000);

      clearTimeout(this.videoOverLayTimeout);
      this.videoOverLayTimeout = setTimeout(() => {
        this.videoOverlay.style.background = "transparent";
        this.isToggling = false; // Reset flag after video is playing
      }, 1000);

      const savedTime = localStorage.getItem(`lastPosition_${this.videoId}`);

      if (savedTime) {
        this.player.seekTo(parseFloat(savedTime));
        this.player.playVideo();
      } else {
        this.player.playVideo();
      }

      if (!this.isIphone) {
        this.topOverlayTimeout = setTimeout(() => {
          this.topOverlay.classList.add("hidden");
        }, 10000);
      }

      this.isTryingToPause = false;
      this.showControls();
    }

    this.playPauseIcon.style.display = "block";
    this.isPlaying = !this.isPlaying;
    this.playPauseBtn.innerHTML = this.isPlaying
      ? this.getPauseButtonHTML()
      : this.getPlayButtonHTML();
  }

  updateSeekBar() {
    const duration = this.player.getDuration();
    const currentTime = this.player.getCurrentTime();
    this.seekBar.max = duration;
    this.seekBar.value = currentTime;

    // Update time display
    this.timeDisplay.textContent = `${this.formatTime(
      currentTime
    )} / ${this.formatTime(duration)}`;

    if (this.isPlaying && currentTime < duration) {
      requestAnimationFrame(this.updateSeekBar.bind(this));
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  getPlayButtonHTML() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" class="icon icon-tabler icons-tabler-filled icon-tabler-player-play"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" /></svg>`;
  }

  getPauseButtonHTML() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" class="icon icon-tabler icons-tabler-filled icon-tabler-player-pause"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" /><path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" /></svg>`;
  }

  getOverLayPlayButtonHTML() {
    return `<svg id="play-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white"
          class="icon icon-tabler icons-tabler-filled icon-tabler-player-play">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
        </svg>`;
  }

  getLoaderHTML() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" class="w-8 h-8 text-white animate-spin">
        <radialGradient id="a12" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)">
          <stop offset="0" stop-color="#41FF2A"></stop>
          <stop offset=".3" stop-color="#41FF2A" stop-opacity=".9"></stop>
          <stop offset=".6" stop-color="#41FF2A" stop-opacity=".6"></stop>
          <stop offset=".8" stop-color="#41FF2A" stop-opacity=".3"></stop>
          <stop offset="1" stop-color="#41FF2A" stop-opacity="0"></stop>
        </radialGradient>
        <circle transform-origin="center" fill="none" stroke="url(#a12)" stroke-width="5" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="15" cy="15" r="12">
          <animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2s" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform>
        </circle>
        <circle transform-origin="center" fill="none" opacity=".2" stroke="#41FF2A" stroke-width="5" stroke-linecap="round" cx="15" cy="15" r="12"></circle>
      </svg> Loading`;
  }

  getVideoLoaderHTML() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"><path fill="none" stroke="#FF0B42" stroke-width="2" stroke-linecap="round" stroke-dasharray="300 385" stroke-dashoffset="0" d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"><animate attributeName="stroke-dashoffset" calcMode="spline" dur="2.8" values="685;-685" keySplines="0 0 1 1" repeatCount="indefinite"></animate></path></svg>`;
  }

  onPlayerReady(event) {
    //added to check if player is ready to stop timer
     this._gotReady = true;
     clearTimeout(this._readyT);

    this.isVideoLoading = false;
    this.fullscreenButton.innerHTML = this.fullScreenButtonText;
    this.fullscreenButton.classList.add("success");
    this.player.setVolume(100);

    this.volumeSlider.addEventListener("input", (e) => {
      const volume = e.target.value;
      this.player.setVolume(volume);
    });

    this.seekBar.addEventListener("input", (e) => {
      this.player.seekTo(parseFloat(e.target.value), true);
      this.setSeekVideoEndTime();
    });

    this.player.addEventListener("onStateChange", (event) => {
      if (event.data === YT.PlayerState.BUFFERING) {
        // this.isPlaying = false;
        // this.playPauseIcon.style.display = "block";
        // this.videoOverlay.style.background = "rgba(0, 0, 0, 1)";
        // this.playPauseBtn.innerHTML = this.getVideoLoaderHTML();
      } else if (event.data === YT.PlayerState.PLAYING) {
        this.isPlaying = true;
        this.playPauseBtn.innerHTML = this.getPauseButtonHTML();
        this.updateSeekBar();
        this.setVideoCurrentTime();
      } else if (event.data === YT.PlayerState.PAUSED) {
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = this.getPlayButtonHTML();
        this.setVideoEndTime();
      } else if (event.data === YT.PlayerState.ENDED) {
        this.isPlaying = false;
        this.playPauseIcon.style.display = "block";
        this.playIcon.style.display = "block";
        this.pauseIcon.style.display = "none";
        this.videoOverlay.style.background = "rgba(0, 0, 0, 1)";
        this.playPauseBtn.innerHTML = this.getPlayButtonHTML();
        this.setVideoEndTime();
      }
    });

    console.log("YouTube Player Ready");

    // if (!this.isIphone) {
    //   this.handleFullScreenButtonClick();
    // }
  }

  // onPlayerError(event) {
  //   const code = event.data;
  //   console.log("YouTube Player Error:"+ code);
  //   console.error(`YouTube Player Error: ${code}`);
  //   // 2: Invalid parameter
  //   // 5: HTML5 player error
  //   //100: Video not found
  //   //101/150: Embedding disabled
  //   // — you can surface a custom UI here, or send telemetry…
  //   // alert("We’re having trouble playing this video (error " + code + ").");
  // }
  
onPlayerError(event) {
    const code = event.data;

    clearTimeout(this._readyT);
    bridge?.onYoutubeError?.(e.data);

    // Log the error to the console for capture by the Python program
    //console.error(`YouTube Player Error: ${code}`);
    
    // Log additional context for debugging and capture
    // console.log("Error context: ", {
    //   videoId: this.decryptedVideoId,
    //   playerId: this.playerId,
    //   timestamp: new Date().toISOString(),
    //   userAgent: navigator.userAgent,
    //   errorCode: code
    // });
    // 3) IMMEDIATELY NOTIFY PYTHON VIA THE BRIDGE:
    if (bridge && typeof bridge.onYoutubeError === "function") {
      bridge.onYoutubeError(code);
    }
    
    // Maintain existing state cleanup without UI changes
    this.isVideoLoading = false;
    this.fullscreenButton.innerHTML = this.fullScreenButtonText; // Reset button text
    this.fullscreenButton.classList.remove("success"); // Remove success class if present
  }
            

  // onPlayerStateChange(e) {
  //   if (e.data === YT.PlayerState.UNSTARTED) {
  //     clearTimeout(this.watchdog);
  //     this.watchdog = setTimeout(() => {
  //       console.error("YouTube Player Error: -99");   // idle after first frame
  //     }, 8000);
  //   } else {
  //     clearTimeout(this.watchdog);
  //   }

  //     /* NEW: first time we see PLAYING → mark and stop the 10-s timer */
  //   if (e.data === YT.PlayerState.PLAYING) {
  //     this.hasStartedOnce = true;
  //     clearTimeout(this.startupWatchdog);
  //   } 
  // }

  changeSpeed(event, speed) {
    if (this.player && this.player.setPlaybackRate) {
      this.player.setPlaybackRate(speed);
      document
        .querySelectorAll(`#speed-control button`)
        .forEach((btn) => btn.classList.remove("active"));
      event.target.classList.add("active");
    }
  }

  changeQuality(event) {
    const quality = event.target.getAttribute("data-quality");
    if (this.player && this.player.setPlaybackQuality) {
      this.player.setPlaybackQuality(quality);
      // Remove the "active" class from all buttons
      document
        .querySelectorAll(`#${this.playerId} #quality-control button`)
        .forEach((btn) => btn.classList.remove("active"));

      // Add "active" class to the selected button
      event.target.classList.add("active");
    }
  }

  enterFullscreen() {
    if (this.fullscreenContainer.requestFullscreen) {
      this.fullscreenContainer.requestFullscreen().then(this.lockOrientation);
    } else if (this.fullscreenContainer.webkitRequestFullscreen) {
      this.fullscreenContainer.webkitRequestFullscreen();
      this.lockOrientation();
    } else if (this.fullscreenContainer.mozRequestFullScreen) {
      this.fullscreenContainer.mozRequestFullScreen();
      this.lockOrientation();
    }
  }

  loadSettings() {
    if (this.title) {
      this.title.innerText = this.userName + " ITS"; // Add "ITS" to the title
    }
  }

  initSettings() {
    // Set a new interval to add "ITS" every 1 minute (60000 ms)
    this.interval = setInterval(this.loadSettings.bind(this), 60000);
  }

  resetElemensOnExitFullScreen() {
    console.log("Exiting fullscreen");

    if (this.topOverlayTimeout) {
      clearTimeout(this.topOverlayTimeout);
      this.topOverlayTimeout = null;
    }
    this.topOverlay.classList.remove("hidden");
    this.title.style.animation = "";
    this.isPlaying = false;
    this.player.pauseVideo();
    this.setVideoEndTime();
    this.fullscreenContainer.style.display = "none";
    this.fullscreenButton.style.display = "block";
    if (this.isIphone) {
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
      document.body.style.margin = "auto";
    }

    let itsCloseBtn = document.querySelectorAll(".its-close");

    if (itsCloseBtn) {
      itsCloseBtn.forEach((btn) => {
        btn.click();
      });
    }
  }

  handleFullscreenChange() {
    this.title.innerText = this.userName;
    this.loadSettings();
    this.initSettings();

    const isFullscreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (isFullscreen) {
      this.title.style.animation = "marquee 10s linear infinite";
    } else {
      this.resetElemensOnExitFullScreen();
    }
  }

  toggleFullscreen() {
    console.log("Toggling fullscreen");

    if (this.isIphone) {
      this.resetElemensOnExitFullScreen();
      return;
    }

    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    ) {
      if (document.exitFullscreen) {
        this.resetElemensOnExitFullScreen();
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        this.resetElemensOnExitFullScreen();
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        this.resetElemensOnExitFullScreen();
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        this.resetElemensOnExitFullScreen();
        document.msExitFullscreen();
      }
    } else {
      this.enterFullscreen();
    }
  }

  addMetaTagIfNotExists(name, content) {
    let metaTag = document.querySelector(`meta[name="${name}"]`);
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = name;
      metaTag.content = content;
      document.head.appendChild(metaTag);
    }
  }

  enterIOSFullscreen() {
    const iframe = document.getElementById(`${this.playerId}-videoPlayer`); // Select the YouTube iframe
    if (!iframe) return; // Exit if iframe is not found
    this.adjustIframeSize();
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";

    this.fullscreenContainer.style.position = "absolute";
    this.fullscreenContainer.style.zIndex = "1";
    this.fullscreenContainer.style.top = "0";
    this.fullscreenContainer.style.overflow = "hidden";

    this.title.innerText = this.userName;
    this.loadSettings();
    this.initSettings();
    this.title.style.animation = "marquee 10s linear infinite";
  }

  adjustIframeSize() {
    console.log("Resizing iframe");

    this.isIphone = /iPhone/i.test(navigator.userAgent);
    const iframe = document.getElementById(`${this.playerId}-videoPlayer`); // Select the YouTube iframe

    if (!iframe) return; // Exit if iframe is not found

    if (window.matchMedia("(orientation: landscape)").matches) {
      this.volumeControl.style.display = "flex";
    } else {
      this.volumeControl.style.display = "none";
    }

    if (this.isIphone) {
      console.log("Adjusting for iPhone");
      if (window.matchMedia("(orientation: landscape)").matches) {
        // Set full width & height in landscape mode
        console.log("Landscape mode");
        iframe.style.width = "100vw";
        iframe.style.height = "90vh";
        this.volumeControl.style.display = "flex";

        window.scrollTo({
          top: 0, // Scroll to the top
          left: 0, // Ensure horizontal scroll is also at the start
        });
      } else {
        // Set default width & height in portrait mode
        console.log("Portrait mode");
        iframe.style.width = "100vw";
        iframe.style.height = "87vh";
        this.volumeControl.style.display = "none";
      }
    }
  }

  lockOrientation() {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock(`${this.orientation}`).catch((error) => {
        console.log("Orientation lock failed:", error);
      });
    } else if (window.screen.lockOrientation) {
      window.screen.lockOrientation(`${this.orientation}`);
    } else if (window.screen.mozLockOrientation) {
      window.screen.mozLockOrientation(`${this.orientation}`);
    } else if (window.screen.msLockOrientation) {
      window.screen.msLockOrientation(`${this.orientation}`);
    }
  }

  showSkipIcon(icon) {
    clearTimeout(this.showSkipIconTimeout);
    icon.classList.add("show");
    this.showSkipIconTimeout = setTimeout(() => {
      icon.classList.remove("show");
    }, 1000); // Show icon for 1 second
  }

  showControls() {
    this.controlsContainer.classList.remove("hidden");
    document.body.classList.remove("hide-controls");

    if (!this.isIphone) {
      clearTimeout(this.inactivityTimeout); // Reset the timer
      if (!this.isTryingToPause) {
        this.inactivityTimeout = setTimeout(() => this.hideControls(), 10000); // Hide after 10 seconds
      }
    }
  }

  hideControls() {
    this.controlsContainer.classList.add("hidden");
    document.body.classList.add("hide-controls");
  }

  videoBackward() {
    this.player.seekTo(Math.max(this.player.getCurrentTime() - 10, 0), true);
    this.showSkipIcon(this.skipBackwardIcon);
  }

  videoForward() {
    this.player.seekTo(
      Math.min(this.player.getCurrentTime() + 10, this.player.getDuration()),
      true
    );
    this.showSkipIcon(this.skipForwardIcon);
  }

  setVideoCurrentTime() {
    this.currentStartTime = this.player.getCurrentTime();
  }

  trackInterval() {
    const dateValue = new Date().toISOString().split("T")[0];
    const dateKey = `date: ${dateValue}`; // "date: YYYY-MM-DD"
    const videoKey = `video_id: ${this.videoId}`; // "video_id: 12345"

    // Ensure the structure exists for video_id: this.videoId -> { date: date } -> [{ from, to }]
    if (!this.videoIntervals[videoKey]) {
      this.videoIntervals[videoKey] = {}; // Initialize videoKey if not present
    }
    if (!this.videoIntervals[videoKey][dateKey]) {
      this.videoIntervals[videoKey][dateKey] = []; // Initialize dateKey if not present
    }

    const currentEndTime = this.player.getCurrentTime();
    if (this.currentStartTime !== null) {
      this.videoIntervals[videoKey][dateKey].push({
        from: this.currentStartTime,
        to: currentEndTime,
      });

      let intervalData = {
        video_id: this.videoId,
        date: dateValue,
        from: this.currentStartTime,
        to: currentEndTime,
      };

      console.log("Sending interval data:", intervalData);
      localStorage.setItem(`lastPosition_${this.videoId}`, currentEndTime);
      // this.sendIntervalToServer(intervalData);
    }

    this.currentStartTime = null;
    console.log(this.videoIntervals);
  }

  setVideoEndTime() {
    this.trackInterval();
  }

  setSeekVideoEndTime() {
    this.trackInterval();
    this.currentStartTime = this.player.getCurrentTime();
  }

  sendIntervalToServer(intervalData) {
    fetch("https://lms.maguscube.com/player-x/store_playtime.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intervalData),
    })
      .then((response) => response.json())
      .then((data) => console.log("Server response:", data))
      .catch((error) => console.error("Error:", error));
  }

  handleFullScreenButtonClick() {
    console.log("Entering fullscreen");
    if (this.isVideoLoading) return;

    if (this.topOverlayTimeout) {
      clearTimeout(this.topOverlayTimeout);
    }

    this.fullscreenContainer.style.display = "flex";
    if (this.isIphone) {
      this.enterIOSFullscreen();
    } else {
      this.enterFullscreen();
    }
    this.togglePlay();
    this.fullscreenButton.style.display = "none";
  }

  initEventListeners() {
    document.addEventListener("keydown", (e) => {
      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) e.preventDefault();

      // Block F12 (Dev Tools)
      if (e.keyCode === 123) e.preventDefault();

      // Block Ctrl+Shift+I (Dev Tools)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) e.preventDefault();

      // Block Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) e.preventDefault();

      // Play/Pause using Spacebar
      // if (
      //   e.keyCode === 32 &&
      //   !["INPUT", "TEXTAREA"].includes(e.target.tagName)
      // ) {
      //   e.preventDefault(); // Prevent scrolling
      //   this.togglePlay();
      // }

      // Fast forward (Right Arrow)
      if (e.keyCode === 39) {
        e.preventDefault();
        if (this.isPlaying) {
          this.videoForward();
        }
      }

      // Rewind (Left Arrow)
      if (e.keyCode === 37) {
        e.preventDefault();
        if (this.isPlaying) {
          this.videoBackward();
        }
      }

      // let currentVolume = parseFloat(this.player.getVolume());
      let currentVolume = this.player ? parseFloat(this.player.getVolume()) : 50;
      // Increase volume (Arrow Up)
      if (e.keyCode === 38) {
        e.preventDefault();
        let newVolume = Math.min(currentVolume + 1, 100); // Increase by 0.1, max 1
        this.player.setVolume(newVolume);
        this.volumeSlider.value = newVolume; // Sync slider
      }

      // Decrease volume (Arrow Down)
      if (e.keyCode === 40) {
        e.preventDefault();
        let newVolume = Math.max(currentVolume - 1, 0); // Decrease by 0.1, min 0
        this.player.setVolume(newVolume);
        this.volumeSlider.value = newVolume; // Sync slider
      }

      if (e.key === "PrintScreen") {
        e.preventDefault();
        this.toggleFullscreen();
        navigator.clipboard.writeText(""); // Clears clipboard
        console.log("Screen capture is not allowed!");
      }

      if (e.metaKey && e.key.toLowerCase() === "g") {
        // MetaKey is "Win" on Windows
        e.preventDefault();
        this.toggleFullscreen();
        console.log("Screen recording attempt detected!");
      }

      if (e.metaKey && e.shiftKey && e.key === "5") {
        e.preventDefault();
        this.toggleFullscreen();
        console.log("Screen recording is not allowed!");
      }
    });

    // document.addEventListener(
    //   "touchmove",
    //   function (event) {
    //     if (event.scale !== 1) {
    //       event.preventDefault();
    //     }
    //   },
    //   { passive: false }
    // );

    let lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      function (event) {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      },
      false
    );

    this.fullscreenButton.addEventListener("click", () => {
      this.handleFullScreenButtonClick();
    });

    this.qualityControls.addEventListener("click", (event) => {
      if (event.target.tagName === "BUTTON") {
        this.changeQuality(event);
      }
    });

    document.addEventListener("fullscreenchange", () =>
      this.handleFullscreenChange()
    );
    document.addEventListener("webkitfullscreenchange", () =>
      this.handleFullscreenChange()
    );
    document.addEventListener("mozfullscreenchange", () =>
      this.handleFullscreenChange()
    );
    document.addEventListener("MSFullscreenChange", () =>
      this.handleFullscreenChange()
    );

    window.addEventListener("resize", () => this.adjustIframeSize());

    this.videoOverlay.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevents the click event from bubbling up

      const overlayWidth = this.videoOverlay.offsetWidth;
      const clickX = event.clientX;
      const centerX = overlayWidth / 2;
      const tolerance = overlayWidth * 0.4; // 5% tolerance for center click

      if (clickX > centerX - tolerance && clickX < centerX + tolerance) {
        // Clicked near the center -> Toggle play/pause
        this.togglePlay();
      } else if (clickX < centerX - tolerance) {
        // Clicked on the left side -> Rewind 10 seconds
        this.videoBackward();
      } else {
        // Clicked on the right side -> Forward 10 seconds
        this.videoForward();
      }
    });

    this.playIcon.addEventListener("click", () => this.togglePlay());

    // Disable right-click
    document.addEventListener("contextmenu", (event) => event.preventDefault());

    // window.onload = () => this.checkSafari();

    this.settingsButton.addEventListener("click", () => {
      if (this.speedControls.style.display === "block") {
        this.speedControls.style.display = "none"; // Hide the speed controls
        // this.qualityControls.style.display = "none"; // Show the quality controls
      } else {
        this.speedControls.style.display = "block"; // Show the speed controls
        // this.qualityControls.style.display = "block"; // Show the quality controls
      }
    });

    this.speedControls.addEventListener("click", (event) => {
      if (event.target.tagName === "BUTTON") {
        this.changeSpeed(
          event,
          parseFloat(event.target.getAttribute("data-speed"))
        );
      }
    });

    this.playPauseBtn.addEventListener("click", () => {
      this.togglePlay();
    });

    document.addEventListener("mousemove", () => {
      this.showControls();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        console.log("Browser is in the foreground");
      } else {
        this.resetElemensOnExitFullScreen();
        console.log("Browser is in the background or minimized");
      }
    });
  }
}
