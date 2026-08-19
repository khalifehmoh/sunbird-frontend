/** Matches Nest `PagedResponseDto<T>` from list endpoints. */
export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last?: boolean
}

/** Shared query fields for paginated list endpoints. */
export interface PagedQuery {
  page: number
  size: number
  search: string
  sort?: string
}
