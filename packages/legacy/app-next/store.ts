import { store } from '../frontend/src/store/store'
import { persistStore } from 'redux-persist'

export { store }
export const persistor = persistStore(store)