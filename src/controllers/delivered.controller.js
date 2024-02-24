import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import Delivered from "../models/delivered.model.js";;
import Card from "../models/card.model.js";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";

const updateCardStatus = asyncHandler(async (cardId, newStatus) => {
    // Find the card by cardId and update its status
    await Card.findOneAndUpdate({ cardId }, { status: newStatus });
    if (!updatedCard) {
      throw new ApiError(404, "Card not found");
    }
})

const importDeleveredFromCSV = asyncHandler(async (req, res) => {
    const deliveriesFromCSV = [];
    
    // Path to the CSV file
    const csvFilePath = path.join(__dirname, "../data/Deliveries.csv");
    
    // Read the CSV file
    fs.createReadStream(csvFilePath)
        .pipe(csvParser({ separator: ',' })) // Set the separator to comma
        .on('data', async (row) => {
            // Check if the card already exists in the database
            const existingCard = await Card.findOne({ cardId: row.cardId });

            if (!existingCard) {
                // If the card doesn't exist, update card status and insert into deliveriesFromCSV array
                await updateCardStatus(row.cardId, 'DELIVERED');
                deliveriesFromCSV.push(row);
            }
        })
        .on('end', asyncHandler(async () => {
            // Insert new deliveries from CSV into the database
            await Delivered.insertMany(deliveriesFromCSV);
                
            // Fetch deliveries from database
            const deliveriesFromDB = await Delivered.find();
                
            if (!deliveriesFromDB || deliveriesFromDB.length === 0) {
                throw new ApiError(404, "No deliveries found");
            }
                
            // Send response with deliveries
            res.status(200).json(new ApiResponse(200, deliveriesFromDB, "All deliveries retrieved successfully"));
        }));
});

const getAllDeliveredFromDB  = asyncHandler (async(req,res)=>{
    const allDeliveredData = await Delivered.find();
    res.status(200).json(new ApiResponse(200, allDeliveredData, "All delivered data fetched successfully"))
})

const getDeliveryById = asyncHandler(async (req, res) => {
    const deliveryId = req.params.id;
    if(!deliveryId){
        throw new ApiError(400, "Delivery ID is missing")
    }
    const delivery = await Delivered.findById(deliveryId);
    if (!delivery) {
        throw new ApiError(404, "Delivery not found");
    }
    res.status(200).json(new ApiResponse(200, delivery, "Delivery retrieved successfully"));
});

const createDelivery = asyncHandler(async (req, res) => {
    const { cardId, userContact, comment } = req.body;
    
    // Validate required fields
    if (!cardId || !userContact) {
        throw new ApiError(400, "Missing required fields");
    }
    const card = await Card.findOne({ cardId });
    if(!card){
        throw new ApiError(400, 'Card does not exist');
    }
    // Create a new delivery instance
    const newDelivery = await Delivered.create({
        card: card._id  ,
        userContact,
        comment
    });
    if(!newDelivery){
        throw new ApiError(500, "Failed to create delivery");
    }
    updateCardStatus(card._id, 'DELIVERED');
    // Send response with the newly created delivery
    res.status(201).json(new ApiResponse(201, newDelivery, "Delivery created successfully"));
});

const updateDelivery = asyncHandler(async (req, res) => {
    const deliveryId = req.params.id;
    const updateData = req.body;
    const updatedDelivery = await Delivered.findByIdAndUpdate(deliveryId, updateData, { new: true });
    if (!updatedDelivery) {
        throw new ApiError(404, "Delivery not found");
    }
    res.status(200).json(new ApiResponse(200, updatedDelivery, "Delivery updated successfully"));
});

const deleteDelivery = asyncHandler(async (req, res) => {
    const deliveryId = req.params.id;
    const deletedDelivery = await Delivered.findByIdAndDelete(deliveryId).populate('card');
    if (!deletedDelivery) {
        throw new ApiError(404, "Delivery not found");
    }
    updateCardStatus(deletedDelivery.card._id, 'PICKUP')
    res.status(200).json(new ApiResponse(200, null, "Delivery deleted successfully"));
});

export {
    importDeleveredFromCSV,
    getAllDeliveredFromDB,
    getDeliveryById,
    createDelivery,
    updateDelivery,
    deleteDelivery
};
