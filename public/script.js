let socket = io();
const chatWindow = document.querySelector(".chat_window");
const chatForm = document.querySelector(".chat_form");
const chatInput = document.querySelector(".chat_input");

socket.on("chef_chat_message", (msg) => {
  renderMessage(msg);
  window.scrollTo(0, document.body.scrollHeight);
});

const renderMessage = (msg) => {
  const div = document.createElement("div");
  div.classList.add("render_message");
  div.innerHTML = `<p>${msg}</p>`;
  chatWindow.appendChild(div);
};

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!chatInput.value) {
    alert("Enter your preferred option");
  } else {
    renderMessage(chatInput.value);

    socket.emit("client_chat_message", chatInput.value.trim());
    chatInput.value = "";
  }
});
