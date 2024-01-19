import { asyncHandlerPromise } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.modal.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.accessToken = accessToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandlerPromise(async (req, res) => {
  const reqBody = req.body;
  console.log("Register User Api Is Hit", reqBody);

  if (!reqBody?.fullName?.trim()) {
    // Validation: Check if fullName is provided
    throw new ApiError(400, "fullName is required");
  }
  if (!reqBody?.email?.trim()) {
    // Validation: Check if email is provided
    throw new ApiError(400, "email is required");
  }
  if (!reqBody?.username?.trim()) {
    // Validation: Check if username is provided
    throw new ApiError(400, "username is required");
  }
  if (!reqBody?.password?.trim()) {
    // Validation: Check if password is provided
    throw new ApiError(400, "password is required");
  }

  const { username, email, password, fullName } = reqBody;

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  } else {
    console.log("User does not exist in the database");
  }

  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl,
  });

  const createdUser = await User.findById(user._id).select(
    // Calling the database to check if the user is created and selecting and removing unnecessary fields
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  } else {
    console.log("User created");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

// Function to login a user
const loginUser = asyncHandlerPromise(async (req, res) => {
  const reqBody = req.body;
  const { username, email, password } = reqBody;
  console.log("Login User Api Is Hit", reqBody);

  if (!(username?.trim() || email?.trim())) {
    // Validation: Check if either username or email is provided
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  } else {
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
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
      new ApiResponse(200, {
        user, // Old user not updated with access and refresh token
        accessToken,
        refreshToken,
      })
    );
});

export { registerUser, loginUser };
