import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './features/auth/authSlice';
import { authApi } from './features/auth/authService';
import { dashboardApi } from './features/dashboard/dashboardApi';
import { auditApi } from './features/audit/auditApi';
import { tenantsApi } from './features/tenants/tenantsApi';
import { branchesApi } from './features/branches/branchesApi';
import { usersApi } from './features/users/usersApi';
import { groupsApi } from './features/groups/groupsApi';
import { rolesApi } from './features/roles/rolesApi';
import { modulesApi } from './features/modules/modulesApi';

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['username', 'email', 'role', 'tenantId', 'requirePasswordChange', 'mfaEnabled'],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  [authApi.reducerPath]: authApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [auditApi.reducerPath]: auditApi.reducer,
  [tenantsApi.reducerPath]: tenantsApi.reducer,
  [branchesApi.reducerPath]: branchesApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [groupsApi.reducerPath]: groupsApi.reducer,
  [rolesApi.reducerPath]: rolesApi.reducer,
  [modulesApi.reducerPath]: modulesApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware,
      dashboardApi.middleware,
      auditApi.middleware,
      tenantsApi.middleware,
      branchesApi.middleware,
      usersApi.middleware,
      groupsApi.middleware,
      rolesApi.middleware,
      modulesApi.middleware,
    ),
})

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
