import ProductModel from "./product.schema.js";

export const addNewProductRepo = async (product) => {
  return await new ProductModel(product).save();
};

export const getAllProductsRepo = async (condition,productPerPage,pageNumber) => {
  console.log(condition);
  return await ProductModel.find(condition)
    .skip(productPerPage * (pageNumber - 1))
    .limit(productPerPage);
};

export const updateProductRepo = async (_id, updatedData) => {
  return await ProductModel.findByIdAndUpdate(_id, updatedData, {
    new: true,
    runValidators: true,
    useFindAndModify: true,
  });
};

export const deleProductRepo = async (_id) => {
  return await ProductModel.findByIdAndDelete(_id);
};

export const getProductDetailsRepo = async (_id) => {
  return await ProductModel.findById(_id);
};

export const getTotalCountsOfProduct = async (condition) => {
  return await ProductModel.countDocuments(condition);
};

export const findProductRepo = async (productId) => {
  return await ProductModel.findById(productId);
};
