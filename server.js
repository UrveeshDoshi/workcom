import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";

import bcrypt from "bcrypt";


import dotenv from "dotenv";
dotenv.config();
//PLEASE NOTE THAT IN ORDER TO MAKE IT A REAL TIME CHAT APP PUSHER IS NEEDED WHICH DOES NOT WORK OFFLINE

// Configuring the
const app = express();
const router = express.Router();
const upload = multer({ dest: "upload" });
const port = process.env.PORT || 27017;

// Mongoose model for the collection
const myModel = mongoose.model("chats", {
  message: String,
  receivername: String,
  sendername: String,
  timestamp: String,
  dateval: String,
  received: Boolean,
});
const myUsers = mongoose.model("users", {
  name: String,

  link: String,
  numbers: Number,
  interest: String,
  organisation: String,
  password: String,
});
const kanban_projects = mongoose.model("projects", {
  organisation: String,
  events: Object,
});

const FileSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  downloadCount: {
    type: Number,
    required: true,
    default: 0,
  },
});

const File = mongoose.model("file", FileSchema);
//Now we will note the Middle ware
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ["*"]);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,Authorisation"
  );
  res.setHeader("preflightContinue", "False");
  // if (req.method === 'OPTIONS') {
  res.setHeader("Access-Control-Allow-Methods", "PUT,PATCH,GET,POST,DELETE");
  // res.json();
  // }
  next();
});
app.use("/", router);

//Some more functions for adding files
const uploadImage = async (request, response) => {
  const fileObj = {
    path: request.file.path,
    name: request.file.originalname,
  };

  try {
    const file = await File.create(fileObj);
    response
      .status(200)
      .json({ path: `http://localhost:27017/file/${file._id}` });
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ error: error.message });
  }
};

const downloadImage = async (request, response) => {
  try {
    const file = await File.findById(request.params.fileId);

    file.downloadCount++;

    await file.save();

    response.download(file.path, file.name);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ msg: error.message });
  }
};

//This is routing

router.post("/upload", upload.single("file"), uploadImage);

router.get("/file/:fileId", downloadImage);

// Get code of the chats
app.get("/chats", async (req, res) => {
  try {
    const sendername = req.query.sendername;
    const receivername = req.query.receivername;

    const data = await myModel.find({
      sendername: { $in: [sendername, receivername] },
      receivername: { $in: [sendername, receivername] },
    });
    
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving data from the database");
  }
});
// Get code of the projects for kanban
app.get("/projects", async (req, res) => {
  try {
    // const organisation=req.body;
    const organisation = req.query.organisation;
    console.log("This is my organisation", organisation);
    const data = await kanban_projects.findOne({ organisation: organisation });
    console.log(data.events);
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving data from the database");
  }
});

//Get code of the users
app.get("/users", async (req, res) => {
  try {
    // await myUsers.find()
    const data = await myUsers.find();
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving data from the database");
  }
});



//Post Code for chats
app.post("/chats", async (req, res) => {
  try {
    const dbm = req.body;
    const data = await myModel.create(dbm);
    console.log("This is the data", data);
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending data from the database");
  }
});
//Post Code for user
app.post("/users", async (req, res) => {
  try {
    // console.log(req.body.name);
    const temp = await myUsers.find({ name: req.body.name });
    if (temp.length != 0) {
      res.status(409).send("User already exists");
    } else {
      console.log(temp);
      console.log("CREATING");
      const dbm = req.body;
      const data = await myUsers.create(dbm);
      res.send(data);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error sending data from the database");
  }
});
//Post Code for Projects
app.post("/projects", async (req, res) => {
  try {
    console.log("Server is invoked");
    const dbm = req.body;
    console.log(dbm.organisation, "Yeeasasa---------->");
    console.log("Yessssssss", dbm.events);
    const query = { organisation: dbm.organisation };
    const update = { $set: { events: dbm.events } };
    const options = { upsert: true };
    const data = await kanban_projects.findOneAndUpdate(query, update, options);
    console.log("suscess");
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending data from the database");
  }
});

// File sharing

app.post("/login", async (req, res) => {
  console.log("IN VALIDATION");
  try {
    console.log(req.body);
    const nameFromReq = req.body["name"];
    const passwordFromReq = req.body["password"];

    // Find the user by name
    const user = await myUsers.findOne({ name: nameFromReq });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare the entered password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(passwordFromReq, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json({ message: "Login successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

//Now listen to the server

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  // console.log("Hello Moto!!");
});

//Now Connecting to the database
// const url = "mongodb://0.0.0.0:27017/chatapps";
// const url = "mongodb+srv://urveeshdoshi09:09March2003@cluster0.2dhi6wc.mongodb.net/?retryWrites=true&w=majority";
// const url = "mongodb+srv://urveeshdoshi09:09March2003@cluster0.2dhi6wc.mongodb.net/chatapp?retryWrites=true&w=majority";
const url = 'mongodb+srv://urveeshdoshi09:09March2003@cluster0.2dhi6wc.mongodb.net/chatapps?retryWrites=true&w=majority'
const db = mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.log("SUPER BIG ERROR");
    console.error(err);
  });
