// Please don't change the pre-written code
// Import the necessary modules here

import { ErrorHandler } from "../../../utils/errorHandler.js";
import {
  addNewProductRepo,
  deleProductRepo,
  findProductRepo,
  getAllProductsRepo,
  getProductDetailsRepo,
  getTotalCountsOfProduct,
  updateProductRepo,
} from "../model/product.repository.js";
import ProductModel from "../model/product.schema.js";

// add the product 
export const addNewProduct = async (req, res, next) => {
  try {
    const product = await addNewProductRepo({
      ...req.body,
      createdBy: req.user._id,
    });
    if (product) {
      res.status(201).json({ success: true, product });
    } else {
      return next(new ErrorHandler(400, "some error occured!"));
    }
  } catch (error) {
    return next(error);
  }
};

// getting the all product 
export const getAllProducts = async (req, res, next) => {
  // Implement the functionality for search, filter and pagination this function.
  try {
    const { page, keyword, category, price, rating } = req.query;
    // set the product limit to 10 (one page contain the 10 product)
    const productPerPage = 10;
    const pageNumber = Number(page) || 1;
    const keywordSearch = keyword || "";

    // searching condition  (using "i" in the option to take all result of lower and upper case) 
    const searchProductCondition = {
      name: {
        $regex: keywordSearch,
        $options: "i"
      }
    }

    // filter the products
    const filterCondition = {};

    if (category) {
      filterCondition.category = category;
    }

    // Price filter
    if (price) {
      filterCondition.price = {};
      if (price.gte) filterCondition.price.$gte = Number(price.gte);
      if (price.lte) filterCondition.price.$lte = Number(price.lte);
    }

    // Rating filter
    if (rating) {
      filterCondition.rating = {};
      if (rating.gte) filterCondition.rating.$gte = Number(rating.gte);
      if (rating.lte) filterCondition.rating.$lte = Number(rating.lte);
    }

    const finalCondition = {
      ...searchProductCondition,
      ...filterCondition,
    };

    const totalCount = await getTotalCountsOfProduct(finalCondition);
    const totalPages = Math.ceil(totalCount / productPerPage);
    const getProduct = await getAllProductsRepo(finalCondition, productPerPage, pageNumber, totalCount);
    return res.status(200).json({
      success: true,
      totalItems: totalCount,
      totalPage: totalPages,
      currentpage: pageNumber,
      getProduct
    });

  } catch (err) {
    console.log(err);
    next(err);
  }
};

// updating the existing product
export const updateProduct = async (req, res, next) => {
  try {
    const updatedProduct = await updateProductRepo(req.params.id, req.body);
    if (updatedProduct) {
      res.status(200).json({ success: true, updatedProduct });
    } else {
      return next(new ErrorHandler(400, "Product not found!"));
    }
  } catch (error) {
    return next(error);
  }
};
// delete the product
export const deleteProduct = async (req, res, next) => {
  try {
    const deletedProduct = await deleProductRepo(req.params.id);
    if (deletedProduct) {
      res.status(200).json({ success: true, deletedProduct });
    } else {
      return next(new ErrorHandler(400, "Product not found!"));
    }
  } catch (error) {
    return next(error);
  }
};
// get product details
export const getProductDetails = async (req, res, next) => {
  try {
    const productDetails = await getProductDetailsRepo(req.params.id);
    if (productDetails) {
      res.status(200).json({ success: true, productDetails });
    } else {
      return next(new ErrorHandler(400, "Product not found!"));
    }
  } catch (error) {
    return next(error);
  }
};
// rating the product
export const rateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body;
    const user = req.user._id;
    const name = req.user.name;
    const review = {
      user,
      name,
      rating: Number(rating),
      comment,
    };
    if (!rating) {
      return next(new ErrorHandler(400, "rating can't be empty"));
    }
    const product = await findProductRepo(productId);
    if (!product) {
      return next(new ErrorHandler(400, "Product not found!"));
    }
    const findRevieweIndex = product.reviews.findIndex((rev) => {
      return rev.user.toString() === user.toString();
    });
    if (findRevieweIndex >= 0) {
      product.reviews.splice(findRevieweIndex, 1, review);
    } else {
      product.reviews.push(review);
    }
    let avgRating = 0;
    product.reviews.forEach((rev) => {
      avgRating += rev.rating;
    });
    const updatedRatingOfProduct = avgRating / product.reviews.length;
    product.rating = updatedRatingOfProduct;
    await product.save({ validateBeforeSave: false });
    res
      .status(201)
      .json({ success: true, msg: "thx for rating the product", product });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};
// getting the  review of product
export const getAllReviewsOfAProduct = async (req, res, next) => {
  try {
    const product = await findProductRepo(req.params.id);
    if (!product) {
      return next(new ErrorHandler(400, "Product not found!"));
    }
    res.status(200).json({ success: true, reviews: product.reviews });
  } catch (error) {
    return next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  // Insert the essential code into this controller wherever necessary to resolve issues related to removing reviews and updating product ratings.
  try {
    const { productId, reviewId } = req.query;
    if (!productId || !reviewId) {
      return next(
        new ErrorHandler(
          400,
          "pls provide productId and reviewId as query params"
        )
      );
    }
    const product = await findProductRepo(productId);
    if (!product) {
      return next(new ErrorHandler(400, "Product not found!"));
    }
    const reviews = product.reviews;

    // here we are checking the review id and review given by specific user id
    //  only that user can delete the product review
    const isReviewExistIndex = reviews.findIndex((rev) => {
      // console.log(rev.user + " " + req.user._id);
      return ((rev._id.toString() === reviewId.toString()) &&
        (rev.user.toString() === req.user._id.toString()));
    });
    console.log(isReviewExistIndex);
    if (isReviewExistIndex < 0) {
      return next(new ErrorHandler(400, "review doesn't exist"));
    }

    const reviewToBeDeleted = reviews[isReviewExistIndex];
    reviews.splice(isReviewExistIndex, 1);
    let avgRating = 0;
    product.reviews.forEach((rev) => {
      avgRating += rev.rating;
    });
    const updatedRatingOfProduct = avgRating / product.reviews.length;
    console.log(updatedRatingOfProduct);
    product.rating = updatedRatingOfProduct;
    await product.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
      msg: "review deleted successfully",
      deletedReview: reviewToBeDeleted,
      product,
    });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};
