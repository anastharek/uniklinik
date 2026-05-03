import { LOAD_AETS, LOG_IN, PAGE_DATA, CLICKED_ROW, EMPTY_ROW_CLICKED, BLOCKED_UPDATE } from '../actions/actions-types'

const initialState = {
  OrthancAets: [],
  roles: {},
  username: null,
  content_data: null,
  clicked_row: [],
  isblocked: false,
}

export default function PadiMedicalReducer(state = initialState, action) {
  switch (action.type) {

    case LOAD_AETS:
      return {
        ...state,
        OrthancAets: action.payload
      }

    case LOG_IN:
      return {
        ...state,
        username: action.payload.username,
        roles: { ...action.payload }
      }

    case PAGE_DATA:
      return {
        ...state,
        content_data: action.payload,
      }

    case CLICKED_ROW:
      if (state.isblocked) return { ...state }
      if (state.clicked_row.indexOf(action.payload) != -1) {
        let index = state.clicked_row.indexOf(action.payload)
        state.clicked_row.splice(index, 1)
      } else {
        state.clicked_row.push(action.payload)
      }
      return {
        ...state,
      }
    case EMPTY_ROW_CLICKED:
      return {
        ...state, clicked_row: []
      }
    case BLOCKED_UPDATE:
      state.isblocked = !state.isblocked
      return {
        ...state
      }

    default:
      return state
  }
}
