// Please don't change the pre-written code
// Import the necessary modules here

import { sendPasswordResetEmail } from "../../../utils/emails/passwordReset.js";
import { sendWelcomeEmail } from "../../../utils/emails/welcomeMail.js";
import { ErrorHandler } from "../../../utils/errorHandler.js";
import { sendToken } from "../../../utils/sendToken.js";
import {
  createNewUserRepo,
  deleteUserRepo,
  findUserForPasswordResetRepo,
  findUserRepo,
  getAllUsersRepo,
  updateUserProfileRepo,
  updateUserRoleAndProfileRepo,
} from "../models/user.repository.js";
import crypto from "crypto";
import UserModel from "../models/user.schema.js";
// register user 
export const createNewUser = async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    const newUser = await createNewUserRepo(req.body);

    // sending token
    await sendToken(newUser, res, 200);
    // Implement sendWelcomeEmail function to send welcome message
    await sendWelcomeEmail(newUser);


  } catch (err) {
    //  handle error for duplicate email
    if (err.code == 11000) {
      err.message = "Email already registered...!";
      return next(new ErrorHandler(400, err.message));
    }
    return next(new ErrorHandler(400, err));
  }
};
// user login 
export const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler(400, "please enter email/password"));
    }
    const user = await findUserRepo({ email }, true);
    if (!user) {
      return next(
        new ErrorHandler(401, "user not found! register yourself now!!")
      );
    }
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return next(new ErrorHandler(401, "Invalid email or passswor!"));
    }
    await sendToken(user, res, 200);
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};
// logout user
export const logoutUser = async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({ success: true, msg: "logout successful" });
};
// forget user password through otp genration
export const forgetPassword = async (req, res, next) => {
  // Implement feature for forget password
  try {
    const { email } = req.body;
    const user = await findUserRepo({ email });

    if (!user) {
      return next(
        new ErrorHandler(404, "User not found with the provided email")
      );
    }
    // sending token to client 
    const resetToken = await user.getResetPasswordToken();
    // console.log(resetToken + "reset token");

    await user.save();
    await sendPasswordResetEmail(user, resetToken);

    res
      .status(200)
      .json({ success: true, msg: "Password reset email sent successfully" });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }

};
// reset the user password
export const resetUserPassword = async (req, res, next) => {
  try { // Implement feature for reset password
    const token = req.params.token;
    const { password, confirmPassword } = req.body;
    // check the token is correct or not 
    const hashToken = crypto.createHash("sha256").update(token).digest("hex");
    // console.log(hashToken);
    const user = await findUserForPasswordResetRepo(hashToken);
    if (!user) {
      return next(new ErrorHandler(400, "Invalid Token or Token is Expired"));
    }
    // checking the password and confirmpassword both are same or not 
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // save the data and run the pre middleware for hashing the password
    await user.save();
    return res.status(200).json({ success: true, msg: "Password Changed Successfully" })

  }
  catch (err) {
    console.log(err);
    next(err);
  }
};
// get user details 
export const getUserDetails = async (req, res, next) => {
  try {
    const userDetails = await findUserRepo({ _id: req.user._id });
    res.status(200).json({ success: true, userDetails });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};
// update user password
export const updatePassword = async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  try {
    if (!currentPassword) {
      return next(new ErrorHandler(401, "pls enter current password"));
    }

    const user = await findUserRepo({ _id: req.user._id }, true);
    const passwordMatch = await user.comparePassword(currentPassword);
    if (!passwordMatch) {
      return next(new ErrorHandler(401, "Incorrect current password!"));
    }

    if (!newPassword || newPassword !== confirmPassword) {
      return next(
        new ErrorHandler(401, "mismatch new password and confirm password!")
      );
    }

    user.password = newPassword;
    await user.save();
    await sendToken(user, res, 200);
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};
// updating the user profile
export const updateUserProfile = async (req, res, next) => {
  const { name, email } = req.body;
  try {
    const updatedUserDetails = await updateUserProfileRepo(req.user._id, {
      name,
      email,
    });
    res.status(201).json({ success: true, updatedUserDetails });
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

// admin controllers
// get all user details
export const getAllUsers = async (req, res, next) => {
  try {
    const allUsers = await getAllUsersRepo();
    res.status(200).json({ success: true, allUsers });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};
// get user details done by admin 
export const getUserDetailsForAdmin = async (req, res, next) => {
  try {
    const userDetails = await findUserRepo({ _id: req.params.id });
    if (!userDetails) {
      return res
        .status(400)
        .json({ success: false, msg: "no user found with provided id" });
    }
    res.status(200).json({ success: true, userDetails });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};
// delete user done by admin 
export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await deleteUserRepo(req.params.id);
    if (!deletedUser) {
      return res
        .status(400)
        .json({ success: false, msg: "no user found with provided id" });
    }

    res
      .status(200)
      .json({ success: true, msg: "user deleted successfully", deletedUser });
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};
// update the user role done by admin 
export const updateUserProfileAndRole = async (req, res, next) => {
  // Write your code here for updating the roles of other users by admin
  try {
    const { name, email, role } = req.body;
    const id = req.body.params;
    // we are using this because if admin wants to change the any one value or the all three value
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    // update the user data by admin 
    const updatedUserDetails = await updateUserProfileRepo(id, updateData);
    if (!updatedUserDetails) {
      return next(new ErrorHandler(404, "No user found with provided id"));
    }
    return res.status(201).json({ success: true, updatedUserDetails });

  } catch (err) {
    // Handle invalid ObjectId
    if (err.name === "CastError") {
      return next(new ErrorHandler(400, "Invalid user ID format"));
    }
    console.log(err);
    return next(err);
  }
};
