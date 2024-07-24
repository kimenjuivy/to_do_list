const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});


const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB", error);
    }
}

connectToDatabase();
app.use(express.static('public'));


app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const db = client.db('userAuth');
        const usersCollection = db.collection('users');

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        await usersCollection.insertOne({ username, email, password: hashedPassword });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
});


app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const db = client.db('userAuth');
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        res.status(200).json({ message: 'Login successful', userId: user._id });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});


app.get('/tasks/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = client.db('userAuth');
        const tasksCollection = db.collection('tasks');
        
        const tasks = await tasksCollection.find({ userId: new ObjectId(userId) }).toArray();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});


app.post('/tasks/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const tasks = req.body;
        const db = client.db('userAuth');
        const tasksCollection = db.collection('tasks');
        
        await tasksCollection.deleteMany({ userId: new ObjectId(userId) });
        await tasksCollection.insertMany(tasks.map(task => ({ ...task, userId: new ObjectId(userId) })));
        
        res.status(200).json({ message: 'Tasks saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving tasks' });
    }
});


app.get('/categories/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = client.db('userAuth');
        const categoriesCollection = db.collection('categories');
        
        const categories = await categoriesCollection.findOne({ userId: new ObjectId(userId) });
        res.status(200).json(categories ? categories.list : []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
});


app.post('/categories/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const categories = req.body;
        const db = client.db('userAuth');
        const categoriesCollection = db.collection('categories');
        
        await categoriesCollection.updateOne(
            { userId: new ObjectId(userId) },
            { $set: { list: categories } },
            { upsert: true }
        );
        
        res.status(200).json({ message: 'Categories saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving categories' });
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});