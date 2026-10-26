export function parsePagination(query) {
  let { page = 1, limit = 10 } = query;

  const pageNum = Number(page);
  const limitNum = Number(limit);

  if (
    !Number.isInteger(pageNum) ||
    pageNum <= 0 ||
    !Number.isInteger(limitNum) ||
    limitNum <= 0
  ) {
    return {
      error: "page and limit must be positive integers",
    };
  }

  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip,
  };
}

export function buildPaginationMeta(page, limit, total) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
  };
}
