import { Query } from "mongoose";

/**
 * Interface for query string parameters passed to the API.
 * Includes optional fields for pagination, sorting, field limiting, and other dynamic filters.
 */
interface QueryString {
  page?: string; // Page number for pagination (e.g., ?page=2)
  sort?: string; // Fields to sort by, separated by commas (e.g., ?sort=price,-ratingsAverage)
  limit?: string; // Number of results per page (e.g., ?limit=10)
  fields?: string; // Fields to include in the response, separated by commas (e.g., ?fields=name,price)
  [key: string]: unknown; // To handle additional query parameters dynamically
}

class APIFeatures<T> {
  query: Query<T[], T>; // The Mongoose query object to be modified
  queryString: QueryString; // The query string parameters provided by the API request

  /**
   * * A utility class to enhance Mongoose queries with additional features such as filtering, sorting,
   * field limiting, and pagination. This makes API query manipulation easier and more structured.
   *
   * Constructor to initialize the APIFeatures class.
   *
   * @param query - Mongoose query object to be manipulated
   * @param queryString - Object containing query parameters from the API request
   */
  constructor(query: Query<T[], T>, queryString: QueryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * Filters the query based on the query string parameters.
   * Excludes reserved fields like `page`, `sort`, `limit`, and `fields`, and applies advanced
   * filtering using MongoDB operators (e.g., `gt`, `gte`, `lt`, `lte`, `eq`).
   *
   * @returns The current instance of APIFeatures for chaining.
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Replace MongoDB operators with prefixed `$` for advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|eq|ne)\b/g,
      (match) => `$${match}`
    );

    // Apply the filtering to the query
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  /**
   * Sorts the query results based on the `sort` parameter in the query string.
   * Allows sorting by multiple fields, with descending order indicated by a `-` prefix.
   *
   * @returns The current instance of APIFeatures for chaining.
   */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // Default sorting by newest entries
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  /**
   * Limits the fields included in the query results based on the `fields` parameter.
   * By default, excludes the `__v` field from the results.
   *
   * @returns The current instance of APIFeatures for chaining.
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      // Exclude `__v` field by default
      this.query = this.query.select("-__v");
    }

    return this;
  }

  /**
   * Paginates the query results based on `page` and `limit` parameters in the query string.
   * Computes the number of documents to skip and the limit per page.
   *
   * @returns The current instance of APIFeatures for chaining.
   */
  paginate() {
    const page = parseInt(this.queryString.page || "1", 10); // Default to page 1
    const limit = parseInt(this.queryString.limit || "100", 10); // Default to 100 results per page
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeatures;

// Usage Example:

// Mongoose model query
// const query = Tour.find(); // Replace `Tour` with your model

// Query string from request
// const queryString = { sort: 'name', page: '2', limit: '10', fields: 'name,price' };

// Initialize and chain features
// const apiFeatures = new APIFeatures(query, queryString);
// apiFeatures.filter().sort().limitFields().paginate();

// Execute the final query
// const results = await apiFeatures.query;
