import { configureStore } from "@reduxjs/toolkit"
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist"
import storage from "redux-persist/lib/storage" // defaults to localStorage for web

import authReducer from "./authSlice"
import expenseReducer from "./expenseSlice"

const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "user"],
}

const expensePersistConfig = {
  key: "expenses",
  storage,
  // If you want to persist filters or pagination, add them here
  whitelist: ["filters"],
}

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer)
const persistedExpenseReducer = persistReducer(
  expensePersistConfig,
  expenseReducer
)

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    expenses: persistedExpenseReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions to prevent warnings
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// import { configureStore } from "@reduxjs/toolkit"
// import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
// import authReducer from "./authSlice"
// import expenseReducer from "./expenseSlice"

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     expenses: expenseReducer,
//   },
// })

// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch

// export const useAppDispatch = () => useDispatch<AppDispatch>()
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
