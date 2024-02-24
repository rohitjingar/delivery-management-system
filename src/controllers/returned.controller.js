import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"
import Card from "../models/card.model.js";
import Returned from "../models/returned.model.js"
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

const importReturnsFromCSV = asyncHandler(async (req, res) => {
  const returnsFromCSV = [];
  const csvFilePath = path.join(__dirname, "../data/Returned.csv");

  // Read the CSV file
  fs.createReadStream(csvFilePath)
      .pipe(csvParser({ separator: '\t' })) // Set the separator to tab
      .on('data', async (row) => {
          // Check if the card already exists in the database
          const existingCard = await Card.findOne({ cardId: row.cardId });

          if (!existingCard) {
              // If the card doesn't exist, update card status and push to returnsFromCSV array
              await updateCardStatus(row.cardId, 'RETURNED');
              returnsFromCSV.push(row);
          }
      })
      .on('end', asyncHandler(async () => {
          // Insert new returns from CSV into the database
          await Returned.insertMany(returnsFromCSV);

          // Fetch returns from the database
          const returnsFromDB = await Returned.find();

          if (!returnsFromDB || returnsFromDB.length === 0) {
              throw new ApiError(404, "No returns found");
          }

          // Send response with returns
          res.status(200).json(new ApiResponse(200, returnsFromDB, "All returns retrieved successfully"));
      }))
});

const getAllreturnedFromDB  = asyncHandler (async(req,res)=>{
  const allReturnedData = await Returned.find();
  res.status(200).json(new ApiResponse(200, allReturnedData, "All returned retrieved successfully"));
})
const getReturnById = asyncHandler(async (req, res) => {
  const returnId = req.params.id;
  if(!returnId){
     throw new ApiError(400, "Please provide a valid id parameter")
  }
  const returnData = await Returned.findById(returnId);
  if (!returnData) {
      throw new ApiError(404, "Return not found");
  }
  res.status(200).json(new ApiResponse(200, returnData, "Return retrieved successfully"));
});

const createReturn = asyncHandler(async (req, res) => {
  const { cardId, userContact, returnReason, comment } = req.body;
  if (!cardId || !userContact || !returnReason) {
      throw new ApiError(400, "Missing required fields");
  }
  const card = await Card.findOne({ cardId });
  if (!card) {
      throw new ApiError(400, "Card not found");
  }
  const newReturn = await Returned.create({
      card: card._id,
      userContact,
      returnReason,
      comment
  });
  if(!newReturn){
    throw new ApiError(500,"Server error while creating the return");
  }
  // Update card status to 'RETURNED'
  await updateCardStatus(cardId, 'RETURNED');
  res.status(201).json(new ApiResponse(201, newReturn, "Return created successfully"));
});

const updateReturn = asyncHandler(async (req, res) => {
  const returnId = req.params.id;
  const updateData = req.body;
  const updatedReturn = await Returned.findByIdAndUpdate(returnId, updateData, { new: true });
  if (!updatedReturn) {
      throw new ApiError(404, "Return not found");
  }
  res.status(200).json(new ApiResponse(200, updatedReturn, "Return updated successfully"));
});

const deleteReturn = asyncHandler(async (req, res) => {
  const returnId = req.params.id;
  const deletedReturn = await Returned.findByIdAndDelete(returnId).populate('card');
  if (!deletedReturn) {
      throw new ApiError(404, "Return not found");
  }
  // Update card status to previous state or any other appropriate status
  await updateCardStatus(deletedReturn.card._id, 'DELIVERED');
  res.status(200).json(new ApiResponse(200, null, "Return deleted successfully"));
});

export {
  getAllreturnedFromDB,
  importReturnsFromCSV,
  getReturnById,
  createReturn,
  updateReturn,
  deleteReturn
};