let $ = jQuery;
let socket;

const secretKey = "your-secret-key";

function initializeWebSocket() {
    if (!socket || socket.readyState === WebSocket.CLOSED) {
        socket = new WebSocket("ws://localhost:8000/message");

        socket.onopen = function(event) {
            console.log("WebSocket connection established.");
        };

        socket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            const msgClass = data.isMe ? "user-message" : "other-message";
            const sender = data.isMe ? "You" : data.username;
            const message = decryptMessage(data.data);
            console.log("Decrypted message received:", message);

            const messageElement = $("<li>").addClass("clearfix");
            if (data.type && data.type === "voice") {
                const audioElement = document.createElement('audio');
                audioElement.controls = true;
                audioElement.src = message;
                messageElement.append($("<div>").addClass(msgClass).html(sender + ": ").append(audioElement));
            } else {
                messageElement.append($("<div>").addClass(msgClass).text(sender + ": " + message));
            }
            $("#messages").append(messageElement);

            $("#chat").scrollTop($("#chat")[0].scrollHeight);
        };
    }
}

function showJoinModal() {
    $("#username-form").show();
    $("#chat").hide();
    $("#message-input").hide();
    $("#voice-message-input").hide();
    $("#usernameModal").modal("show");
}

function joinChat() {
    $("#username-form").hide();
    $("#chat").show();
    $("#message-input").show();
    $("#voice-message-input").show();
    $("#usernameModal").modal("hide");
}

function encryptMessage(message) {
    return CryptoJS.AES.encrypt(message, secretKey).toString();
}

function decryptMessage(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}

function sendMessage(message, type) {
    if (message) {
        const encryptedMessage = encryptMessage(message);
        console.log("Encrypted message sent:", encryptedMessage);

        // Reintroduce QR code generation for text messages
        if (type === "text") {
            const qrCodeElement = $("<div>").addClass("qr-code");
            new QRCode(qrCodeElement[0], {
                text: encryptedMessage,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H,
            });
            $("#messages").append(qrCodeElement);
        }

        socket.send(JSON.stringify({
            message: encryptedMessage,
            type: type,
            username: $("#usernameInput").val(),
        }));
        $("#message").val("");
        $("#chat").scrollTop($("#chat")[0].scrollHeight);
    }
}

let mediaRecorder;
let audioChunks = [];

async function startRecording() {
  audioChunks = [];
  // It's more broadly compatible to use audio/webm
  let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  
  mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
  };
  
  mediaRecorder.onstop = async () => {
      // Use the correct MIME type
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const base64Audio = await blobToBase64(audioBlob);
      sendMessage(base64Audio, "voice");
  };
  
  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.stop();
}

// Keep a single, corrected blobToBase64 function
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
          // Correct handling for Base64 encoding, including the data URL header
          resolve(reader.result); // Use the full result, including data URL schema
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
  });
}


$(document).ready(function() {
    $("#open-modal").off("click").on("click", showJoinModal);
    $("#join").off("click").on("click", function() {
        initializeWebSocket();
        joinChat();
    });
    $("#send").off("click").on("click", function() {
        const message = $("#message").val();
        sendMessage(message, "text");
    });
    $("#message").off("keydown").on("keydown", function(event) {
        if (event.key === "Enter") {
            const message = $(this).val();
            sendMessage(message, "text");
        }
    });
    $("#start-recording").off("click").on("click", function() {
        startRecording();
        $(this).hide(); // Hide start button
        $("#stop-recording").show(); // Show stop button
    });
    $("#stop-recording").off("click").on("click", function() {
        stopRecording
        stopRecording();
        $(this).hide(); // Hide stop button
        $("#start-recording").show(); // Show start button for new recordings
    });

    initializeWebSocket();
});
