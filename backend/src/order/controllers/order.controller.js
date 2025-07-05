// Please don't change the pre-written code
// Import the necessary modules here

import {
  createNewOrderRepo,
  getAllOrdersRepo,
  getMyAllOrdersRepo,
  getSingleOrderRepo,
  updateOrderRepo
} from "../model/order.repository.js";
import { ErrorHandler } from "../../../utils/errorHandler.js";
// for creating new order by user
export const createNewOrder = async (req, res, next) => {
  // Write your code here for placing a new order
  try {
    const orderData = req.body;
    orderData.user = req.user._id;
    orderData.paidAt = new Date().toISOString();
    const newOrder = await createNewOrderRepo(orderData);
    return res.status(201).json({
      success: true,
      order: newOrder
    });
  }
  catch (err) {
    next(err);
  }
};

// for getting detail of one order
export const getSingleOrder = async (req, res, next) => {
  // Write your code here for check the one order
  try {
    const userId = req.user._id;
    const id = req.params.id;
    const findOrder = await getSingleOrderRepo(id, userId);
    // if the order id is not found
    if (!findOrder) {
      return next(new ErrorHandler(404, "Order not found"));
    }
    return res.status(200).json({
      success: true,
      order: findOrder
    });
  }
  catch (err) {
    // if the order id is invalid
    if (err.name == "CastError") {
      return next(new ErrorHandler(400, "Invalid ID"));
    }
    // other type of error 
    next(err);
  }
};
// for getting all the details of all order of user
export const getMyAllOrders = async (req, res, next) => {
  // Write your code here for check the all order
  try {
    const userId = req.user._id;
    const allOrderOfUser = await getMyAllOrdersRepo(userId);
    if (!allOrderOfUser) {
      return next(new ErrorHandler(404, "No Order Found"));
    }
    return res.status(200).json({
      success: true,
      orders: allOrderOfUser
    });
  }
  catch (err) {
    next(err);
  }

};
// for getting all the details of all users order used by admin 
export const getAllOrders = async (req, res, next) => {
  try {
    const allOrders = await getAllOrdersRepo();
    return res.status(200).json({
      success: true,
      AllOrders: allOrders
    })
  } catch (err) {
    next(err);
  }
};

// for update the orderstatus done by the admin 
export const updateOrder = async (req, res, next) =>{
  try {
   const status = req.body.orderStatus;
   const orderId = req.params.id;
   const searchOrder = await updateOrderRepo(orderId,status);
   if(!searchOrder){
    return next(new ErrorHandler(404,"Order Not Found"));
   }
   return res.status(200).json({
    success : true,
    message : "Order Update Successfully"
   });
  } catch (err) {
    next(err);
  }

}

