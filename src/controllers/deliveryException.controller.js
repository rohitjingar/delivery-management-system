import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import Returned from "../models/returned.model.js";
import DeliveryException from "../models/deliveryException.model.js";
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
const importDeliveryExceptionsFromCSV = asyncHandler(async (req, res, next) => {
    // Read data from Delivery Exception CSV file
    const deliveryExceptionsFromCSV = [];

    const readCSV = asyncHandler(async () => {
        const csvFilePath = path.join(__dirname, "./src/data/Delivery exception.csv");

        fs.createReadStream(csvFilePath)
            .pipe(csvParser({ separator: '\t' })) // Set the separator to tab
            .on('data', asyncHandler(async (row) => {
                // Check if the card already exists in the database
                const existingCard = await Card.findOne({ cardId: row.cardId });

                if (!existingCard) {
                    // If the card doesn't exist, update card status and push to deliveryExceptionsFromCSV array
                    await updateCardStatus(row.cardId, 'DELIVERY_EXCEPTION');
                    deliveryExceptionsFromCSV.push(row);
                }
            }))
            .on('end', asyncHandler(async () => {
                // Insert new delivery exceptions from CSV into the database
                await DeliveryException.insertMany(deliveryExceptionsFromCSV);

                // Fetch delivery exceptions from the database
                const deliveryExceptionsFromDB = await DeliveryException.find();

                if (!deliveryExceptionsFromDB || deliveryExceptionsFromDB.length === 0) {
                    throw new ApiError(404, "No delivery exceptions found");
                }

                // Send response with delivery exceptions
                res.status(200).json(new ApiResponse(200, deliveryExceptionsFromDB, "All delivery exceptions retrieved successfully"));
            }));
    });

    await readCSV();
});




const getAllDeliveryExceptionsFromDB  = asyncHandler (async(req,res)=>{
    const allDeliveryExceptionsData = await DeliveryException.find();
    res.status(200).json(new ApiResponse(200, allDeliveryExceptionsData, "Successfully fetched all delivery exceptions"));
})
const getDeliveryExceptionById = asyncHandler(async (req, res) => {
    const deliveryExceptionId = req.params.id;
    const deliveryException = await DeliveryException.findById(deliveryExceptionId);
    if (!deliveryException) {
        throw new ApiError(404, "Delivery exception not found");
    }
    res.status(200).json(new ApiResponse(200, deliveryException, "Delivery exception retrieved successfully"));
});

const createDeliveryException = asyncHandler(async (req, res) => {
    const { cardId, userContact, exceptionType, comment } = req.body;
    if (!cardId || !userContact || !exceptionType) {
        throw new ApiError(400, "Missing required fields")
    }
    const card = await Card.findOne({ cardId: cardId });
    if (!card) {
        throw new ApiError(400, "Card not found");
    }
    const existingExceptions = await DeliveryException.find({ card: card._id });
    if (existingExceptions) {
        // If delivery attempts exceed 2, return the card
        if(existingExceptions.length >= 2)
        { 
            const newReturn = await Returned.create({
                card: card._id,
                userContact ,
                returnReason : "Maximum delivery attempts reached, card returned"
            });
            if(!newReturn){
                throw new ApiError(500,"Failed to add returned card for more than two delivery exceptions");
            }
            await updateCardStatus(cardId, 'RETURNED');
            res.status(400).json(new ApiResponse(400, null, "Maximum delivery attempts reached, card returned"));
        }
        else{
            existingExceptions = existingExceptions.map(async (exception) => {
                exception.deliveryAttempts += 1;
                await exception.save();
            });
        }
    }
   

    // Create a new delivery exception
    const newDeliveryException = await DeliveryException.create({
        card: card._id,
        userContact,
        exceptionType,
        comment,
        deliveryAttempts: existingExceptions.length + 1 // Increment delivery attempts
    });
    if (!newDeliveryException) {
        throw new ApiError(500, "Failed to save delivery exception in the database")
    }
    await updateCardStatus(cardId, 'DELIVERY_EXCEPTION');
    res.status(201).json(new ApiResponse(201, newDeliveryException, "Delivery exception created successfully"));
});

const updateDeliveryException = asyncHandler(async (req, res) => {
    const deliveryExceptionId = req.params.id;
    const updateData = req.body;
    const updatedDeliveryException = await DeliveryException.findByIdAndUpdate(deliveryExceptionId, updateData, { new: true });
    if (!updatedDeliveryException) {
        throw new ApiError(404, "Delivery exception not found");
    }
    res.status(200).json(new ApiResponse(200, updatedDeliveryException, "Delivery exception updated successfully"));
});

const deleteDeliveryException = asyncHandler(async (req, res) => {
    const deliveryExceptionId = req.params.id;
    const deletedDeliveryException = await DeliveryException.findByIdAndDelete(deliveryExceptionId).populate('card');
    if (!deletedDeliveryException) {
        throw new ApiError(404, "Delivery exception not found");
    }
    await updateCardStatus(deletedDeliveryException.card._id, 'PICKUP');
    res.status(200).json(new ApiResponse(200, null, "Delivery exception deleted successfully"));
});

export {
    importDeliveryExceptionsFromCSV,
    getAllDeliveryExceptionsFromDB,
    getDeliveryExceptionById,
    createDeliveryException,
    updateDeliveryException,
    deleteDeliveryException
};
