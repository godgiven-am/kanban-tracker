import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { sessionSlice } from '../entities/user/model';
import { reportsSlice } from '../features/report/model/reportsSlice';
import { cardsSlice, columnsSlice, commentsSlice } from '../slices';

export const store = configureStore({
  reducer: { session: sessionSlice.reducer, cards: cardsSlice.reducer, columns: columnsSlice.reducer, comments: commentsSlice.reducer, reports: reportsSlice.reducer },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
