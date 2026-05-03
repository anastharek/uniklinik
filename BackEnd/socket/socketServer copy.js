//concurrent tukar
const socketIo = require("socket.io");
const ActivityLogModel = require("../model/ActivityLog");
const SystemUsage = require("../model/SystemUsage");
const ActivityType = require("../utils/ActivityType");
const os = require("os");
const connected_client = [];
//const socket_client = {};
const typing = {}
let io;
let client_count = 0;
let lastDate = new Date()
const oneMinuteInMs = 60 * 1000;
const userLimit=2;
const disbleUserLimit=false;
const socket_report_mapper={}; // socket_id:[report_id1,report_id2,...]
const disconnectClient = (username) => {
  //io.to(socket_client[username]).emit("logOut");
  let client=connected_client.filter(obj=>obj.username==payload.username);
        let oldestDevice = client.reduce((oldest, current) => {
          if (!oldest || current.date < oldest.date) {
            return current;
          }
          return oldest;
        }, null);
  io.to(oldestDevice.id).emit("logOut");
};

const PageViewer={};

const limitReached=(username)=>{
  if(disbleUserLimit){
    return false;
  }
  else if(connected_client.filter(obj=>obj.username==username).length<userLimit){
   return false;
  }
  return true;

}

function sendNotification (username, message,type='success',key=null){
  let client=connected_client.find(obj=>obj.username==username);
  if(client){
   io.to(client.id).emit("notification", { message,type,key });
  }
}
function emitEvent(username,event){
  let client=connected_client.find(obj=>obj.username==username);
  console.log('emitting event',username,event,client);
  if(client){
    console.log('emitting event',event,client.id);
   io.to(client.id).emit(event,{});
  }
}

function startSocketServer(server) {
  io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });
  console.log("socket server started");
  io.on("connection", (socket) => {
    console.log("connected");
    client_count++;
    if (new Date() - lastDate > oneMinuteInMs) {
      let avg_load = os.loadavg();
      SystemUsage.create(client_count, avg_load[0]);
      lastDate = new Date();
    }
    socket.on("setname", (payload) => {
      socket.username = payload.username;
      //console.log("username set to ", payload.username);
      if (limitReached(payload.username)) {
        let client=connected_client.filter(obj=>obj.username==payload.username);
        let oldestDevice = client.reduce((oldest, current) => {
          if (!oldest || current.date < oldest.date) {
            return current;
          }
          return oldest;
        }, null);
        io.to(oldestDevice.id).emit("logOut");
        let index=connected_client.findIndex(obj=>obj.id==oldestDevice.id);
        if (index != -1) {
          connected_client.splice(index, 1);
        }

      }
      connected_client.push({username:payload.username,date:new Date(),id:socket.id});
      //socket_client[socket.username] = {id:socket.id,connected_at:new Date()};
    });

    socket.on('viewing-report-enter',(payload)=>{
      if(socket_report_mapper[socket.id]){
        if(socket_report_mapper[socket.id].includes(payload.id)){
          return; // already viewing this report
        }
        socket_report_mapper[socket.id].push(payload.id);
      }else{
        socket_report_mapper[socket.id]=[payload.id];
      }
      let id=payload.id;
      socket.report_id=id;
      if(PageViewer[id]){
        PageViewer[id].push(socket.username)
      }else{
        PageViewer[id]=[socket.username]
      }
      console.log('viewing report',id,PageViewer[id]);
      io.emit('viewing-report'+id,PageViewer[id])
    })

    socket.on('viewing-report-leave',(payload)=>{
      let id=payload.id;
      console.log('\n\n\n\n=> before leaving report',id,socket.username,PageViewer[id]);
      let index=PageViewer[id].indexOf(socket.username);
      if(index!=-1){
        PageViewer[id].splice(index,1)
        console.log('leaving report',id,socket.username,PageViewer[id]);
        io.emit('viewing-report'+id,PageViewer[id])
        if(!PageViewer[id].length){
          delete PageViewer[id];
        }
         socket.report_id=null;
      }
    })

    socket.on("typing", (payload) => {
      const { study_id } = payload;
      if (typing[study_id]) {
        if (!typing[study_id].includes(socket.username)) {
          typing[study_id].push(socket.username);
          socket.typing = study_id;
        }
      } else {
        typing[study_id] = [socket.username];
        socket.typing = study_id;
      }
      io.sockets.emit(study_id, typing[study_id]);
    });

    socket.on("stop-typing", (payload) => {
      const { study_id } = payload;
      if (typing[study_id]) {
        let index = typing[study_id].indexOf(socket.username);
        if (index != -1) {
          typing[study_id].splice(index, 1);
        }
        if (typing[study_id].length == 0) {
          delete typing[study_id];
        }
      }

      io.sockets.emit(study_id, typing[study_id]);
    });
    socket.on("getusage", () => {
      let total_memory = os.totalmem();
      let free_memory = os.freemem();
      socket.emit("usage", {
        user: client_count,
        total_memory,
        free_memory,
      });
    });

    socket.on('remove-me',()=>{
      let index = connected_client.findIndex(obj=>obj.id==socket.id);
      if (index != -1) {
        connected_client.splice(index, 1);
      }
    })
    socket.on("disconnect", () => {
      console.dir(PageViewer);
      console.log("\n\n\n\n=> disconnected from socket", socket.username,socket.username);
      let avg_load = os.loadavg();
      client_count--;
      if (new Date() - lastDate > oneMinuteInMs) {
        SystemUsage.create(client_count, avg_load[0]);
        lastDate = new Date();
      }
      ActivityLogModel.create(
        ActivityType.LOGOUT,
        "disconnected from socket",
        socket.username
      );
      let index = connected_client.findIndex(obj=>obj.id==socket.id);
      if (index != -1) {
        connected_client.splice(index, 1);
      }
     // delete socket_client[socket.username];
     console.log("report data",socket.report_id,)
     if(socket.report_id){
      let id=socket.report_id;
      let index=PageViewer[id].indexOf(socket.username);
      console.log('leaving report',id,socket.username,index);
      if(index!=-1){
        PageViewer[id].splice(index,1)
        console.log('updated users',PageViewer[id]);
        io.emit('viewing-report'+id,PageViewer[id])
        if(!PageViewer[id].length){
          delete PageViewer[id];
        }
      }
     }


      if (typing[socket.typing]) {
        let index = typing[socket.typing].indexOf(socket.username);
        if (index != -1) {
          typing[socket.typing].splice(index, 1);
        }
        if (typing[socket.typing].length == 0) {
          delete typing[socket.typing];
        }
        if (socket.typing)
          io.sockets.emit(socket.typing, typing[socket.typing]);
      }
    });
  });
}

module.exports = { startSocketServer,emitEvent, connected_client, disconnectClient,limitReached,sendNotification };
