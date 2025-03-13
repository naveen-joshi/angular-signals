import { createFeatureSelector, createSelector } from '@ngrx/store';
import { tabAdapter } from './tab.adapter';
import { ScreenFeatureState } from '../screen.feature.state';
import { TabState } from './tab.reducer';

export const getTabFeatureSelector = (screenName: string) =>
    createFeatureSelector<ScreenFeatureState>(screenName);

export const getTabSelectors = (screenName: string) => {
    const getFeatureState = getTabFeatureSelector(screenName);

    const selectTabState = createSelector(
        getFeatureState,
        (state: ScreenFeatureState) => state.tabs
    );

    const adapterSelectors = tabAdapter.getSelectors();

    const selectTabIds = createSelector(
        selectTabState,
        adapterSelectors.selectIds
    );

    const selectTabEntities = createSelector(
        selectTabState,
        adapterSelectors.selectEntities
    );

    const selectAllTabs = createSelector(
        selectTabState,
        adapterSelectors.selectAll
    );

    const selectTabTotal = createSelector(
        selectTabState,
        adapterSelectors.selectTotal
    );

    const selectCurrentTabId = createSelector(
        selectTabState,
        (state: TabState) => state.selectedTabId
    );

    return {
        selectTabState,
        selectTabIds,
        selectTabEntities,
        selectAllTabs,
        selectTabTotal,
        selectCurrentTabId
    };
};