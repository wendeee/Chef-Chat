const express = require("express");
const app = express();
const server = require("http").createServer(app);
const session = require("express-session");
const MongoStore = require("connect-mongo");
const { Server } = require("socket.io");
const MenuList = require("../menu_list.json");

require("dotenv").config();
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({mongoUrl: process.env.MONGO_URL}),
  ttl: 1 * 24 * 60 * 60, // = 1day
  autoRemove: "native", // Default
});
app.use(sessionMiddleware);
app.use(express.static("public"));
const io = new Server(server, {
  cors: "*",
});

// convert a connect middleware to a Socket.IO middleware
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, socket.request.res || {}, next);
io.use(wrap(sessionMiddleware));


io.on("connection", (socket) => {

// //   // Get the session ID from the client
//  const sessionId = socket.handshake.headers.cookie.split('=')[2];
//  // Set the session ID on the socket object
//  socket.sessionId = sessionId;

 
 
  //keep track of session using user's device
  const userDevice = socket.request.headers["user-agent"];
  socket.request.session.user = userDevice;
  if (userDevice) {
    
    // console.log(`user ${socket.id} connected`);
    socket.request.session.save();
  
  }

  //track user's current order
  let currentOrder = (socket.request.session.currentOrder = []);

  //track user's order history
  let orderHistory = (socket.request.session.orderHistory = []);

  socket.emit(
    "chef_chat_message",
    `Welcome to ChefChat! Select your preffered choice by entering the corresponding number <br/><br/>
    1. Place an order <br/> 99. Checkout order <br/>98. View order history <br/>97. See current order <br/>0. Cancel order
    `
  );

  socket.on("client_chat_message", (message) => {
    //do something with the client's message
    //get client's message
    //convert it to a number and compare the number with server options and respond accordingly
    let options = parseInt(message);
    switch (options) {
      case 1:
        //do something
        socket.emit(
          "chef_chat_message",
          `Here's our menu list: <br/> <br/> ${MenuList.map(
            (option) => `<p>${option.id}. ${option.item} ${option.price}</p>`
          ).join("")}`
        );

        break;
      case 91:
      case 92:
      case 93:
      case 94:
        //do something
        const menu_choice = MenuList.find((option) => option.id === options);
        socket.emit(
          "chef_chat_message",
          `${menu_choice.item} has been added to your cart. <br/><br/>Enter 1 to place another order<br/>Enter 97 to see items in your cart, or <br/> Enter 99 to checkout order`
        );
        currentOrder.push(menu_choice.item);
        break;
      case 99:
        //do something
        //check if user has placed any order
        currentOrder.length === 0
          ? socket.emit(
              "chef_chat_message",
              `You havent placed any order yet!<br/> <br/> Enter 1 to place an order`
            )
          : socket.emit(
              "chef_chat_message",
              "Order placed!<br/> <br/>Enter 1 if you would like to place another order"
            );
        orderHistory.push(...currentOrder);
        currentOrder.length = 0;

        break;
      case 98:
        //do something
        let orderhistory = orderHistory.map((order) => `<p>${order}</p>`);
        orderHistory.length === 0
          ? socket.emit(
              "chef_chat_message",
              `Your order history is empty.<br/>You haven't checked out any order yet.`
            )
          : socket.emit(
              "chef_chat_message",
              `Here's your order history:<br/><br/>${orderhistory}`
            );

        break;
      case 97:
        //do something
        let currentorder = currentOrder
          .map((cartItem) => `<p>${cartItem}</p>`)
          .join("");
        currentOrder.length === 0 || currentOrder === []
          ? socket.emit(
              "chef_chat_message",
              `Seems your cart is empty.<br/><br/>Place an order to add item to cart!<br/>Enter 1 to place an order`
            )
          : socket.emit(
              "chef_chat_message",
              `<p>Your cart item(s):<br/>${currentorder}<br/><br/>Enter 99 to checkout order <br/> Enter 0 to cancel order</p>`
            );

        break;
      case 0:
        if (currentOrder.length > 0) {
          currentOrder.length = 0;
          socket.emit(
            "chef_chat_message",
            `Order cancelled! Your cart is now empty.<br/> <br/> Enter 1 to place a new order`
          );
        } else {
          socket.emit(
            "chef_chat_message",
            `You do not have any current order!<br/><br/>Enter 1 to place an order`
          );
        }

        //do something
        break;
      default:
        socket.emit(
          "chef_chat_message",
          `Oops!!! It appears you have entered a wrong option. Please try again.`
        );
        break;
    }
    });
  socket.on("disconnect", () => {
    console.log(`user ${socket.id} disconnected`);
  });
});

server.listen("3001", () => {
  console.log("server is running on: *3001");
});
