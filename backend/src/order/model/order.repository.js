import OrderModel from "./order.schema.js";
import productModel from "../../product/model/product.schema.js"

export const createNewOrderRepo = async (data) => {
  // 1. Loop through ordered items and reduce stock
  for (const item of data.orderedItems) {
    const product = await productModel.findById(item.product);

    if (!product) {
      return {
        success: false,
        error: {
          msg: "product not found",
          code: 404
        }
      }
    }

    if (product.stock < item.quantity) {
     return {
        success: false,
        error: {
          msg: "Item is not in Stock",
          code: 409
        }
      }
    }

    product.stock -= item.quantity;

    await product.save({ validateBeforeSave: false }); // to skip schema validation on unmodified fields
  }

  // 2. Save the order
  const newOrder = new OrderModel(data);
  await newOrder.save();

  return newOrder;

};
// checking the single order that is order by the same user
export const getSingleOrderRepo = async (id, userId) => {
  const order = await OrderModel.findOne({ _id: id, user: userId });
  return order;
}
// now user is checking its all Orders
export const getMyAllOrdersRepo = async (userId) => {
  const getAllOrder = await OrderModel.find({ user: userId });
  return getAllOrder;
};
// only admin can use this method to get all orders details 
export const getAllOrdersRepo = async () => {
  const getAllOrder = await OrderModel.find().populate("user");
  return getAllOrder;
}
// only admin can access this method to update the order status of the user 
export const updateOrderRepo = async (orderId, status) => {
  const updateOrderStatus = await OrderModel.findByIdAndUpdate(orderId, { orderStatus: status }
    , { new: true });
  return updateOrderStatus;
}
