var messages = $(".messages-content");

function updateScrollbar() {
  messages.mCustomScrollbar("update").mCustomScrollbar('scrollTo', 'bottom', {
      scrollInertia: 10,
      timeout: 0
  });
}

function setDate() {
  var d = new Date();
  var timestamp = $("<div>").addClass("timestamp").text(d.getHours() + ":" + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes());
  timestamp.appendTo($('.message:last'));
}

function insertMessageAI(msgText, role) {
  // Remove previous typing animation
  $(".message.typing.ai").remove();

  // Create a new message element with 'response' class to differentiate from streaming content
  let aiResponse = $("<div>").addClass("message ai response");
  aiResponse.appendTo($('.mCSB_container'));

  aiResponse.text(msgText);
  aiResponse.addClass(role || "ai");

  setDate();
  updateScrollbar();
}

function insertMessage(msgText) {
  if ($.trim(msgText) === "") {
      return false;
  }

  var msg = $("<div>").addClass("message personal").text(msgText);
  msg.appendTo($('.mCSB_container'));
  setDate();
  updateScrollbar();
  $(".action-box-input").val(null);
}

function showTypingAnimation(role) {
  var typing = $("<div>").addClass("message typing");
  typing.addClass(role || "ai");
  typing.appendTo($('.mCSB_container'));
  updateScrollbar();
  return typing; // Return the created typing element
}

function hideTypingAnimation(role) {
  $(".message.typing." + (role || "ai")).remove();
}

$(document).ready(function () {
  $(".action-box-submit").on("click", function (e) {
      e.preventDefault();
      sendMessage($(".action-box-input").val());
  });

  $(".action-box-input").on("keydown", function (e) {
      if (e.which === 13) {
          e.preventDefault();
          sendMessage($(".action-box-input").val());
      }
  });

  messages.mCustomScrollbar();
});

// WebSocket code
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const chatSocket = new WebSocket(protocol + '//' + window.location.host + '/ws/chat/');

function setSendingState(sending) {
  if (sending) {
    $(".action-box-submit").prop("disabled", true);
    $(".action-box-input").prop("disabled", true);
  } else {
    $(".action-box-submit").prop("disabled", false);
    $(".action-box-input").prop("disabled", false);
  }
}

function sendMessage(message) {
  insertMessage(message);
  // Show typing animation and store the created element in a variable
  hideTypingAnimation("ai");
  var typingAnimation = showTypingAnimation("ai");


  // Disable input and submit button
  setSendingState(true);

  // Send the message to the server
  chatSocket.send(
      JSON.stringify({
          message: message
      })
  );
}
// Add a variable to store the partial response outside the chatSocket.onmessage callback
let partialResponse = '';

chatSocket.onmessage = function (e) {
  var data;
  try {
    data = JSON.parse(e.data);
  } catch (error) {
    console.error("Error parsing JSON:", e.data);
    console.error(error);
    return;
  }

  if (data.type === 'typing_animation') {
    if (data.typing_animation) {
      // Remove previous typing animations
      hideTypingAnimation("ai");

      // Add a new typing animation
      showTypingAnimation("ai");
    } else {
      hideTypingAnimation("ai");
    }
  } else if (data.type === 'streamed_token') {
    var streamedData = data;

    if (streamedData.partial) {
      if ($(".message.streamed").length > 0) {
        // If there is already a streamed message, append the new streamed token to it
        $(".message.streamed").text(partialResponse + streamedData.message);
      } else {
        // If there is no streamed message, create a new one
        let streamedMessage = $("<div>").addClass("message streamed");
        streamedMessage.appendTo($('.mCSB_container'));
        streamedMessage.text(partialResponse + streamedData.message);
        streamedMessage.addClass("ai");
      }        
      // Update the scrollbar
      updateScrollbar();
    } else {
      // If this is the final streamed token, append it to the partialResponse and proceed with the rest of the processing
      $(".message.streamed").remove();
      var message = partialResponse + streamedData.message;

      // Reset the partialResponse variable for future messages
      partialResponse = '';

      console.log(message);

      // Hide the typing animation
      hideTypingAnimation("ai");

      // Set the AI's response with the new content
      insertMessageAI(message, "ai");

      // Enable input and submit button
      setSendingState(false);
    }
  }
};

chatSocket.onclose = function (e) {
    console.error("Chat socket closed unexpectedly");
};