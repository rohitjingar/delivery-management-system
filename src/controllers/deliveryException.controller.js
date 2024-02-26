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

    fs.createReadStream(csvFilePath)
        .pipe(csvParser({ separator: '\t' })) // Set the separator to tab
        .on('data', async (row) => {
            // Check if the card already exists in the database
            const rowData = row['ID ,Card ID,User contact,Timestamp,Comment'].split(',');
            const exceptionId = rowData[0]
            const cardId = rowData[1]
            const userContact = rowData[2]
            const timestamp = new Date(rowData[3])
            const comment = rowData[4]
            const exceptionType = rowData[5]

            const exceptionCard = await DeliveryException.findOne({ exceptionId: exceptionId });
            if (!exceptionCard) {
                const card = await Card.findOne({ cardId: cardId });
                if (card) {
                    await updateCardStatus(id, 'EXCEPTION');
                    const newException = await DeliveryException.create({
                        exceptionId: exceptionId,
                        card: card._id,
                        userContact: userContact,
                        timestamp: timestamp,
                        comment: comment,
                        exceptionType: exceptionType
                    });
                }
            }
        })
        .on('end', async () => {
            const allDeliveryExceptionsData = await DeliveryException.find();
            res.status(200).json(new ApiResponse(200, allDeliveryExceptionsData, "Successfully fetched all delivery exceptions from CSV file"));
        })
        .on('error', (error) => {
            res.status(500).json({ message: 'Error importing DeliveryExceptions ', error });
        });

});




const getAllDeliveryExceptionsFromDB = asyncHandler(async (req, res) => {
    const allDeliveryExceptionsData = await DeliveryException.find();
    res.status(200).json(new ApiResponse(200, allDeliveryExceptionsData, "Successfully fetched all delivery exceptions"));
})
const getDeliveryExceptionById = asyncHandler(async (req, res) => {
    const deliveryExceptionId = req.params.id;
    const deliveryException = await DeliveryException.findOne({ exceptionId: deliveryExceptionId });
    if (!deliveryException) {
        throw new ApiError(404, "Delivery exception not found");
    }
    res.status(200).json(new ApiResponse(200, deliveryException, "Delivery exception retrieved successfully"));
});

const createDeliveryException = asyncHandler(async (req, res) => {
    const { exceptionId, cardId, userContact, exceptionType, comment } = req.body;
    if (!exceptionId || !cardId || !userContact || !exceptionType) {
        throw new ApiError(400, "Missing required fields")
    }
    const deliveryException = await DeliveryException.findOne({ exceptionId: exceptionId })
    if (deliveryException) {
        throw new ApiError(409, "This exception with the same Id already exists in the database.")
    }
    const card = await Card.findOne({ cardId: cardId });
    if (!card) {
        throw new ApiError(400, "Card not found");
    }
    const existingExceptions = await  DeliveryException.findone({card: card._id})
    const ExceptionAttempts = card.deliveryExceptionAttempts
    if ( ExceptionAttempts === 2) {
        const returnedId = toString(existingExceptions[1]._id)
        const newReturn = await Returned.create({
            returnedId: returnedId,
            card: card._id,
            userContact,
            returnReason: "Maximum delivery attempts reached, card returned"
        });
        if (!newReturn) {
            throw new ApiError(500, "Failed to add returned card for more than two delivery exceptions");
        }
        await updateCardStatus(cardId, 'RETURNED');
        res.status(400).json(new ApiResponse(400, null, "Maximum delivery attempts reached, card returned"));
    }
    else if (ExceptionAttempts === 0 && card.status !== 'PICKUP'){
        throw new ApiError(400, "Status for this operation should be PICKUP")
    }

    // Create a new delivery exception
    const newDeliveryException = await DeliveryException.create({
        exceptionId: exceptionId,
        card: card._id,
        userContact,
        exceptionType,
        comment,
    });
    if (!newDeliveryException) {
        throw new ApiError(500, "Failed to save delivery exception in the database")
    }
    card.deliveryExceptionAttempts++
    await card.save()
    if(ExceptionAttempts===0){await updateCardStatus(cardId, 'DELIVERY_EXCEPTION')}
    res.status(201).json(new ApiResponse(201, newDeliveryException, "Delivery exception created successfully"));
});

const updateDeliveryException = asyncHandler(async (req, res) => {
    const deliveryExceptionId = req.params.id;
    const updateData = req.body;
    const updatedDeliveryException = await DeliveryException.findOneAndUpdate({exceptionId:deliveryExceptionId}, updateData, { new: true });
    if (!updatedDeliveryException) {
        throw new ApiError(404, "Delivery exception not found");
    }
    res.status(200).json(new ApiResponse(200, updatedDeliveryException, "Delivery exception updated successfully"));
});

const deleteDeliveryException = asyncHandler(async (req, res) => {
    const deliveryExceptionId = req.params.id;
    const deletedDeliveryException = await DeliveryException.findOneAndDelete({exceptionId:deliveryExceptionId}).populate('card');
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
