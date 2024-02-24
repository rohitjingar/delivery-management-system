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


const  createCard = asyncHandler(async (req, res) => {
    const { cardId, userContact} = req.body;
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
    });

    if(!newCard){
        throw new ApiResponse(500, "Internal server error", "Failed to create new card");
    }
    res.status(201).json(new ApiResponse(201, newCard, "New card created successfully"))
})


const  updateCard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if(!id){
        throw new ApiError(400,"No record Id provided")
    }
    const card = await  Card.findone( { cardId: id} )
    if (!card) {
      throw new ApiError(404, "Card not found");
    }
    const { userContact, comment } = req.body;

    // Update card fields if provided
    if (userContact) {
      card.userContact = userContact;
    }
    if (comment) {
      card.comment = comment;
    }

    // Save the updated card to the database
    const updatedCard = await card.save();
    if(!updatedCard){
        throw new ApiResponse(500, "Internal Server Error", "Failed to update the card")
    }
    // Send success response with the updated card
    res.status(200).json(new ApiResponse(200, updatedCard, "Card updated successfully"));
})


const  deleteCard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if(!id){
        throw new ApiError(400,'No card ID provided')
    }
    const deletedCard = await Card.findByIdAndDelete({cardId: id});
    if (!deletedCard) {
      throw new ApiError(404, "Card not found");
    }
    res.status(200).json(new ApiResponse(200, null, "Card deleted successfully"));
})


export{
  getAllCards,
  getCardById,
  createCard,
  updateCard,
  deleteCard
}