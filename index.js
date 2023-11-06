const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// parser
app.use(cors());
app.use(express.json());

// uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zav38m0.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

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

    app.post("/api/v1/assignments", async (req, res) => {
      const assignment = req.body || null;
      if (assignment) {
        const result = await assignmentCollection.insertOne(assignment);
        return res.send(result);
      }
      const result = await assignmentCollection.find().toArray();
      res.send(result);
    });
    // /api/v1/submittedassignment , body// for submitted assignment -1
    // /api/v1/submittedassignment // for get assignment not provide body, -2
    app.post("/api/v1/submittedassignment", async (req, res) => {
      const assignment = req.body;
      console.log(assignment);
      console.log(Object.keys(assignment).length === 0);
      if(Object.keys(assignment).length !== 0) {
        // setdata 
        const result =
          await submittedassignmentCollection.insertOne(
            assignment
          );
        return res.send(result);
      }
    
    //   get data 
        const result = await submittedassignmentCollection.find().toArray();
        res.send(result);
    //   else{
        // const result =
        //   await submittedassignmentCollection.insertOne(
        //     assignment
        //   );
        // return res.send(result);
    //   }
      
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
