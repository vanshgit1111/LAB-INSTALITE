export function parsePagination(query) {
  let { page = 1, limit = 10 } = query;

  const pageNum  = Number(page);
  const limitNum = Number(limit);

  // Must be positive integers (not floats, not zero, not negative, not NaN)
  if (
    !Number.isInteger(pageNum)  || pageNum  <= 0 ||
    !Number.isInteger(limitNum) || limitNum <= 0
  ) {
    return { error: "page and limit must be positive integers" };
  }

  // Cap limit at 50 — don't error, just clamp
  const effectiveLimit = Math.min(limitNum, 50);
  const skip = (pageNum - 1) * effectiveLimit;

  return {
    page:  pageNum,
    limit: effectiveLimit,
    skip,
  };
}

export function buildPaginationMeta(page, limit, total) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { page, limit, total, totalPages };
}
