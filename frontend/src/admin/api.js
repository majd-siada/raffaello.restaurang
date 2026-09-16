/**
 * Admin API client — same Django handlers as /api/ops, primary mount /api/admin.
 */

import { createStaffApi, StaffApiError } from '../staffSessionApi.js'

const api = createStaffApi('/api/admin')

export class AdminApiError extends StaffApiError {
  constructor(message, opts) {
    super(message, opts)
    this.name = 'AdminApiError'
  }
}

export async function adminFetch(path, options = {}) {
  try {
    return await api.staffFetch(path, options)
  } catch (err) {
    if (err instanceof StaffApiError) {
      throw new AdminApiError(err.message, { status: err.status, body: err.body })
    }
    throw err
  }
}

export async function adminList(path, query = {}) {
  try {
    return await api.staffList(path, query)
  } catch (err) {
    if (err instanceof StaffApiError) {
      throw new AdminApiError(err.message, { status: err.status, body: err.body })
    }
    throw err
  }
}

export const ADMIN_API_BASE = api.BASE
export const getCookie = api.getCookie
export const parseList = api.parseList
export const ensureCsrf = api.ensureCsrf
