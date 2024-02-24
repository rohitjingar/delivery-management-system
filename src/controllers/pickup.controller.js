import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"
import Card from "../models/card.model.js";
import Pickup from "../models/pickup.model.js";
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

const importPickupsFromCSV = asyncHandler(async (req, res,next) => {
  // Read data from Pickup CSV file
  const pickupsFromCSV = [];
  
  const readCSV = asyncHandler(async() =>{
    fs.createReadStream('./src/data/Pickup.csv')
    .pipe(csvParser({ separator: '\t' })) // Set the separator to tab
    .on('data', asyncHandler(async (row) => {
       
       // Check if the card already exists in the database
       const rowData = row['ID,Card ID,User Mobile,Timestamp'].split(',');
    const id = rowData[1];
    const userContact = rowData[2];
    const timestamp = new Date(rowData[3]);
    
    const card = await Card.findOne({cardId: id});
    if (!card) {
        throw new ApiError(404, `Card with ID ${cardId} not found`);
    }
    await updateCardStatus(id, 'PICKUP');
    const newPickup = await  Pickup.create(
        {
        card: card._id,
        userContact: userContact,
        timestamp: timestamp,
        pickupTimestamp: timestamp
        }
    )
    pickupsFromCSV.push(newPickup);
    console.log(newPickup)
   }))
  })
  await  readCSV()
  res.status(200).json(new ApiResponse(200, pickupsFromCSV, "All Pickup data fetched successfully from CSV"))
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
        const pickup = await Pickup.findById(pickupId);
        if (!pickup) {
            throw new ApiError(404, "Pickup not found");
        }
        res.status(200).json(new ApiResponse(200, pickup, "Pickup retrieved successfully"))
})


const  createPickup = asyncHandler(async (req, res) => {
    const { cardId, userContact, courierPartner, pickupLocation, pickupTimestamp } = req.body;
    if(!cardId || !userContact || !courierPartner || !pickupLocation || !pickupTimestamp){
        throw new ApiError(400, "Missing required fields")
    }
    const card  = await Card.findone( { cardId: cardId} )
    if(!card){
       throw new ApiError(400, "Card not found")
    }

    const newPickup = await Pickup.create({
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
  const updatedPickup = await Pickup.findByIdAndUpdate(pickupId, updateData, { new: true });

  // If no pickup found with the provided ID, throw an error
  if (!updatedPickup) {
      throw new ApiError(404, "Pickup not found");
  }

  // Return the updated pickup
  res.status(200).json(new ApiResponse(200, updatedPickup, "Pickup updated successfully"));
})


const  deletePickup = asyncHandler(async (req, res) => {
  const pickupId = req.params.id;
  const deletedPickup = await Pickup.findByIdAndDelete(pickupId).populate('card');
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