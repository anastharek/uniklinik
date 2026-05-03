import socketIOClient from "socket.io-client"; //concurrent tukar
//concurrent tukar line 24,26,48
const socket = socketIOClient(
  window.location.origin == "http://localhost:3000"
    ? "http://localhost:9109"
    : window.location.origin,
  {
    reconnection: false,
  }
);

export default socket;
