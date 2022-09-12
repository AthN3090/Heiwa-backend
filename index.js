const express = require('express')
const app = express()
const http = require('http')
const cors = require('cors')
const PORT = 8000 || process.env.PORT
app.use(cors())
const {Server} = require('socket.io')
const { resolve } = require('path')
const { rejects } = require('assert')
const server = http.createServer(app)
let onlineUsers = [];
const io = new Server(server, {
    cors: {
        origin: ["https://heiwa.vercel.app", "http://localhost:3000/"], 
        methods : ["GET", "POST"],
    }
});


app.get("/", (req, res) => {
    res.send("Running")
})
server.listen(PORT, () =>{
    console.log("Heiwa server running on "+ PORT )
})

io.on('connection', (socket) => {
    console.log("user id :" + socket.id + " connected")
    socket.on('disconnect', ()=>{
        onlineUsers = onlineUsers.filter(item => item.id !== socket.id )
        console.log("user id :" + socket.id + " disconnected")
        // console.log(onlineUsers);
    })

    socket.on('add-user',data => {
        onlineUsers.push({
            ...data,
            busyWith: null
        })
        let currUser = onlineUsers.find(user => user.id === data.id)
        let promise = new Promise((resolve, reject) => {
            let index = Math.floor(Math.random()*onlineUsers.length)
            let finder = setInterval(()=>{
                if(currUser.busyWith !== null){
                    clearInterval(finder)
                    let partnerUser = onlineUsers.find(user => user.id === currUser.busyWith)
                    resolve([partnerUser, false]);
                }else if(onlineUsers[index] && onlineUsers[index].id !== data.id && onlineUsers[index].busyWith === null){
                    clearInterval(finder);
                    resolve([onlineUsers[index], index]);
                }else{
                    index = Math.floor(Math.random()*onlineUsers.length)
                }

            }, 10)
        })
        .then(([match, flag]) =>{
            io.to(data.id).emit('match-info', match)
            if(flag){
                currUser.busyWith = match.id
                onlineUsers[flag].busyWith = data.id
            }
            
        })
        // console.log(data)
        // console.log(onlineUsers)
    })

    socket.on('drawing', (data)=>{
        // console.log(data)      
        socket.to(data.to).emit('drawing', data.content)
    })
    socket.on('send-message', (data)=>{
        socket.to(data.to).emit('received-message', {author: data.content.author, text: data.content.text})
    })

})