import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ScreenFeatureState } from "../screen.feature.state"; 

export function getScreenFeatureSelector(screenName: string) {
    return createFeatureSelector<ScreenFeatureState>(screenName);
}

export function getScreenState(screenName: string) {
    const screenState = getScreenFeatureSelector(screenName);

    const selectScreenState = createSelector(
        screenState,
        (state: ScreenFeatureState) => state.screen
    );

    const selectQueriesTriggered = createSelector(
        selectScreenState,
        (state) => state.queriesTriggered
    );

    return {
        selectScreenState,
        selectQueriesTriggered
    };
}