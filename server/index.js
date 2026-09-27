import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  🐋 ORCA Marine Intelligence Server Active on Port ${PORT}`);
  console.log(`  ISRO Problem Statement 26176 Prototype Engine`);
  console.log(`=======================================================`);
});
