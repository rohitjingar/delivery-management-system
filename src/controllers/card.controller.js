import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"
import Card from "../models/card.model.js";

const  getAllCards = asyncHandler(async (req, res) => {
    const cards = await Card.find();
    res.status(200).json(new ApiResponse(200, cards,"All Cards fetched successfully"));
})


const  getCardById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if(!id){
        throw new ApiError(400,'No card ID provided')
    }
    const card = await Card.findOne({cardId: id});
    if (!card) {
        throw new ApiError(404, "Card not found");
    }
    res.status(200).json(new ApiResponse(200, card, "Card fetched successfully!"));
})

const getTheStatusOfCard = asyncHandler(async (req, res) => {
    const { cardId, contactDetails } = req.body;
    
    // Validate input parameters
    if (!cardId || !contactDetails) {
        throw new ApiError(400, "Card ID and contact details are required");
    }
    
    // Find the card in the database
    const card = await Card.findOne({ cardId });

    if (!card) {
        throw new ApiError(404, "Card not found");
    }

    // Construct the response with the card status
    const response = {
        cardId: card.cardId,
        status: card.status
        // Add other card details here if needed
    };

    // Send response
    res.status(200).json(new ApiResponse(200, response, "Card status retrieved successfully"));
});
const  createCard = asyncHandler(async (req, res) => {
    const { cardId, userContact, comment} = req.body;
    if( !cardId || !userContact ){
        throw new ApiError(400, 'Please provide all fields');
    }
    
    const existingCard = await Card.findOne({ cardId });
    if (existingCard) {
      throw new ApiError(400, "Card with the provided ID already exists");
    }
    const newCard = await Card.create({
        cardId: cardId,
        userContact: userContact,
        comment
    });

    if(!newCard){
        throw new ApiResponse(500, "Internal server error", "Failed to create new card");
    }
    res.status(201).json(new ApiResponse(201, newCard, "New card created successfully"))
})


const updateCard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new ApiError(400, "No record Id provided");
    }
    
    const { userContact, comment } = req.body;
    
    // Prepare update object with fields provided in the request body
    const updateObj = {};
    if (userContact) {
        updateObj.userContact = userContact;
    }
    if (comment) {
        updateObj.comment = comment;
    }

    // Find the document by id and update with the provided fields, while retaining old values if not provided
    const updatedCard = await Card.findOneAndUpdate({cardId:id}, updateObj, { new: true });

    if (!updatedCard) {
        throw new ApiResponse(500, "Internal Server Error", "Failed to update the card");
    }

    // Send success response with the updated card
    res.status(200).json(new ApiResponse(200, updatedCard, "Card updated successfully"));
});




const  deleteCard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if(!id){
        throw new ApiError(400,'No card ID provided')
    }
    const deletedCard = await Card.findOneAndDelete({cardId: id});
    if (!deletedCard) {
      throw new ApiError(404, "Card not found");
    }
    res.status(200).json(new ApiResponse(200, null, "Card deleted successfully"));
})


export{
  getAllCards,
  getTheStatusOfCard,
  getCardById,
  createCard,
  updateCard,
  deleteCard
}