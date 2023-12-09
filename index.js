const express = require("express");
var jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// parser
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://debonair-m00ove.surge.sh",
      "https://dist-three-blue.vercel.app",
      "https://egroupstudy.surge.sh",
      "https://egroupstudy.surge.sh"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

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

const tokenVerify = (req, res, next) => {
  next()
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send("unAuthorized");
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.send(err.message);
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // await client.connect();
    // create collection
    const assignmentCollection = client
      .db("groupStudyDB")
      .collection("allAssignments");
    const submittedassignmentCollection = client
      .db("groupStudyDB")
      .collection("submittedassignment");

    app.get("/api/v1/assignments", async (req, res) => {
      const filter = req.query.filter.toLowerCase();
      const page = Number(req.query.page);
      const size = Number(req.query.size);
      const skip = page * size;
      let myfilter = {difficulty_level: filter}

      if(filter === "all"){
        myfilter = {}
      }

      const emailToSearch = req.query.email;
      const query = {};
      if (emailToSearch) {
        query.email = emailToSearch;
      }
      const count = await assignmentCollection.countDocuments();

      const result = await assignmentCollection
        .find(query)
        .skip(skip)
        .limit(size)
        .filter(myfilter)
        .toArray();

      res.send({ result, count });
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
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
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
    app.get(
      "/api/v1/submittedassignment/:id",
      tokenVerify,
      async (req, res) => {
        const userEmail = req.user.email;
        const queryEmail = req.query?.email;
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await submittedassignmentCollection.findOne(query);
        res.send(result);
      }
    );
    app.get("/api/v1/submittedassignment", tokenVerify, async (req, res) => {
      const userEmail = req.user?.email;
      const queryEmail = req.query?.email;
      const email = req.query.email;
      const query = { name: email };
      const result = await submittedassignmentCollection.find(query).toArray();
      res.send(result);
    });
    // /api/v1/submittedassignment , body// for submitted assignment -1
    // /api/v1/submittedassignment // for get assignment not provide body, -2
    // http://localhost:5000/api/v1/submittedassignment/65484ef86a8dc0ab5c0be3b6 -3
    app.post("/api/v1/submittedassignment", tokenVerify, async (req, res) => {
      const userEmail = req.user?.email;
      const queryEmail = req.query?.email;
      if (userEmail !== queryEmail) {
        return res.status(403).send("forbidden access");
      }
      const assignment = req.body;
      const status = req.query.status || undefined;

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
    app.put(
      "/api/v1/submittedassignment/:id",
      tokenVerify,
      async (req, res) => {
        const userEmail = req.user?.email;
        const queryEmail = req.query?.email;
        if (userEmail !== queryEmail) {
          return res.status(403).send("forbidden access");
        }
        const id = req.params.id;
        const data = req.body;
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
      }
    );

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
      const email = req.query.email;
      const query = {};
      if (id && email) {
        query._id= new ObjectId(id);
        query.email = email;
      }else{
        return;
      }
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    });

    // end apis
    // await client.db("admin").command({ ping: 1 });
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
