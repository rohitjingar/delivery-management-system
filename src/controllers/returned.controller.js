import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
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

const importReturnsFromCSV = asyncHandler(async (req, res, next) => {
  // Read data from Returns CSV file
  const returnsFromCSV = [];

  const readCSV = asyncHandler(async () => {
    const csvFilePath = path.join(__dirname, "./src/data/Returned.csv");

    fs.createReadStream(csvFilePath)
      .pipe(csvParser({ separator: '\t' })) // Set the separator to tab
      .on('data', asyncHandler(async (row) => {
        // Check if the card already exists in the database
        const rowData = row['ID,Card ID,User Mobile,Timestamp'].split(',');
        const cardId = rowData[1];
        const userContact = rowData[2];
        const timestamp = new Date(rowData[3]);

        const existingCard = await Card.findOne({ cardId });

        if (!existingCard) {
          // If the card doesn't exist, update card status and push to returnsFromCSV array
          await updateCardStatus(cardId, 'RETURNED');
          const newReturn = await Returned.create({
            card: existingCard._id,
            userContact,
            timestamp
          });
          returnsFromCSV.push(newReturn);
        }
      }))
      .on('end', asyncHandler(async () => {
        // Send response with returns
        res.status(200).json(new ApiResponse(200, returnsFromCSV, "All returns retrieved successfully from CSV"));
      }));
  });

  await readCSV();
});

const getAllreturnedFromDB = asyncHandler(async (req, res) => {
  const allReturnedData = await Returned.find();
  res.status(200).json(new ApiResponse(200, allReturnedData, "All returned retrieved successfully"));
})
const getReturnById = asyncHandler(async (req, res) => {
  const returnId = req.params.id;
  if (!returnId) {
    throw new ApiError(400, "Please provide a valid id parameter")
  }
  const returnData = await Returned.findOne({ returnedId: returnId });
  if (!returnData) {
    throw new ApiError(404, "Return not found");
  }
  res.status(200).json(new ApiResponse(200, returnData, "Return retrieved successfully"));
});

const createReturn = asyncHandler(async (req, res) => {
  const { returnedId, cardId, userContact, returnReason, comment } = req.body;
  if (!returnedId || !cardId || !userContact || !returnReason) {
    throw new ApiError(400, "Missing required fields");
  }
  const returnedData = await Returned.find({ returnedId: returnedId })
  if (returnedData) {
    throw new ApiError(400, "This returned of the same Id has already been added.")
  }
  const card = await Card.findOne({ cardId });
  if (!card) {
    throw new ApiError(400, "Card not found");
  }
  if (card.status === "PICKUP" || card.status === "DELIVERY_EXCEPTION") {
    const newReturn = await Returned.create({
      returnedId: returnedId,
      card: card._id,
      userContact,
      returnReason,
      comment
    });
    if (!newReturn) {
      throw new ApiError(500, "Server error while creating the return");
    }
    // Update card status to 'RETURNED'
    await updateCardStatus(cardId, 'RETURNED');
    res.status(201).json(new ApiResponse(201, newReturn, "Return created successfully"));
  }
  else{
    throw new ApiError(400, `The current status of this card is ${card.status}, which is not valid for this operation.`)
  }
});

const updateReturn = asyncHandler(async (req, res) => {
  const returnedId = req.params.id;
  const updateData = req.body;
  const updatedReturn = await Returned.findOneAndUpdate({returnedId: returnedId}, updateData, { new: true });
  if (!updatedReturn) {
    throw new ApiError(404, "Return not found");
  }
  res.status(200).json(new ApiResponse(200, updatedReturn, "Return updated successfully"));
});

const deleteReturn = asyncHandler(async (req, res) => {
  const returnedId = req.params.id;
  const deletedReturn = await Returned.findOneAndDelete({returnedId: returnedId}).populate('card');
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