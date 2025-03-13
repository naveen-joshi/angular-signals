import {Action, createReducer, on} from '@ngrx/store';
import { Tab } from './tabs.model';
import { tabAdapter } from './tab.adapter';
import * as actions from './tab.action';
import { EntityState } from '@ngrx/entity';

export interface TabState extends EntityState<Tab> {
    selectedTabId: string | null;
}

export const tabInitialState: TabState = tabAdapter.getInitialState({
    selectedTabId: null
});

const createTabReducer = (screenName: string) => {
    return createReducer(
        tabInitialState,
        on(actions.addTabAction, (state, type) => {
            const updates = state.ids.map(id => ({
                id: id as string,
                changes: {
                    active: false
                }
            }));

            const newTab: Tab = {
                screenId: 'Search ' + type.pageNumber,
                label: 'Search ' + type.pageNumber,
                icon: 'sample',
                active: true
            }

            return tabAdapter.updateMany(updates, {
                ...state,
                ...tabAdapter.addOne(newTab, state),
                noOfPages: type.pageNumber
            })
        }),
        on(actions.deleteTabAction, (state, { screenId }) => {
            const deletedTabIndex = (state.ids as string[]).indexOf(screenId);
            const wasActive = state.entities[screenId]?.active;
            const newState = tabAdapter.removeOne(screenId, state);

            let updates: {id: string, changes: {active: boolean}}[] = [];

            if(wasActive) {
                updates = newState.ids.map((id, index) => ({
                    id: id as string,
                    changes: {
                        active : deletedTabIndex === 0 ? index === 0 : index === deletedTabIndex -1
                    }
                }))
            }
            return tabAdapter.updateMany(updates, {...newState});
        }),
        on(actions.selectTabAction, (state, { screenId }) => {
            const updates = state.ids.map((id) => ({
                id: id as string,
                changes: { active: id === screenId }
            }))
            return tabAdapter.updateMany(updates, {
                ...state,
                selectedTabId: screenId
            });
        }),
        on(actions.resetTabStateAction, () => tabInitialState)
    );
}

export function tabReducerFactory(screenName: string) {
    return (state: TabState | undefined, action: Action) => {
        const reducer = createTabReducer(screenName);
        return reducer(state, action);
    }
}
