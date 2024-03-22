var socket = io.connect("http://localhost:8080");

while (!pseudo) {
  var pseudo = prompt("Quel est ton nom ?");
  var pass = prompt("Votre mot de pass :");
}

socket.emit("pseudo", pseudo);
document.title = pseudo + "-" + document.title;

// Quand on soumet le formulaire
document.getElementById("chatForm").addEventListener("submit", (e) => {
  e.preventDefault();

  // On récupère la valeur dans l'input et on met le input a 0
  const textInput = document.getElementById("msgInput").value;
  document.getElementById("msgInput").value = "";

  // Si la valeur > 0, on envoie un message au serveur contenant la valeur de l'input
  if (textInput.length > 0) {
    socket.emit("newMessage", textInput);
    createElementFunction("newMessageMe", textInput);
  } else {
    return false;
  }
});

socket.on("newUser", (pseudo) => {
  createElementFunction("newUser", pseudo);
});

socket.on("quitUser", (pseudo) => {
  createElementFunction("quitUser", pseudo);
});

socket.on("newMessageAll", (content) => {
  createElementFunction("newMessageAll", content);
});

socket.on("oldMessages",(messages) => {
  messages.forEach(message => {
    if(message.sender === pseudo){
      createElementFunction("oldMessagesMe", message);
    }else{
      createElementFunction("oldMessages", message);
    }
  });
});

// Une personne est en train d'ecrire
socket.on("writting", (pseudo) => {
  document.getElementById("isWritting").textContent =
    pseudo + " est en train d'écrire";
});
// Elle a arrêté d'ecrire
socket.on("notWritting", (pseudo) => {
  document.getElementById("isWritting").textContent = "";
});

// S'il ecrit on emet 'writting' au serveur
function writting() {
  socket.emit("writting", pseudo);
}

// S'il ecrit plus on emet 'notWritting' au serveur
function notWritting() {
  socket.emit("notWritting");
}

// On attend qu'un nouveau channel soit créé
socket.on('newChannel', (newChannel) => {
  createChannel(newChannel)
});

function createChannel(newRoom) {

  const newRoomItem = document.createElement("li");
  newRoomItem.classList.add('elementList');
  newRoomItem.id = newRoom;
  newRoomItem.textContent = newRoom;
  newRoomItem.setAttribute('onclick', "_joinRoom('" + newRoom + "')")
  document.getElementById('roomList').insertBefore(newRoomItem, document.getElementById('createNewRoom'));

}

function _joinRoom(channel){
  
  // On réinitialise les messages
  document.getElementById('msgContainer').innerHTML = "";

  // On émet le changement de room
  socket.emit('changeChannel', channel);

  
}

function _createRoom(){
  while(!newRoom){
      var newRoom = prompt('Quel est le nom de la nouvelle Room ?');
  }
  createChannel(newRoom);
  _joinRoom(newRoom);
}

function createElementFunction(element, content) {
  const newElement = document.createElement("div");

  switch (element) {
    case "newUser":
      newElement.classList.add(element, "message");
      newElement.textContent = content + " a rejoint le chat";
      document.getElementById("msgContainer").appendChild(newElement);
      break;

    case "quitUser":
      newElement.classList.add(element, "message");
      newElement.textContent = content + " a quitté le chat";
      document.getElementById("msgContainer").appendChild(newElement);
      break;

    case "newMessageMe":
      newElement.classList.add(element, "message");
      newElement.innerHTML = pseudo + ": " + content;
      document.getElementById("msgContainer").appendChild(newElement);
      break;

    case "newMessageAll":
      newElement.classList.add(element, "message");
      newElement.innerHTML = content.pseudo + ": " + content.message;
      document.getElementById("msgContainer").appendChild(newElement);
      break;

    case 'oldMessages':
      newElement.classList.add(element, 'message');
      newElement.innerHTML = content.sender + ': ' + content.content;
      document.getElementById('msgContainer').appendChild(newElement);
      break;

    case 'oldMessagesMe':
      newElement.classList.add('newMessageMe', 'message');
      newElement.innerHTML = content.sender + ': ' + content.content;
      document.getElementById('msgContainer').appendChild(newElement);
      break;
  }
}
