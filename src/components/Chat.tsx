import { HubConnectionBuilder } from "@microsoft/signalr";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useCallback, useEffect, useState } from "react";
import User from "../entities/User";
import Message from "../entities/Message";

function Chat() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [toUser, setToUser] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [connection, setConnection] = useState<signalR.HubConnection>();
  const [messages, setMessages] = useState<Message[]>([]);

  const initConnection = useCallback((newConnection: signalR.HubConnection) => {

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
            newConnection.invoke("GetMessages", user.userId).then((d) => { setMessages(d); });
          }
        })
        .catch((error: any) => console.log(error));

      setConnection(newConnection);
    }
    catch (err) {
      console.log(err);
    }
  }, [user]);

  const getSendMessageForm = useCallback(() => {
    console.log("send Message");
    return (
      <div className="col-md-8">
        <div className="card">
          <div className="card-header">
            Logged in as {user?.userName}  ({user?.userId})
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
    );

  }, [user, toUser, subject, text, messages]);

  const getSignInLoginForm = useCallback(() => {

    return (
      <div className="col-md-4">
        <div className="card">
          {!user ? <div className="card-header">Login</div> : <div className="card-header">Sign In</div>}
          <div className="card-body">
            <form onSubmit={handleSignInLogin}>
              <div className="form-group">
                <label htmlFor="userId">User Id:</label>
                <input
                  type="text"
                  id="userId"
                  className="form-control"
                  required
                />
              </div>
              {!user && <div className="form-group">
                <label htmlFor="userName">User Name:</label>
                <input
                  type="text"
                  id="userName"
                  className="form-control"
                  required
                />
              </div>}
              <div className="form-group">
                <button type="submit" className="btn btn-primary">
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }, [user])


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

    initConnection(newConnection);

    return () => {
      newConnection.stop();
    };
  }, [user]);

  useEffect(() => {
    fetch("https://localhost:7096/GetUserList")
      .then((response) => response.json())
      .then((data) => { setUsers(data); console.log("get users", data); }).catch((err) => console.log(err));
  }, [user]);

  const login = (id: string) => {
    if (user?.userId == id) {
      setIsLoggedIn(true);
    }
    else {
      alert("Login failed! change id");
    }
  }

  const handleSignInLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (user) {
      const userId = event.currentTarget.userId.value;
      login(userId);
    }
    else {
      const userId = event.currentTarget.userId.value;
      const userName = event.currentTarget.userName.value;
      localStorage.setItem("userId", userId);
      localStorage.setItem("userName", userName);
      setUser({ userId, userName });
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (connection) {
      let use = users.find((u) => u.userName == toUser);
      connection.send('SendMessage', user?.userName, use?.userId, subject + " : " + text).then(() => {
        setSubject("");
        setToUser("");
        setText("");
      }).then(() => { console.log(messages); })
        .catch((error) => { console.log(error, " mine"); alert("Failed to send message.") });
    }
  };

  return (
    <div className="container ">
      <div className="row mt-3">
        {isLoggedIn ? getSendMessageForm() : getSignInLoginForm()}
      </div>
    </div>
  );
}

export default Chat;

