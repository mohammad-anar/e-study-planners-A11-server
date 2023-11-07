const express = require("express");
var jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require('cookie-parser');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// parser
app.use(cors({
    origin:["http://localhost:5173", "http://localhost:5174" ],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser())


// uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zav38m0.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


// middle wares 
const gateman = async (req, res) => {
    const token = req.cookies.token
    console.log(token, "from middlewares ");
}

const tokenVerify = (req, res, next) => {
    const token = req.cookies.token;
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if(err){
            return res.send(err.message);
        }
        console.log(decoded);
        req.user= decoded;
        next()
    })
}

async function run() {
  try {
    await client.connect();
    // create collection
    const assignmentCollection = client
      .db("groupStudyDB")
      .collection("allAssignments");
    const submittedassignmentCollection = client
      .db("groupStudyDB")
      .collection("submittedassignment");

    app.get("/api/v1/assignments", async (req, res) => {
      const emailToSearch = req.query.email;
      console.log(emailToSearch);
      const query = {};
      if (emailToSearch) {
        query.email = emailToSearch;
      }

      const result = await assignmentCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/api/v1/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const query = {};
      if (id) {
        query._id = new ObjectId(id);
      }
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });
    // jwt
    app.post("/api/v1/access-token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN);
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
      }).send({success: true})
    });

    app.post("/api/v1/assignments", async (req, res) => {
      const assignment = req.body || null;
      if (assignment) {
        const result = await assignmentCollection.insertOne(assignment);
        return res.send(result);
      }
      const result = await assignmentCollection.find().toArray();
      res.send(result);
    });
    app.get("/api/v1/submittedassignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await submittedassignmentCollection.findOne(query);
      res.send(result);
    });
    app.get("/api/v1/submittedassignment", async (req, res) => {
      const email = req.query.email;
      const query = { name: email };
      console.log(email);
      const result = await submittedassignmentCollection.find(query).toArray();
      res.send(result);
    });
    // /api/v1/submittedassignment , body// for submitted assignment -1
    // /api/v1/submittedassignment // for get assignment not provide body, -2
    // http://localhost:5000/api/v1/submittedassignment/65484ef86a8dc0ab5c0be3b6 -3
    app.post("/api/v1/submittedassignment", async (req, res) => {        
      const assignment = req.body;
      const status = req.query || undefined;
      //   console.log(status, "status", assignment);

      const query = {};
      if (Object.keys(assignment).length !== 0) {
        // setdata
        const result = await submittedassignmentCollection.insertOne(
          assignment
        );
        return res.send(result);
      }

      if (Object.keys(status).length !== 0) {
        query.status = "pending";
      }
      //   get data
      const result = await submittedassignmentCollection.find(query).toArray();
      res.send(result);
    });

    // update submited assignment
    app.put("/api/v1/submittedassignment/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      console.log(data, "hi");
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...data,
          status: "completed",
        },
      };
      const result = await submittedassignmentCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.patch("/api/v1/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {};
      if (data) {
        updateDoc.$set = {
          ...data,
        };
      }
      const result = await assignmentCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete("/api/v1/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const query = {};
      if (id) {
        query._id = new ObjectId(id);
      }
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    });

    // end apis
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("eStudypartners server is running");
});

app.listen(port, () => {
  console.log(`eStudy app is running form port: ${port}`);
});
