let $ = jQuery;
let socket;

// Placeholder for your secret key
const secretKey = "your-secret-key";

// Initialize WebSocket connection and event handlers
function initializeWebSocket() {
  socket = new WebSocket("ws://localhost:8000/message");

  socket.onopen = function (event) {
    console.log("WebSocket connection established.");
  };

  socket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    const msgClass = data.isMe ? "user-message" : "other-message";
    const sender = data.isMe ? "You" : data.username;
    const message = decryptMessage(data.data);
    console.log("Decrypted message received:", message); // Log the decrypted message

    const messageElement = $("<li>").addClass("clearfix");
    messageElement.append(
      $("<div>")
        .addClass(msgClass)
        .text(sender + ": " + message)
    );
    $("#messages").append(messageElement);
    $("#chat").scrollTop($("#chat")[0].scrollHeight);
  };
}

// Show the join chat modal
function showJoinModal() {
  $("#username-form").show();
  $("#chat").hide();
  $("#message-input").hide();
  $("#usernameModal").modal("show");
}

<<<<<<< Updated upstream
$("#open-modal").click(function () {
  showJoinModal();
});

// Function to handle joining the chat
function joinChat() {
  $("#username-form").hide();
  $("#chat").show();
  $("#message-input").show();
  $("#usernameModal").modal("hide");
}

$("#join").click(function () {
  initializeWebSocket();
  joinChat();
});

// Send message event handler
$("#send").click(function () {
  sendMessage();
});

$("#message").keydown(function (event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});

// Function to encrypt messages
function encryptMessage(message) {
  return CryptoJS.AES.encrypt(message, secretKey).toString();
}

// Function to decrypt messages
function decryptMessage(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Function to send message and generate QR code for the encrypted message
function sendMessage() {
  const message = $("#message").val();
  if (message) {
    const encryptedMessage = encryptMessage(message);
    console.log("Encrypted message sent:", encryptedMessage); // Log the encrypted message

    // Generate QR code for the encrypted message
    const qrCodeElement = $("<div>").addClass("qr-code");
    new QRCode(qrCodeElement[0], {
      text: encryptedMessage,
      width: 128,
      height: 128,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
    $("#messages").append(qrCodeElement); // Append the QR code to the messages

    socket.send(
      JSON.stringify({
        message: encryptedMessage,
        username: $("#usernameInput").val(),
      })
    );
    $("#message").val("");
  }
}
=======
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
>>>>>>> Stashed changes
