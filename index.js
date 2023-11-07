require('dotenv').config()
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())
app.use(cookieParser())

// console.log(process.env.swiftWheels_USER, process.env.swiftWheels_PASS, process.env.swiftWheels_DB);

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.swiftWheels_USER}:${process.env.swiftWheels_PASS}@carsdoctordb.pehv7ki.mongodb.net/${process.env.swiftWheels_DB}?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const SW_database = client.db(process.env.swiftWheels_DB);
        const carCollection = SW_database.collection('cars');
        const bikeCollection = SW_database.collection('bikes');
        const bookingCollection = SW_database.collection('bookings');
        const serviceCollection = SW_database.collection('services');

        // Send a ping to confirm a successful connection
        await client.db(process.env.swiftWheels_DB).command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);














app.get('/', (req, res) => {
    res.send('SwiftWheels Server is running...')
})

app.listen(port, () => {
    console.log(`SwiftWheels app listening on port ${port}`)
})