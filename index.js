require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jsonwebtoken = require('jsonwebtoken');

/* database name */
const swiftWheels_DB = "swiftWheels-db";

const app = express();

const port = process.env.PORT || 5000;

app.use(cors({
    origin: [ 'http://localhost:5173' ],
    credentials: true
}));
app.use(express.json())
app.use(cookieParser())


const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        // console.log(token);

        if (!token) return res.status(401).send({ message: 'Unauthorized' })

        jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            // console.log(err);
            if (err) return res.status(401).send({ message: 'Unauthorized' })

            // console.log(decoded);
            req.user = decoded;
            next();
        })
    } catch (error) {
        console.log({ error: true, message: error.message });
    }
}

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
        const testimonialCollection = SW_database.collection('testimonials');

        // Send a ping to confirm a successful connection
        await client.db(swiftWheels_DB).command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");



        /* Auth api */
        app.post('/api/v1/auth/jwt', async (req, res) => {
            const user = req.body;

            // console.log(user);

            const token = jsonwebtoken.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })

            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                })
                .send({ success: true })

        })

        /* user logout then clear cookie */
        app.post('/api/v1/user/logout', async (req, res) => {
            // const user = req.body;

            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        /* Get all cars */
        app.get('/api/v1/cars', async (req, res) => {
            console.log('carCollection get hilted');

            const result = await carCollection.find().toArray();

            // console.log(result);

            res.send(result)
        })

        /* Get all bikes */
        app.get('/api/v1/bikes', async (req, res) => {
            const result = await bikeCollection.find().toArray();

            // console.log(result);

            res.send(result)
        })

        /* Get services of this provider using email excluding the booking in details page */
        app.get('/api/v1/same-provider-services/:email', async (req, res) => {
            const email = req.params.email;
            const { id } = req.query;

            const query = { "provider.email": email, _id: { $ne: new ObjectId(id) } }

            console.log(email, query);

            const bikes = await bikeCollection.find(query).toArray();

            const cars = await carCollection.find(query).toArray();

            // console.log([ ...bikes, ...cars ]);

            /* if not matched send empty array */
            return res.send([ ...bikes, ...cars ])
        })

        /* Get a service by ID */
        app.get('/api/v1/services/:id', async (req, res) => {
            const id = req.params.id;
            const { type } = req.query;
            // console.log(id, type);

            const query = { _id: new ObjectId(id) }

            if (type === "bikes") {
                const result = await bikeCollection.find(query).toArray();
                // console.log(result);
                return res.send(result)
            }
            const result = await carCollection.find(query).toArray();

            // console.log(result);

            /* if not matched send empty array */
            return res.send(result)
        })

        /* find Popular services */
        app.get('/api/v1/popular-services', async (req, res) => {
            const { type } = req.query;
            // console.log(id, type);

            const options = {
                projection: { name: 1, price: 1, img: 1, provider: 1, description: 1 }
            }

            if (type === "bikes") {
                const result = await bikeCollection.find({}, options).limit(4).toArray();
                // console.log(result);
                return res.send(result)
            }
            const result = await carCollection.find({}, options).limit(4).toArray();

            // console.log(result);

            /* if not matched send empty array */
            return res.send(result)
        })

        /* Add / Host a service */
        app.post('/api/v1/create-service', async (req, res) => {
            const service = req.body;

            // console.log(service);
            if (service?.type === 'bike') {
                const result = await bikeCollection.insertOne(service)

                // console.log(result);
                return res.send(result)
            }
            const result = await carCollection.insertOne(service)

            // console.log(result);
            res.send(result)
        })

        /* Get the bookings */
        app.get('/api/v1/bookings', async (req, res) => {
            const result = await bookingCollection.find().toArray();

            // console.log(result);

            res.send(...result)
        })

        /* Get the testimonials */
        app.get('/api/v1/testimonials', async (req, res) => {
            const result = await testimonialCollection.find().toArray();

            // console.log(result);

            res.send(result)
        })

        /* Post a testimonial */
        app.post('/api/v1/testimonials', async (req, res) => {
            const comment = req.body;
            const result = await testimonialCollection.insertOne(comment);

            console.log(result);

            res.send(result)
        })

        /* booked a service [customize for desired solution] */
        app.patch('/api/v1/book-service', async (req, res) => {
            const { bookings } = req.body;

            const result = await bookingCollection.findOneAndUpdate(
                {},
                { $set: { bookings } },
                { upsert: true }
            );

            // console.log(result);

            if (result === null) return res.send({ "insertedCount": 1 })
            if (typeof result === 'object') return res.send({ "modifiedCount": 1 })

            return res.send(result)
        })

        /* Update service by ID */
        app.patch('/api/v1/update-service/:id', async (req, res) => {
            const id = req.params.id;
            const updatedService = req.body;
            const { type } = req.query;

            console.log(id);

            const query = { _id: new ObjectId(id) }

            console.log({ ...updatedService });

            if (type === 'bikes') {
                console.log('hello');
                const result = await bikeCollection.updateOne(
                    query,
                    { $set: { ...updatedService } },
                );

                console.log(result);
                return res.send(result)
            }

            const result = await carCollection.updateOne(
                query,
                { $set: { ...updatedService } },
            );
            console.log(result);

            return res.send(result)

        })

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
        console.log("server is running.");
    }
}
run().catch(console.dir);














app.get('/', (req, res) => {
    res.send('SwiftWheels Server is running...')
})

app.listen(port, () => {
    console.log(`SwiftWheels app listening on port ${port}`)
})