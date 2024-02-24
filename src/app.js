import express from "express"
import cors from "cors"
const app =  express();
import bodyParser from 'body-parser';

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes

import cardsRouter from './routes/cards.routes.js';
import pickupsRouter from './routes/pickup.routes.js';
import deliveredRouter from './routes/delivered.routes.js';
import deliveryExceptionRouter from './routes/deliveryException.routes.js';
import returnedRouter from './routes/returned.routes.js';

app.use('/api/v1/cards', cardsRouter);
app.use('/api/v1/pickups', pickupsRouter);
app.use('/api/v1/deliveries', deliveredRouter);
app.use('/api/v1/delivery-exceptions', deliveryExceptionRouter);
app.use('/api/v1/returns', returnedRouter);

export default app;