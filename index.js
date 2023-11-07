require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
// const jsonwebtoken = require('jsonwebtoken');

/* database name */
const swiftWheels_DB = "swiftWheels-db";

const app = express();

const port = process.env.PORT || 5000;

app.use(cors())
// app.use(cors({
//     origin: [ 'http://localhost:5173' ],
//     credentials: true
// }));
app.use(express.json())
app.use(cookieParser())

// console.log(process.env.swiftWheels_USER, process.env.swiftWheels_PASS, swiftWheels_DB);

const uri = `mongodb+srv://${process.env.swiftWheels_USER}:${process.env.swiftWheels_PASS}@carsdoctordb.pehv7ki.mongodb.net/${swiftWheels_DB}?retryWrites=true&w=majority`;

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

        const SW_database = client.db(swiftWheels_DB);
        const carCollection = SW_database.collection('cars');
        const bikeCollection = SW_database.collection('bikes');
        const bookingCollection = SW_database.collection('bookings');
        const serviceCollection = SW_database.collection('services');

        // Send a ping to confirm a successful connection
        await client.db(swiftWheels_DB).command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        /* Get all cars */
        app.get('api/v1/cars', async (req, res) => {
            const result = await carCollection.find().toArray();

            console.log(result);

            res.send(result)
        })

        /* Get all bikes */
        app.get('api/v1/bikes', async (req, res) => {
            const result = await bikeCollection.find().toArray();

            console.log(result);

            res.send(result)
        })

        app.post('/api/v1/create-service', async (req, res) => {


            const service = req.body;
            
            console.log(service);
            if (service?.type === 'bike') {
                const result = await bikeCollection.insertOne(service)

                // console.log(result);
                return res.send(result)
            }
            const result = await carCollection.insertOne(service)

            // console.log(result);
            res.send(result)
        })



    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);














app.get('/', (req, res) => {
    res.send('SwiftWheels Server is running...')
})

app.listen(port, () => {
    console.log(`SwiftWheels app listening on port ${port}`)
})