let $ = jQuery;
let socket;

// Placeholder for your secret key
const secretKey = "your-secret-key";

// Initialize WebSocket connection and event handlers
function initializeWebSocket() {
  socket = new WebSocket("ws://localhost:8000/message");

  socket.onopen = function(event) {
    console.log("WebSocket connection established.");
  };

  socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    const msgClass = data.isMe ? "user-message" : "other-message";
    const sender = data.isMe ? "You" : data.username;
    const message = decryptMessage(data.data);
    console.log("Decrypted message received:", message); // Log the decrypted message

    if (data.type && data.type === "voice") {
      // Handle voice message
      const messageElement = $("<li>").addClass("clearfix");
      const audioElement = document.createElement('audio');
      audioElement.controls = true;
      audioElement.src = message;
      messageElement.append($("<div>").addClass(msgClass).html(sender + ": ").append(audioElement));
      $("#messages").append(messageElement);
    } else {
      // Handle text message
      const messageElement = $("<li>").addClass("clearfix");
      messageElement.append($("<div>").addClass(msgClass).text(sender + ": " + message));
      $("#messages").append(messageElement);
    }

    $("#chat").scrollTop($("#chat")[0].scrollHeight); // Auto-scroll to the latest message
  };
}

// Show the join chat modal
function showJoinModal() {
  $("#username-form").show();
  $("#chat").hide();
  $("#message-input").hide();
  $("#voice-message-input").hide(); // Hide voice message input
  $("#usernameModal").modal("show");
}

$("#open-modal").click(function() {
  showJoinModal();
});

// Function to handle joining the chat
function joinChat() {
  $("#username-form").hide();
  $("#chat").show();
  $("#message-input").show();
  $("#voice-message-input").show(); // Show voice message input
  $("#usernameModal").modal("hide");
}

$("#join").click(function() {
  initializeWebSocket();
  joinChat();
});

// Send message event handler for text
$("#send").click(function() {
  const message = $("#message").val();
  sendMessage(message, "text");
});

$("#message").keydown(function(event) {
  if (event.key === "Enter") {
    const message = $("#message").val();
    sendMessage(message, "text");
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
function sendMessage(message, type) {
  if (message) {
    const encryptedMessage = encryptMessage(message);
    console.log("Encrypted message sent:", encryptedMessage); // Log the encrypted message

    // Generate QR code for the encrypted message if type is text
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
      $("#messages").append(qrCodeElement); // Append the QR code to the messages
    }

    socket.send(JSON.stringify({
      message: encryptedMessage,
      type: type,
      username: $("#usernameInput").val(),
    }));
    $("#message").val(""); // Clear input field after sending
    $("#chat").scrollTop($("#chat")[0].scrollHeight); // Auto-scroll to the latest message
  }
}

// Add functions for recording and sending voice messages
let mediaRecorder;
let audioChunks = [];

async function startRecording() {
  audioChunks = [];
  let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
  };
  mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks);
      const audioUrl = URL.createObjectURL(audioBlob);
      const base64Audio = await blobToBase64(audioBlob);
      const encryptedMessage = encryptMessage(base64Audio);
      console.log("Encrypted audio message sent:", encryptedMessage); // Log for debugging

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

      socket.send(JSON.stringify({
          message: encryptedMessage,
          type: "voice",
          username: $("#usernameInput").val(),
      }));
  };
  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.stop();
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
  });
}
// Add UI event listeners or controls for starting and stopping recordings
document.getElementById("start-recording").addEventListener("click", startRecording);
document.getElementById("stop-recording").addEventListener("click", stopRecording);

$(document).ready(function() {
    // Your initialization code like opening WebSocket connection
    initializeWebSocket();
});