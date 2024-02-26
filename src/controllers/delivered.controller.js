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

const importDeliveredFromCSV = asyncHandler(async (req, res, next) => {
    // Read data from Deliveries CSV file
    const deliveriesFromCSV = [];

    const readCSV = asyncHandler(async () => {
        const csvFilePath = path.join(__dirname, "./src/data/Deliveries.csv");

        fs.createReadStream(csvFilePath)
            .pipe(csvParser({ separator: ',' })) // Set the separator to comma
            .on('data', asyncHandler(async (row) => {
                // Check if the card already exists in the database
                const rowData = row['ID,Card ID,User Mobile,Timestamp'].split(',');
                const cardId = rowData[1];
                const userContact = rowData[2];
                const timestamp = new Date(rowData[3]);

                const existingCard = await Card.findOne({ cardId });

                if (!existingCard) {
                    // If the card doesn't exist, update card status and insert into deliveriesFromCSV array
                    await updateCardStatus(cardId, 'DELIVERED');
                    const newDelivery = await Delivered.create({
                        card: existingCard._id,
                        userContact,
                        timestamp
                    });
                    deliveriesFromCSV.push(newDelivery);
                }
            }))
            .on('end', asyncHandler(async () => {
                // Send response with deliveries
                res.status(200).json(new ApiResponse(200, deliveriesFromCSV, "All deliveries retrieved successfully from CSV"));
            }));
    });

    await readCSV();
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
    const delivery = await Delivered.findOne({deliveredId:deliveryId});
    if (!delivery) {
        throw new ApiError(404, "Delivery not found");
    }
    res.status(200).json(new ApiResponse(200, delivery, "Delivery retrieved successfully"));
});

const createDelivery = asyncHandler(async (req, res) => {
    const {deliveredId, cardId, userContact, comment } = req.body;
    // Validate required fields
    if (!deliveredId || !cardId || !userContact) {
        throw new ApiError(400, "Missing required fields");
    }
    const deliveredData = await Delivered.findOne({deliveredId:deliveredId})
    if(deliveredData){
        throw new ApiError(400, "This delivery of the same Id has already been added.")
    }
    const card = await Card.findOne({ cardId });
    if(!card){
        throw new ApiError(400, 'Card does not exist');
    }
    if(card.status === 'PICKUP' || card.status === 'DELIVERY_EXCEPTION'){
        // Create a new delivery instance
        const newDelivery = await Delivered.create({
            deliveredId: deliveredId,
            card: card._id,
            userContact,
            comment
        });
        if(!newDelivery){
            throw new ApiError(500, "Failed to create delivery");
        }
        updateCardStatus(card._id, 'DELIVERED');
        // Send response with the newly created delivery
        res.status(201).json(new ApiResponse(201, newDelivery, "Delivery created successfully"));
    }
    else{
        throw  new ApiError(400, `The current status of this card is ${card.status},, which is not valid for this operation`)
    }
});

const updateDelivery = asyncHandler(async (req, res) => {
    const deliveryId = req.params.id;
    const updateData = req.body;
    const updatedDelivery = await Delivered.findOneAndUpdate({deliveredId: deliveryId}, updateData, { new: true });
    if (!updatedDelivery) {
        throw new ApiError(404, "Delivery not found");
    }
    res.status(200).json(new ApiResponse(200, updatedDelivery, "Delivery updated successfully"));
});

const deleteDelivery = asyncHandler(async (req, res) => {
    const deliveryId = req.params.id;
    const deletedDelivery = await Delivered.findOneAndDelete({deliveredId: deliveryId}).populate('card');
    if (!deletedDelivery) {
        throw new ApiError(404, "Delivery not found");
    }
    updateCardStatus(deletedDelivery.card._id, 'PICKUP')
    res.status(200).json(new ApiResponse(200, null, "Delivery deleted successfully"));
});

export {
    importDeliveredFromCSV,
    getAllDeliveredFromDB,
    getDeliveryById,
    createDelivery,
    updateDelivery,
    deleteDelivery
};
