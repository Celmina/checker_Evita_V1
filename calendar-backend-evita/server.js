require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;



app.use(express.json());

const corsOptions = {
    origin: [
        'https://checker-evita-v1.vercel.app', 
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://dailycheckevita.celmina.co'
      ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };
  
  app.use(cors(corsOptions));

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
}
const client = new MongoClient(uri);


async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}

connectDB();

// Get state
app.get('/api', async (req, res) => {
    try {
        const database = client.db('emaildata');
        const collection = database.collection('statesevita');
        const state = await collection.findOne({id: 'calendar2025'});
        res.json(state?.data || {});
    } catch (error) {
        console.error('Get state error:', error);
        res.status(500).json({ error: 'Failed to fetch state' });
    }
});

// Update state
app.post('/api', async (req, res) => {
    try {
        const database = client.db('emaildata');
        const collection = database.collection('statesevita');
        await collection.updateOne(
            { id: 'calendar2025' },
            { $set: { id: 'calendar2025', data: req.body } },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Update state error:', error);
        res.status(500).json({ error: 'Failed to update state' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});