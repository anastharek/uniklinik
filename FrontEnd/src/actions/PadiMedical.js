import { LOAD_AETS, PAGE_DATA, CLICKED_ROW, EMPTY_ROW_CLICKED, BLOCKED_UPDATE } from './actions-types'

export function loadAvailableAETS(aets) {
  return {
    type: LOAD_AETS,
    payload: aets
  }
}


export function padimedicalContent(data) {
  return {
    type: PAGE_DATA,
    payload: data
  }
}

export function clickRow(id) {
  return {
    type: CLICKED_ROW,
    payload: id
  }
}


export function empty_row() {
  return {
    type: EMPTY_ROW_CLICKED
  }
}

export function blockToggle() {
  return { type: BLOCKED_UPDATE }
}