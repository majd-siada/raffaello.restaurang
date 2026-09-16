/**
 * Ops API client — session cookies + CSRF for unsafe methods.
 * Base path: /api/ops (compatibility mount; same Django handlers as /api/admin).
 */

import { createStaffApi, StaffApiError } from '../staffSessionApi.js'

const api = createStaffApi('/api/ops')

/** @deprecated Prefer StaffApiError — kept for Ops call sites */
export class OpsApiError extends StaffApiError {
  constructor(message, opts) {
    super(message, opts)
    this.name = 'OpsApiError'
  }
}

export async function opsFetch(path, options = {}) {
  try {
    return await api.staffFetch(path, options)
  } catch (err) {
    if (err instanceof StaffApiError) {
      throw new OpsApiError(err.message, { status: err.status, body: err.body })
    }
    throw err
  }
}

export async function opsList(path, query = {}) {
  try {
    return await api.staffList(path, query)
  } catch (err) {
    if (err instanceof StaffApiError) {
      throw new OpsApiError(err.message, { status: err.status, body: err.body })
    }
    throw err
  }
}

export const OPS_API_BASE = api.BASE
export const getCookie = api.getCookie
export const parseList = api.parseList
export const ensureCsrf = api.ensureCsrf
