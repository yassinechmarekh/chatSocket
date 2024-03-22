var express = require("express");
var app = express();
var server = require("http").createServer(app);
var mongoose = require("mongoose");
const connectedUsers = [];
const ObjectId = mongoose.Types.ObjectId;

mongoose.connect("mongodb://localhost/Chat");

//On va cherche les models
require("./models/user.model");
require("./models/chat.model");
require("./models/room.model");
var User = mongoose.model("user");
var Chat = mongoose.model("chat");
var Room = mongoose.model("room");

app.use(express.static(__dirname + "/public"));

//ROUTER
app.get('/', async function(req, res) {
  try {
    const users = await User.find().exec();
    const channels = await Room.find().exec();

    res.render('index.ejs', { users, channels });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur interne du serveur');
  }
});



app.use(function (req, res, next) {
  res.setHeader("Content-type", "text/html");
  res.status(404).send("Page introuvable !");
});

const io = require("socket.io")(server);
io.on("connection", (socket) => {
  socket.on("pseudo", (pseudo) => {
    User.findOne({ pseudo: pseudo })
  .then(user => {
    if (user) {

      // On join automatiquement le channel "salon1" par défaut
      _joinRoom("salon1");

      // On conserve le pseudo dans la variable socket qui est propre à chaque utilisateur
      socket.pseudo = pseudo;
      connectedUsers.push(socket);
      // On previent les autres
      socket.broadcast.to(socket.channel).emit('newUser', pseudo);
    } else {

      // On join automatiquement le channel "salon1" par défaut
      _joinRoom("salon1");

      // L'utilisateur n'existe pas encore, créer un nouvel utilisateur
      var user = new User();
      user.pseudo = pseudo;
      user.save();

      // Ajouter le socket à connectedUsers après la création de l'utilisateur
      socket.pseudo = pseudo;
      connectedUsers.push(socket);
      socket.broadcast.to(socket.channel).emit("newUser", pseudo);
      socket.broadcast.emit("newUserInDb", pseudo);
    }
    })
    .catch(err => {
      // Gérer les erreurs ici
      console.error(err);
    });

    Chat.find()  // Utiliser simplement Chat.find() sans callback
        .then(messages => {
            socket.emit('oldMessages', messages);
        })
        .catch(err => {
            // Gérer les erreurs ici
            console.error(err);
        });
    
    socket.pseudo = pseudo;
    socket.broadcast.emit("newUser", pseudo);
  });
  

  // Quand un nouveau message est envoyé
socket.on('newMessage', async (message, receiver) => {
  if (receiver === "all") {
    var chat = new Chat();
    chat._id_room = socket.channel;
    chat.sender = socket.pseudo;
    chat.receiver = receiver;
    chat.content = message;
    await chat.save();

    socket.broadcast.to(socket.channel).emit('newMessageAll', { message: message, pseudo: socket.pseudo });

  } else {
    try {
      const user = await User.findOne({ pseudo: receiver }).exec();
      if (!user) {
        return false;
      } else {
        socketReceiver = connectedUsers.find(element => element.pseudo === user.pseudo);

        if (socketReceiver) {
          socketReceiver.emit('whisper', { sender: socket.pseudo, message: message });
        }

        var chat = new Chat();
        chat.sender = socket.pseudo;
        chat.receiver = receiver;
        chat.content = message;
        await chat.save();
      }
    } catch (err) {
      console.error("Error while finding user:", err);
      // Handle error appropriately
    }
  }
});




  socket.on("writting", (pseudo) => {
    socket.broadcast.emit("writting", pseudo);
  });
  socket.on("notWritting", () => {
    socket.broadcast.emit("notWritting");
  });
  socket.on("disconnect", () => {
    socket.broadcast.emit("quitUser", socket.pseudo);
  });

  socket.on('changeChannel', (channel) => {
    _joinRoom(channel);
  });

  
  

  async function _joinRoom(channelParam) {
    // Declare previousChannel here
    let previousChannel;
  
    // On quitte tous les channels et on rejoint le channel ciblé
    socket.leaveAll();
    socket.join(channelParam);
    socket.channel = channelParam;
  
    try {
      const channel = await Room.findOne({ name: socket.channel }).exec();
  
      if (channel) {
        const messages = await Chat.find({ _id_room: socket.channel }).exec();
  
        if (!messages) {
          return false;
        } else {
          socket.emit('oldMessages', messages, socket.pseudo);
  
          // Si l'utilisateur vient d'un autre channel, on le fait passer, sinon on ne fait passer que le nouveau
          if (previousChannel) {
            socket.emit('emitChannel', { previousChannel: previousChannel, newChannel: socket.channel });
          } else {
            socket.emit('emitChannel', { newChannel: socket.channel });
          }
        }
      } else {
        const room = new Room();
        room.name = socket.channel;
        await room.save();
  
        socket.broadcast.emit('newChannel', socket.channel);
      }
    } catch (err) {
      console.error(err);
      // Gérez l'erreur en fonction de vos besoins
    }
  }
  




});

server.listen(8080, () => console.log("Server started at port: 8080"));
