import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './features/auth/authSlice';
import { authApi } from './features/auth/authService';
import { dashboardApi } from './features/dashboard/dashboardApi';
import { tenantsApi } from './features/tenants/tenantsApi';
import { branchesApi } from './features/branches/branchesApi';

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['username', 'email', 'role', 'tenantId', 'requirePasswordChange', 'mfaEnabled'],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  [authApi.reducerPath]: authApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [tenantsApi.reducerPath]: tenantsApi.reducer,
  [branchesApi.reducerPath]: branchesApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(authApi.middleware, dashboardApi.middleware, tenantsApi.middleware, branchesApi.middleware),
})

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
