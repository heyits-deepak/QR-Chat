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
