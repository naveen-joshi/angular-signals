import { signalStore, withState, withMethods, withComputed } from '@ngrx/signals';
import { patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { Tab } from './tabs.model';
import { withEntities } from '@ngrx/signals/entities';

// Define the state interface
export interface TabState {
    selectedTabId: string | null;
}

// Initial state
const initialState: TabState = {
    selectedTabId: null
};

// Create the signal store
export const TabsStore = signalStore(
    { providedIn: 'root' },
    withEntities<Tab>(),
    withState<TabState>(initialState),
    withMethods((store) => ({
        addTab(pageNumber: number) {
            const newTab: Tab = {
                screenId: 'Search ' + pageNumber,
                label: 'Search ' + pageNumber,
                icon: 'sample',
                active: true
            };

            // Update all existing tabs to inactive
            const currentEntities = store.entities();
            const updatedEntities = currentEntities.map((entity: Tab) => ({
                ...entity,
                active: false
            }));
            
            patchState(store, (state) => ({
                ...state,
                entityMap: {
                    ...state.entityMap,
                    ...updatedEntities.reduce((acc, entity) => ({
                        ...acc,
                        [entity.screenId]: entity
                    }), {})
                }
            }));
            
            // Add the new tab
            patchState(store, (state) => ({
                ...state,
                entityMap: {
                    ...state.entityMap,
                    [newTab.screenId]: newTab
                },
                ids: [...state.ids, newTab.screenId]
            }));
        },

        deleteTab(screenId: string) {
            const entities = store.entities();
            const deletedTabIndex = entities.findIndex((tab: Tab) => tab.screenId === screenId);
            const wasActive = entities[deletedTabIndex]?.active;
            
            // Remove the tab
            patchState(store, (state) => ({
                ...state,
                entityMap: Object.fromEntries(
                    Object.entries(state.entityMap).filter(([key]) => key !== screenId)
                ),
                ids: state.ids.filter(id => id !== screenId)
            }));

            if (wasActive) {
                // Update the active state of remaining tabs
                const remainingEntities = store.entities();
                const newActivatedIndex = deletedTabIndex === 0 ? 0 : deletedTabIndex - 1;
                
                const updatedEntities = remainingEntities.map((entity: Tab, index: number) => ({
                    ...entity,
                    active: index === newActivatedIndex
                }));

                patchState(store, (state) => ({
                    ...state,
                    entityMap: {
                        ...state.entityMap,
                        ...updatedEntities.reduce((acc, entity) => ({
                            ...acc,
                            [entity.screenId]: entity
                        }), {})
                    }
                }));
            }
        },

        deleteAll() {
            const entities = store.entities();
            if (entities.length === 0) return;

            // Find the first tab to keep active
            const firstTab = entities[0];
            
            patchState(store, (state) => ({
                ...state,
                entityMap: {
                    [firstTab.screenId]: { ...firstTab, active: true }
                },
                ids: [firstTab.screenId],
                selectedTabId: firstTab.screenId
            }));
        },

        renameTab(screenId: string, newLabel: string) {
            const entity = store.entities().find((tab: Tab) => tab.screenId === screenId);
            if (!entity) return;

            patchState(store, (state) => ({
                ...state,
                entityMap: {
                    ...state.entityMap,
                    [screenId]: {
                        ...entity,
                        label: newLabel
                    }
                }
            }));
        },

        selectTab(screenId: string) {
            const entities = store.entities();
            const updatedEntities = entities.map((entity: Tab) => ({
                ...entity,
                active: entity.screenId === screenId
            }));

            patchState(store, (state) => ({
                ...state,
                entityMap: {
                    ...state.entityMap,
                    ...updatedEntities.reduce((acc, entity) => ({
                        ...acc,
                        [entity.screenId]: entity
                    }), {})
                },
                selectedTabId: screenId
            }));
        },

        resetState() {
            patchState(store, (state) => ({
                ...state,
                entityMap: {},
                ids: [],
                selectedTabId: null
            }));
        }
    })),
    withComputed((store) => ({
        allTabs: computed(() => store.entities()),
        total: computed(() => store.ids().length),
        selectedTabId: computed(() => store.selectedTabId()),
        selectedTab: computed(() => 
            store.entities().find((tab: Tab) => tab.screenId === store.selectedTabId())
        )
    }))
);
