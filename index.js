const express = require("express");
const app = express();
const prot = process.env.prot || 5000;
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = process.env.DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
    const VotingEvent = client.db("smart-vote").collection("votingEvent");
    const UserRegistration = client.db("smart-vote").collection("userRegistration");
    const ValidRegistration = client.db("smart-vote").collection("validRegistration");
    const AllCandidates = client.db("smart-vote").collection("allCandidates");


     //! get

    //* read all voting event
    app.get("/voting-event", async (req, res) => {
      const result = await VotingEvent.find().toArray();
      res.send(result);
    });

    //* read all candidates
    app.get("/all-candidates", async (req, res) => {
      const result = await AllCandidates.find().toArray();
      res.send(result);
    });

    //* read all User registration
    app.get("/user-registration", async (req, res) => {
      const result = await UserRegistration.find().toArray();
      res.send(result);
    });

    //* read all approved voters
    app.get("/approved-voters", async (req, res) => {
      const result = await ValidRegistration.find({isApproved: true,}).toArray();
      res.send(result);
    });



    //! post

    //* Voting event post
    app.post("/voting-event", async (req, res) => {
      const data = req.body;
      const result = await VotingEvent.insertOne(data);
      res.send(result);
    });

    //* User registration post
    app.post("/add-user-registration", async (req, res) => {
      const data = req.body;
      const result = await UserRegistration.insertOne(data);
      res.send(result);
    });

    //* candidates post
    app.post("/add-candidates", async (req, res) => {
      const data = req.body;
      const result = await AllCandidates.insertOne(data);
      res.send(result);
    });



     //! update

    //* Admin approval for user registration
    app.put("/admin/approve-user/:id", async (req, res) => {
      const userId = req.params.id;

      try {
        const user = await UserRegistration.findOne({ _id: new ObjectId(userId) });
        await UserRegistration.updateOne({ _id: new ObjectId(userId) },{ $set: { isApproved: true } },);

        const validUserData = {
          ...user,
          isApproved: true,
          approvedAt: new Date(),
          originalUserId: user._id,
        };

        delete validUserData._id;

        await ValidRegistration.insertOne(validUserData);

        res.status(200).json({
          message: "Approval successful and user data moved to ValidRegistration collection.",
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "server problem" });
      }
    });

    //* Admin update voting event
    app.put("/admin/voteOnOf/:id", async (req, res) => {
        const eventId = req.params.id;
        const updateData = req.body;
        console.log("Received update data:", updateData);
        try {  
            const result = await VotingEvent.updateOne({ _id: new ObjectId(eventId) },{ $set: updateData },);
            res.send(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "server problem" });
        }
    });




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(prot, () => {
  console.log(`server is running prot${prot}`);
});
