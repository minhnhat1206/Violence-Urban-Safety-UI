// import { configureStore } from '@reduxjs/toolkit'
// import foodApi from './features/dish/foodApi'
// import salusApi from './features/dish/salusApi'
// export const store = configureStore({
//   reducer: {
//     [foodApi.reducerPath]: foodApi.reducer,
//     [salusApi.reducerPath]: salusApi.reducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware()
//       .concat(foodApi.middleware)
//       .concat(salusApi.middleware),


// })

import { configureStore, createSlice } from '@reduxjs/toolkit'

const appSlice = createSlice({
  name: 'app',
  initialState: {},
  reducers: {},
})

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})
