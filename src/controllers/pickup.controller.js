import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"
import Card from "../models/card.model.js";
import Pickup from "../models/pickup.model.js";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
const updateCardStatus = async (cardId, newStatus) => {
  const updatedCard = await Card.findOneAndUpdate({ cardId }, { status: newStatus });
  if (!updatedCard) {
    throw new ApiError(404, "Card not found");
  }
};

const importPickupsFromCSV = asyncHandler(async (req, res) => {
   // Assuming the CSV file is uploaded as a multipart/form-data file
  fs.createReadStream('./src/data/Pickup.csv')
    .pipe(csvParser({ separator: '\t' }))
    .on('data', async (row) => {
      const rowData = row['ID,Card ID,User Mobile,Timestamp,courierPartner'].split(',');
      const pickupId = rowData[0];
      const id = rowData[1];
      const userContact = rowData[2];
      const timestamp = new Date(rowData[3]);
      const courierPartner = rowData[4];
      const pickupCard = await Pickup.findOne({ pickupId: pickupId });
      if (!pickupCard) {
        const card = await Card.findOne({ cardId: id });
        if (card) {
          await updateCardStatus(id, 'PICKUP');
          const newPickup = await Pickup.create({
            pickupId: pickupId,
            card: card._id,
            userContact: userContact,
            timestamp: timestamp,
            pickupTimestamp: timestamp,
            courierPartner: courierPartner
          });
        }
      }
    })
    .on('end', async () => {
      const allPickupData = await Pickup.find();
      res.status(200).json(new ApiResponse(200, allPickupData, "All Pickup data fetched successfully"))
    })
    .on('error', (error) => {
      res.status(500).json({ message: 'Error importing pickups', error });
    });
});

const getPickupFromDB  = asyncHandler (async(req,res)=>{
  const allPickupData = await Pickup.find();
  res.status(200).json(new ApiResponse(200, allPickupData, "All Pickup data fetched successfully"))
})
const  getPickupById = asyncHandler(async (req, res) => {
        const pickupId = req.params.id;
        if(!pickupId){
            throw new ApiError(404, "Pickup ID is missing")
        }
        const pickup = await Pickup.findOne({pickupId: pickupId});
        if (!pickup) {
            throw new ApiError(404, "Pickup not found");
        }
        res.status(200).json(new ApiResponse(200, pickup, "Pickup retrieved successfully"))
})


const  createPickup = asyncHandler(async (req, res) => {
    const {pickupId, cardId, userContact, courierPartner, pickupLocation, pickupTimestamp } = req.body;
    if(!pickupId || !cardId || !userContact || !courierPartner || !pickupLocation || !pickupTimestamp){
        throw new ApiError(400, "Missing required fields")
    }
    const pickup = await Pickup.findone({pickupId:pickupId})
    if(pickup){
       throw new ApiError(409,"Pickup with same Id already exists.")
    }
    const card  = await Card.findone( { cardId: cardId} )
    if(!card){
       throw new ApiError(400, "Card not found")
    }
    if(card.status !== 'CREATED'){
      throw new ApiError(400, "Status for this operation should be CREATED")
    }
    const newPickup = await Pickup.create({
        pickupId:pickupId,
        card: card._id,
        userContact,
        courierPartner,
        pickupLocation,
        pickupTimestamp
    })
    
    if(!newPickup){
       throw new ApiError(500, "Failed to create pickup")
    }
    updateCardStatus(cardId, 'PICKUP');
    res.status(201).json(new ApiResponse(201, newPickup, "Pickup created successfully"));
})


const  updatePickup = asyncHandler(async (req, res) => {
  const pickupId = req.params.id;
  const updateData = req.body;
  const updatedPickup = await Pickup.findOneAndUpdate({pickupId: pickupId}, updateData, { new: true });

  // If no pickup found with the provided ID, throw an error
  if (!updatedPickup) {
      throw new ApiError(404, "Pickup not found");
  }

  // Return the updated pickup
  res.status(200).json(new ApiResponse(200, updatedPickup, "Pickup updated successfully"));
})


const  deletePickup = asyncHandler(async (req, res) => {
  const pickupId = req.params.id;
  const deletedPickup = await Pickup.findOneAndDelete({pickupId: pickupId}).populate('card');
  if (!deletedPickup) {
      throw new ApiError(404, "Pickup not found");
  }
  // Update card status to 'CREATED' when a pickup is deleted
  updateCardStatus(deletedPickup.card._id, 'CREATED');
  res.status(200).json(new ApiResponse(200, null, "Pickup deleted successfully"));
})


export{
  importPickupsFromCSV,
  getPickupFromDB,
  getPickupById,
  createPickup,
  updatePickup,
  deletePickup
}