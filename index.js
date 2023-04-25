
const express = require('express');
const cors = require('cors');
const { request } = require('express');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const port = process.env.port || 5000;
const app = express();


//middle ware 
app.use(cors())
app.use(express.json())
function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorize access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
        if (err) {
            return res.status(403).send({ message: ' Forbidden Access ' })
        }
        console.log('decode', decode);
        req.decode = decode
        next();
    })


}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qktcord.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const serviceCollection = client.db('genius-Car').collection('services')
        const orderCollection = client.db('order').collection('oder-list')
        //Auth
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken })
        })
        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const service = await cursor.toArray();
            res.send(service)
        })
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service)

        })

        // post 
        app.post('/services', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result)
        })
        // delete
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const service = await serviceCollection.deleteOne(query);
            res.send(service)

        });
        //order collection api ,
        app.get('/order', verifyJwt, async (req, res) => {
            const decodedEmail = req.decode.email;
            const email = req.query.email;
            console.log(email);
            if (email === decodedEmail) {
                const query = { email: email }
                const cursor = orderCollection.find(query)
                const orders = await cursor.toArray();
                res.send(orders)
            }
            else {
                res.status(403).send({ message: 'forbidden' })
            }
        })
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result);

        })
    }

    catch {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send(" server genius car  ")
})

app.listen(port, () => {
    console.log(' genius car ', port);
})