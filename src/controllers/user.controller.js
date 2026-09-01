import { asyncHandler } from "../utils/asynchandler.js";
import { APIerror } from "../utils/APIerror.js";
import { User } from "../models/user.model.js";
import { uploadoncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "JsonWebToken";

const generateaccessandrefreshtoken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ ValidateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    console.log("error", error);
    throw new APIerror(500, "something went wrong ");
  }
};

const registeruser = asyncHandler(async (req, res) => {
  //get user details from frontend
  // validation - not empty
  //check if user already exists- username,email
  //check for images,check fr avatar
  //upload them on cloudnary - avatar
  //create user object ,entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return res

  const { username, fullname, email, password } = req.body;
  // console.log("REQ FILES:", req.files);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new APIerror(400, "all fields  are required");
  }

  const existeduser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existeduser) {
    throw new APIerror(409, "user with email and username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new APIerror(400, "avatar is required");
  }

  const avatar = await uploadoncloudinary(avatarLocalPath);
  const coverImage = await uploadoncloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new APIerror(400, "avatar is required");
  }

  const user = await User.create({
    fullname,
    email,
    password,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createuser = await User.findById(user._id).select(
    "-password  -refreshToken"
  );

  if (!createuser) {
    throw new APIerror(500, "tere toh lag gye ");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createuser, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req.body = data
  //username || email
  //find username|| email
  //password check
  //access and refresh token
  //send cookie

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new APIerror(400, "username or email are required");
  }

  const existlogin = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!existlogin) {
    throw new APIerror(404, "existlogin does not exist");
  }

  const ispassvalid = await existlogin.isPasswordCorrect(password);

  if (ispassvalid) {
    throw new APIerror(401, "invalid password");
  }

  const { refreshToken, accessToken } = await generateaccessandrefreshtoken(
    existlogin._id
  );

  const loggedinUser = await User.findById(existlogin._id).select(
    "-password -refreshtoken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedinUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new APIerror(401, "unauthorised request");
  }

  const decodedincomingrefreshtoken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const user = await User.findById(decodedincomingrefreshtoken?._id);
  if (!user) {
    throw new APIerror(401, "invalid refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new APIerror(401, "mismatch refresh token");
  }
  const options = {
    httpOnly: true,
    secure: true,
  };
  const { accessToken, newRefreshtoken } = await generateaccessandrefreshtoken(
    user._id
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshtoken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, newRefreshtoken },
        "access token Refreshed "
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new APIerror(400, "invalid oldpassword");
  }

  user.password = newPassword;
  user.save({ ValidateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "change password successfully"));
});

const getcurrentuser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "getcurrent user succesfully"));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullName || !email) {
    throw new APIerror(400, "all details are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "update account details successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = await req.file?.path;

  if (!avatarLocalPath) {
    throw new APIerror(400, "avatar is not present");
  }
  const avatar = await uploadoncloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new APIerror(400, "error occur whhile upload avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});
const updateUsercoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = await req.file?.path;

  if (!coverImageLocalPath) {
    throw new APIerror(400, "coverimage is not present");
  }
  const coverImage = await uploadoncloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new APIerror(400, "error occur whhile upload coverimage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverimage updated succesfully"));
});

const getUserchannelprofile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new APIerror(400, "username does not exist");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscriberCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new APIerror(400, "channel does not exists");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getUserwatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
  ]);
});

export {
  registeruser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getcurrentuser,
  updateAccountDetails,
  updateUserAvatar,
  updateUsercoverImage,
  getUserchannelprofile,
  getUserwatchHistory,
};
