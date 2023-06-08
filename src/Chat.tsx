import React, { useState, useEffect } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import "bootstrap/dist/css/bootstrap.min.css";
import Message from "./Message";
import User from "./User";
import { Console } from "console";
//import axios from 'axios';

function Chat() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [toUser, setToUser] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [connection, setConnection] = useState<signalR.HubConnection>();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    if (userId && userName) {
      setUser({ userId, userName });
    }
  }, []);

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7096/myhub')
      .build();
 
      try {
      newConnection.on("addMessage", (sender: string, text: string) => {
        console.log(sender + " " + text);
        setMessages((messages) => [...messages, { sender, text }]);
      });

      newConnection
        .start()
        .then(() => {
          console.log('SignalR connected');
          if (user) {
            newConnection.send("Login", user.userId, user.userName).then((d) => console.log("login to server"));
            newConnection.invoke("GetMessages",user.userId).then((d)=>{setMessages(d);});
          }
        })
        .catch((error: any) => console.log(error));

      setConnection(newConnection);
    }
    catch (err) {
      console.log(err);
    }

    return () => {
      newConnection.stop();
    };
  }, [user]);

  useEffect(() => {
    fetch("https://localhost:7096/GetUserList")
      .then((response) => response.json())
      .then((data) => { setUsers(data); console.log("get users", data); }).catch((err) => console.log(err));
  }, [user]);

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userId = event.currentTarget.userId.value;
    const userName = event.currentTarget.userName.value;
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName);
    setUser({ userId, userName });
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setUser(null);
  };

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // fetch(`your_api_url_here/api/users/${toUser}/messages`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     sender: user?.userName,
    //     subject,
    //     text,
    //   }),
    // })
    // .then((response) => {
    //   if (response.ok) {
    //     setSubject("");
    //     setText("");
    //   } else {
    //     alert("Failed to send message.");
    //   }
    // })
    // .catch((error) => console.log(error));

    if (connection) {
      console.log("handleSend reached");
      let u = users.find((u) => u.userName == toUser);
      connection.send('SendMessage', user?.userName, u?.userId, subject + " : " + text).then(() => {
        console.log("invoke SendMessage ok");
        setSubject("");
        setToUser("");
        setText("");
      }).then(() => { console.log(messages); })
        .catch((error) => { console.log(error, " mine"); alert("Failed to send message.") });

      // connection.on("addMessage", (sender: string, text: string) => {
      //   console.log(sender + " " + text);
      //   setMessages((messages) => [...messages, { sender, text }]);
      // });

    }
  };

  return (
    <div className="container ">
      <div className="row mt-3">
        {user ? (
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                Logged in as {user.userName}  ({user.userId})
                <button
                  className="btn btn-sm btn-danger float-right"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
              <div className="card-body">
                <form onSubmit={handleSendMessage}>
                  <div className="form-group">
                    <label htmlFor="toUser">To:</label>
                    <select
                      id="toUser"
                      className="form-control"
                      value={toUser}
                      onChange={(event) => setToUser(event.target.value)}
                    >
                      <option value="">Select user</option>
                      {users.map((user) => (
                        <option key={user.userId}>{user.userName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Subject:</label>
                    <input
                      type="text"
                      id="subject"
                      className="form-control"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="text">Text:</label>
                    <textarea
                      id="text"
                      className="form-control"
                      rows={5}
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <button type="submit" className="btn btn-primary">
                      Send
                    </button>
                  </div>
                </form>
                <ul className="list-group">
                  {messages.map((message, index) => (
                    <li className="list-group-item" key={index}>
                      <strong>{message.sender}: </strong>
                      {message.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )

          :

          (
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">Sign In</div>
                <div className="card-body">
                  <form onSubmit={handleSignIn}>
                    <div className="form-group">
                      <label htmlFor="userId">User Id:</label>
                      <input
                        type="text"
                        id="userId"
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="userName">User Name:</label>
                      <input
                        type="text"
                        id="userName"
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <button type="submit" className="btn btn-primary">
                        Sign In
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default Chat;
;
