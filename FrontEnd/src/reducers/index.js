import { combineReducers } from 'redux'
import PadiMedical from './PadiMedical'
import ManualQuery from './ManualQuery'
import AutoRetrieveQueryList from './AutoRetrieveQueryList'
import AutoRetrieveResultList from './AutoRetrieveResultList'
import DeleteList from './DeleteList'
import ExportList from './ExportList'
import AnonList from './AnonList'

const appReducer = combineReducers({
  PadiMedical,
  ManualQuery,
  AutoRetrieveQueryList,
  AutoRetrieveResultList,
  DeleteList, 
  ExportList, 
  AnonList
})

const rootReducer = (state, action) => {
  if (action.type === 'LOG_OUT') {
    state = undefined
  }

  return appReducer(state, action)
}

export default rootReducer