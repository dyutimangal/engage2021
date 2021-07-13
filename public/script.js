const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true; //so you dont hear self
const peers = {}

//Event Listener for button to close chat display on event 'click'
backBtn.addEventListener("click", () => {
	document.querySelector(".main__left").style.display = "flex";
	document.querySelector(".main__left").style.flex = "1";
	document.querySelector(".main__right").style.display = "none";
	document.querySelector(".header__back").style.display = "none";
});

//Event Listener for button to show chat display on event 'click'
showChat.addEventListener("click", () => {
	document.querySelector(".main__right").style.display = "flex";
	document.querySelector(".header__back").style.display = "block";
});

//Prompt user entering room to enter name
const user = prompt("Enter your name");

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});


peer.on("open", (id) => {
	connected(user);
	//Sends event 'join-room' to server
	socket.emit("join-room", ROOM_ID, id, user);
});



//set up self video stream and add it to display
let myVideoStream;
navigator.mediaDevices.getUserMedia({
	audio: true,
	video: true,
  })
  .then((stream) => {
	myVideoStream = stream;
	addVideoStream(myVideo, stream);

	peer.on("call", (call) => {
		call.answer(stream);
		const video = document.createElement("video");
		call.on("stream", (userVideoStream) => {
			addVideoStream(video, userVideoStream);
		});
	});
	
	//Function call when 'user-connected' event received from server
	socket.on("user-connected", (userId, userName) => {
		connectToNewUser(userId, stream);
		if(userName!=user) connected(userName);
	});
  });



const connectToNewUser = (userId, stream) => {
	const call = peer.call(userId, stream);
	const video = document.createElement("video");
	call.on("stream", (userVideoStream) => {
		addVideoStream(video, userVideoStream);
	});
	call.on('close',() => {
		video.remove()
	})
	peers[userId] = call;
};



const addVideoStream = (video, stream) => {
	video.srcObject = stream;
	video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};



//chat functionality starts from here
let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

//Event Listener when user clicks '+' button to send chat 
send.addEventListener("click", (e) => {
	if (text.value.length !== 0) {
		socket.emit("message", text.value);
		text.value = "";
	}
});

//Event Listener when user preses enter button to send chat 
text.addEventListener("keydown", (e) => {
	if (e.key === "Enter" && text.value.length !== 0) {
		socket.emit("message", text.value);
		text.value = "";
	}
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

//Event Listener when user clicks mute button
muteButton.addEventListener("click", () => {
	const enabled = myVideoStream.getAudioTracks()[0].enabled;
	if (enabled) {
		myVideoStream.getAudioTracks()[0].enabled = false;
		html = `<i class="fas fa-microphone-slash"></i>`;
		muteButton.classList.toggle("background__red");
		muteButton.innerHTML = html;
	}else{
		myVideoStream.getAudioTracks()[0].enabled = true;
		html = `<i class="fas fa-microphone"></i>`;
		muteButton.classList.toggle("background__red");
		muteButton.innerHTML = html;
	}
});

//Event Listener when user clicks "turn video off" button
stopVideo.addEventListener("click", () => {
	const enabled = myVideoStream.getVideoTracks()[0].enabled;
	if (enabled) {
		myVideoStream.getVideoTracks()[0].enabled = false;
		html = `<i class="fas fa-video-slash"></i>`;
		stopVideo.classList.toggle("background__red");
		stopVideo.innerHTML = html;
	}else{
		myVideoStream.getVideoTracks()[0].enabled = true;
		html = `<i class="fas fa-video"></i>`;
		stopVideo.classList.toggle("background__red");
		stopVideo.innerHTML = html;
	}
});

//Event Listener when user clicks invite button
inviteButton.addEventListener("click", (e) => {
	prompt(
		"Send this link to people to let them join this room.",
		window.location.href
	);
});


//Display msg content on chat panel when 'createMessage' event received
socket.on("createMessage", (message, userName) => {
	messages.innerHTML = messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});


//Function call when user disconnects
socket.on('user-disconnected', (userId, userName) => {
	disconnected(userName);
	if (peers[userId]) peers[userId].close();
})

//Function for chat panel to display "<user> joined"
function connected(userName){
	messages.innerHTML = messages.innerHTML +
    `<div class="message">
        <b style="padding-bottom:10px;">
			<i class="fas fa-plus"></i>
			<span> ${userName} Joined.</span>
		</b>
    </div>`;
}

//Function for chat panel to display "<user> left"
function disconnected(userName){
	messages.innerHTML = messages.innerHTML +
    `<div class="message">
        <b style="padding-bottom:10px;">
			<i class="fas fa-minus"></i>
			<span> ${userName} Left.</span>
		</b>
    </div>`;
}
