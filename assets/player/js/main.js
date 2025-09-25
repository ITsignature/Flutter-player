function decode_token(value) {
    if (value == '') {
        return;
    }
    return atob(value);
}

function showNoContentScreen() {
    document.body.innerHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Educational Video Player</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #0d73d3, #123b88);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                color: white;
            }

            .container {
                width: 100%;
                max-width: 500px;
                padding: 30px 25px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                text-align: center;
            }

            .logo {
                width: 70px;
                height: 70px;
                background: linear-gradient(45deg, #1d72d3, #051c4e);
                border-radius: 20px;
                margin: 0 auto 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 34px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                animation: float 3s ease-in-out infinite;
            }

            .title {
                font-size: clamp(22px, 5vw, 28px);
                font-weight: 600;
                margin-bottom: 12px;
                background: linear-gradient(45deg, #ffffff, #f1f2f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .subtitle {
                font-size: 16px;
                margin-bottom: 25px;
                opacity: 0.9;
                line-height: 1.5;
            }

            .status-badge {
                display: inline-block;
                background: rgba(255, 193, 7, 0.2);
                color: #ffc107;
                padding: 8px 20px;
                border-radius: 25px;
                font-size: 13px;
                font-weight: 500;
                margin-bottom: 25px;
                border: 1px solid rgba(255, 193, 7, 0.3);
            }

            .instructions {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 25px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .instructions h3 {
                font-size: 17px;
                margin-bottom: 15px;
                color: #fff;
            }

            .step {
                display: flex;
                align-items: flex-start;
                margin-bottom: 10px;
                font-size: 14px;
                opacity: 0.9;
            }

            .step-number {
                background: rgba(255, 255, 255, 0.2);
                width: 22px;
                height: 22px;
                min-width: 22px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
                font-size: 12px;
                font-weight: bold;
            }

            .footer {
                margin-top: 25px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 12px;
                opacity: 0.7;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }

            @media (max-width: 480px) {
                .container {
                    padding: 20px 15px;
                }

                .step {
                    flex-direction: row;
                    align-items: center;
                }

                .subtitle {
                    font-size: 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">▶</div>
            <h1 class="title">Educational Video Player</h1>
            <p class="subtitle">Seamless video learning for students</p>
            <div class="status-badge">📡 No content available</div>
            <div class="instructions">
                <h3>How to access your course videos:</h3>
                <div class="step">
                    <div class="step-number">1</div>
                    <span>Visit your educational institution's learning portal</span>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <span>Click on any video lesson link</span>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <span>Videos will automatically open in this player</span>
                </div>
            </div>
            <p style="margin-bottom: 20px; opacity: 0.8; font-size: 14px;">
                This app works with your institution's video content system.<br>
                Open videos from your learning portal to get started.
            </p>
            <div class="footer">
                <p>Compatible with all major educational platforms</p>
                <p>Version 1.0 • Secure & Private</p>
            </div>
        </div>
    </body>
    </html>`;
}


function initPlayer(videoId) {
    const videoModal = document.getElementById('videoListModal');
    const modalInstance = bootstrap.Modal.getOrCreateInstance(videoModal);
    if (modalInstance) {
        modalInstance.hide();
    }

    const itsModalBody = document.getElementById('itsModalBody');
    itsModalBody.innerHTML = '';

    if (itsModalBody && videoId) {
        let newDivEl = document.createElement('div');
        newDivEl.id = videoId;
        newDivEl.classList.add("d-flex", "h-100", "w-100")
        itsModalBody.appendChild(newDivEl);
        let player = new ITSVideoPlayer(videoId, videoId, 'ITS');
    }
}

let token = new URLSearchParams(window.location.search).get("id")

if (!token) {
    // document.body.innerHTML = "<h2 style='color:#fff;text-align:center;margin-top:20%'>No token provided.</h2>";
    showNoContentScreen();
} else {
    token = token.replace(/\/$/, "");
    console.log("Token (Base64 x2):", token);

    const first_token = decode_token(token);
    console.log("First decode:", first_token);

    const json_string = decode_token(first_token);
    console.log("Second decode (JSON string):", json_string);

    try {
        const json_data = JSON.parse(json_string);
        console.log("Parsed JSON:", json_data);

        const idParam = json_data.selected_video_id;
        const videoList = json_data.video_ids;

        initPlayer(idParam);

        // Inject video list if present
        if (Array.isArray(videoList) && videoList.length > 0) {
            const videoListContainer = document.getElementById('video-list-container');
            const btnMoreRecordings = document.getElementById('btn-more-recordings');

            videoListContainer.innerHTML = "";

            videoList.forEach(videoId => {
                let div = `<div class="col position-relative" onclick="initPlayer(&quot;${videoId}&quot;)" style="cursor: pointer;">
              <img src="https://i.ytimg.com/vi/${atob(videoId)}/hqdefault.jpg" class="img-fluid w-100">
              <button class="btn btn-sm btn-danger px-2 rounded-circle position-absolute top-50 start-50 translate-middle">
                ▶
              </button>
            </div>`
                videoListContainer.insertAdjacentHTML('beforeend', div);
            });

              if (btnMoreRecordings) {
                    btnMoreRecordings.classList.toggle('d-none', videoList.length <= 1);
                }
         

        } else {

            
          

               const btnMoreRecordings = document.getElementById('btn-more-recordings');
                if (btnMoreRecordings) {
                    btnMoreRecordings.classList.add('d-none');
                }
        }

    } catch (err) {
        console.error("Failed to parse token JSON:", err);
    }
}