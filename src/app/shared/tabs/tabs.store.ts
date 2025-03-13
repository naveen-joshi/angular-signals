import { signalStore, withState, withMethods, withComputed } from '@ngrx/signals';
import { patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { Tab } from './tabs.model';
import { EntityState, createEntityAdapter } from '@ngrx/entity';

// Define the state interface
export interface TabState extends EntityState<Tab> {
    selectedTabId: string | null;
}

// Create entity adapter
const tabAdapter = createEntityAdapter<Tab>({
    selectId: (tab: Tab) => tab.screenId,
    sortComparer: false
});

// Initial state
const initialState: TabState = tabAdapter.getInitialState({
    selectedTabId: null
});

// Create the signal store
export const TabsStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store) => ({
        addTab(pageNumber: number) {
            const updates = store.ids().map(id => ({
                id: id as string,
                changes: {
                    active: false
                }
            }));

            const newTab: Tab = {
                screenId: 'Search ' + pageNumber,
                label: 'Search ' + pageNumber,
                icon: 'sample',
                active: true
            };

            const updatedState = tabAdapter.updateMany(updates, {
                ids: store.ids(),
                entities: store.entities(),
                selectedTabId: store.selectedTabId()
            });
            
            const finalState = tabAdapter.addOne(newTab, updatedState);
            patchState(store, finalState);
        },

        deleteTab(screenId: string) {
            const currentIds = store.ids();
            const deletedTabIndex = (currentIds as string[]).indexOf(screenId);
            const wasActive = store.entities()[screenId]?.active;
            
            const currentState = {
                ids: currentIds,
                entities: store.entities(),
                selectedTabId: store.selectedTabId()
            };
            
            const newState = tabAdapter.removeOne(screenId, currentState);

            let updates: { id: string, changes: { active: boolean } }[] = [];

            if (wasActive) {
                updates = newState.ids.map((id, index) => ({
                    id: id as string,
                    changes: {
                        active: deletedTabIndex === 0 ? index === 0 : index === deletedTabIndex - 1
                    }
                }));
            }

            const finalState = tabAdapter.updateMany(updates, newState);
            patchState(store, finalState);
        },

        selectTab(screenId: string) {
            const updates = store.ids().map((id) => ({
                id: id as string,
                changes: { active: id === screenId }
            }));

            const currentState = {
                ids: store.ids(),
                entities: store.entities(),
                selectedTabId: store.selectedTabId()
            };

            const finalState = tabAdapter.updateMany(updates, {
                ...currentState,
                selectedTabId: screenId
            });

            patchState(store, finalState);
        },

        resetState() {
            patchState(store, initialState);
        }
    })),
    withComputed((store) => {
        const adapterSelectors = tabAdapter.getSelectors();
        
        const currentState = computed(() => ({
            ids: store.ids(),
            entities: store.entities(),
            selectedTabId: store.selectedTabId()
        }));
        
        return {
            ids: computed(() => adapterSelectors.selectIds(currentState())),
            entities: computed(() => adapterSelectors.selectEntities(currentState())),
            allTabs: computed(() => adapterSelectors.selectAll(currentState())),
            total: computed(() => adapterSelectors.selectTotal(currentState())),
            selectedTabId: computed(() => store.selectedTabId()),
            selectedTab: computed(() => {
                const entities = store.entities();
                const selectedId = store.selectedTabId();
                return selectedId ? entities[selectedId] : null;
            }),
        };
    })
);
