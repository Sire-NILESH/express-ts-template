import { StatusCodes } from "http-status-codes";
import { Document, Model as MongooseModel, PopulateOptions } from "mongoose";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import APIFeatures from "../utils/apiFeatures";

/**
 * @description - Delete [Model]
 * @route - DELETE /api/v1/[resource-endpoint]/:id
 *
 * @param {Array} Model - MongoDB collection
 * @returns null
 */
const deleteOne = <T extends Document>(Model: MongooseModel<T>) =>
  catchAsync(async (req, res, next) => {
    if (!req.params.id) {
      return next(new AppError("Invalid ID provided", StatusCodes.BAD_REQUEST));
    }

    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new AppError("No document found with that ID", StatusCodes.NOT_FOUND)
      );
    }

    res.status(StatusCodes.NO_CONTENT).json({
      status: "success",
      data: null,
    });
  });

/**
 * @description - Update [Model]
 * @route - PATCH /api/v1/[resource-endpoint]/:id
 *
 * @param {Array} Model - MongoDB collection
 * @returns updated model
 */
const updateOne = <T extends Document>(Model: MongooseModel<T>) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return the modified document rather than the original
      runValidators: true, // validate the update operation against the model's schema
    });

    if (!doc) {
      return next(
        new AppError("No document found with that ID", StatusCodes.NOT_FOUND)
      );
    }

    res.status(StatusCodes.OK).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

/**
 * @description - Create [Model]
 * @route - POST /api/v1/[resource-endpoint]/:id
 *
 * @param {Array} Model - MongoDB collection
 * @returns created model
 */
const createOne = <T extends Document>(Model: MongooseModel<T>) =>
  catchAsync(async (req, res) => {
    // Creating new document and saving to the database
    const doc = await Model.create(req.body);

    res.status(StatusCodes.CREATED).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

/**
 * @description - Get [Model] (Single)
 * @route - GET /api/v1/[resource-endpoint]/:id
 *
 * @param {Array} Model - MongoDB collection
 * @param {Object} populateOptions - https://mongoosejs.com/docs/populate.html
 * @returns model data
 */
const getOne = <T extends Document>(
  Model: MongooseModel<T>,
  populateOptions?: PopulateOptions | (string | PopulateOptions)[]
) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if (!doc) {
      return next(
        new AppError("No document found with that ID", StatusCodes.NOT_FOUND)
      );
    }

    res.status(StatusCodes.OK).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

/**
 * @description - Get All [Model]
 * @route - GET /api/v1/[resource-endpoint]
 *
 * @param {Array} Model - MongoDB collection
 * @returns models data
 */
const getAll = <T extends Document>(Model: MongooseModel<T>) =>
  catchAsync(async (req, res) => {
    // Execute query
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    // Send response
    res.status(StatusCodes.OK).json({
      status: "success",
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

const factory = {
  createOne,
  deleteOne,
  updateOne,
  getOne,
  getAll,
};

export default factory;
