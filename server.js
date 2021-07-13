const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
	cors: {
		origin: '*'
	}
});
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
	debug: true,
});

//to store names of users
const users = {};

app.use("/peerjs", peerServer);
app.use(express.static("public"));


//root route will redirect to a room id
app.get("/", (req, res) => {
	res.redirect(`/${uuidv4()}`);
});


//the view "room" is rendered
app.get("/:room", (req, res) => {
	res.render("room", { roomId: req.params.room });
});


io.on("connection", (socket) => {
	socket.on("join-room", (roomId, userId, userName) => {
		socket.join(roomId);
		
		//used socket.id as unique ids to store names of users
		users[socket.id] = userName;
		
		//emit msg 'user-connected' to start self video streaming on script side
		io.to(roomId).emit('user-connected',userId, userName);
		
		//emit "creatMessage" when "message" received from script side
		socket.on("message", (message) => {
			io.to(roomId).emit("createMessage", message, userName);
		});
		
		//emit 'user-disconnected' when a user disconnects and delete record
		socket.on('disconnect', () => {
			io.to(roomId).emit('user-disconnected', userId, userName);
			delete users[socket.id];
		})
	});
});

server.listen(process.env.PORT || 3030);