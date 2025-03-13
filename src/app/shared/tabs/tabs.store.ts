import { signalStore, withState, withMethods, withComputed } from '@ngrx/signals';
import { patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { Tab } from './tabs.model';
import { 
    withEntities, 
    setAllEntities, 
    addEntity, 
    removeEntity, 
    updateEntity, 
    EntityState,
    EntityId,
    EntityMap
} from '@ngrx/signals/entities';

// Define the state interface
export interface TabState extends EntityState<Tab> {
    selectedTabId: string | null;
}

const initialState: TabState = {
    entityMap: {},
    ids: [],
    selectedTabId: null
};

// Create the signal store
export const TabsStore = signalStore(
    { providedIn: 'root' },
    withEntities<Tab>(),
    withState<TabState>(initialState),
    withMethods((store) => ({
        addTab(pageNumber: number) {
            const screenId = `Search ${pageNumber}`;
            const newTab: Tab = {
                id: screenId,
                screenId,
                label: screenId,
                icon: 'sample',
                active: true
            };

            // First, update all existing tabs to inactive
            store.entities().forEach((entity: Tab) => {
                patchState(
                    store,
                    updateEntity({ 
                        id: entity.id,
                        changes: { active: false }
                    })
                );
            });
            
            // Then add the new tab
            patchState(store, addEntity(newTab));
        },

        deleteTab(screenId: string) {
            const entities = store.entities();
            const deletedTabIndex = entities.findIndex((tab: Tab) => tab.screenId === screenId);
            const wasActive = entities[deletedTabIndex]?.active;
            const targetTab = entities[deletedTabIndex];
            if (!targetTab) return;
            
            // Remove the tab
            patchState(store, removeEntity(targetTab.id));

            if (wasActive && entities.length > 1) {
                // Update the active state of the next tab
                const newActiveIndex = deletedTabIndex === 0 ? 0 : deletedTabIndex - 1;
                const newActiveTab = entities[newActiveIndex];
                
                if (newActiveTab) {
                    patchState(
                        store,
                        updateEntity({ 
                            id: newActiveTab.id,
                            changes: { active: true }
                        })
                    );
                }
            }
        },

        deleteAll() {
            const entities = store.entities();
            if (entities.length === 0) return;

            // Keep only the first tab and make it active
            const firstTab = entities[0];
            
            // Remove all tabs except the first one
            entities.slice(1).forEach((entity: Tab) => {
                patchState(store, removeEntity(entity.id));
            });

            // Update the first tab to be active
            patchState(
                store,
                updateEntity({ 
                    id: firstTab.id,
                    changes: { active: true }
                })
            );
            
            // Update selected tab
            patchState(store, { selectedTabId: firstTab.screenId });
        },

        renameTab(screenId: string, newLabel: string) {
            const entity = store.entities().find((tab: Tab) => tab.screenId === screenId);
            if (!entity) return;

            patchState(
                store,
                updateEntity({ 
                    id: entity.id,
                    changes: { label: newLabel }
                })
            );
        },

        selectTab(screenId: string) {
            const entities = store.entities();
            const selectedTab = entities.find((tab: Tab) => tab.screenId === screenId);
            if (!selectedTab) return;

            // First, deactivate all tabs
            entities.forEach((entity: Tab) => {
                patchState(
                    store,
                    updateEntity({ 
                        id: entity.id,
                        changes: { active: false }
                    })
                );
            });

            // Then activate the selected tab
            patchState(
                store,
                updateEntity({ 
                    id: selectedTab.id,
                    changes: { active: true }
                })
            );

            // Update selected tab id
            patchState(store, { selectedTabId: selectedTab.screenId });
        },

        resetState() {
            patchState(store, setAllEntities<Tab>([]));
            patchState(store, { selectedTabId: null });
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
