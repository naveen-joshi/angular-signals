import { createReducer, on } from '@ngrx/store';
import * as actions from './screens.actions';

export interface ScreenState {
    queriesTriggered: number;
}

export const initialState: ScreenState = {
    queriesTriggered: 1
};

const createScreenReducer = (screenName: string) => {
    return createReducer(
        initialState,
        on(actions.incrementPageAction, (state) => {
            return {
                ...state,
                queriesTriggered: state.queriesTriggered + 1
            }
        }),
        on(actions.resetScreenStateAction, (state) => ({
            ...state,
            queriesTriggered: 1
        }))
    );
};