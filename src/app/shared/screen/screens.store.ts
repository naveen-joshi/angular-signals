import { signalStore, withState, withMethods } from '@ngrx/signals';
import { patchState } from '@ngrx/signals';

export interface ScreenState {
    queriesTriggered: number;
}

const initialState: ScreenState = {
    queriesTriggered: 1
};

export const ScreensStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store) => ({
        incrementPage() {
            patchState(store, (state) => ({
                queriesTriggered: state.queriesTriggered + 1
            }));
        },
        resetScreenState() {
            patchState(store, (state) => ({
                queriesTriggered: 1
            }));
        }
    }))
);
