/**
 * Parses page and limit from query parameters with defaults and bounds
 * @param {Object} query - Express req.query
 * @param {number} defaultLimit - Default items per page (default 10)
 * @param {number} maxLimit - Maximum allowed limit (default 100)
 * @returns {{ page: number | null, limit: number, skip: number, isPaginated: boolean }}
 */
export const getPaginationParams = (query = {}, defaultLimit = 10, maxLimit = 100) => {
  const { page, limit } = query;
  const isPageProvided = page !== undefined && page !== "" && page !== null;
  const pageNum = isPageProvided ? parseInt(page, 10) : null;
  const limitParsed = limit !== undefined && limit !== "" && limit !== null ? parseInt(limit, 10) : defaultLimit;
  const safeLimit = Math.min(Math.max(1, isNaN(limitParsed) ? defaultLimit : limitParsed), maxLimit);

  const isPaginated = isPageProvided && !isNaN(pageNum) && pageNum > 0;
  const safePage = isPaginated ? pageNum : 1;
  const skip = (safePage - 1) * safeLimit;

  return {
    page: isPaginated ? safePage : null,
    limit: safeLimit,
    skip,
    isPaginated,
  };
};

/**
 * Builds a standardized pagination metadata object
 * Provides both totalItems and totalOrders, itemsPerPage and limit for 100% backward compatibility
 * @param {number} totalCount - Total count of documents matching filter
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Standardized pagination object
 */
export const buildPaginationMeta = (totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const currentPage = Math.max(1, page || 1);

  return {
    currentPage,
    totalPages,
    totalItems: totalCount,
    totalOrders: totalCount,
    limit,
    itemsPerPage: limit,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

export default {
  getPaginationParams,
  buildPaginationMeta,
};
