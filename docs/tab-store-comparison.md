# Tab Store Implementation Comparison: NgRx Store vs Signal Store

## NgRx Store Implementation

```typescript
// tab.actions.ts
import { createAction, props } from '@ngrx/store';
import { Tab } from './tab.model';

export const addTab = createAction(
  '[Tab] Add Tab',
  props<{ pageNumber: number }>()
);

export const deleteTab = createAction(
  '[Tab] Delete Tab',
  props<{ screenId: string }>()
);

export const deleteAllTabs = createAction('[Tab] Delete All Tabs');

export const renameTab = createAction(
  '[Tab] Rename Tab',
  props<{ screenId: string; newLabel: string }>()
);

export const selectTab = createAction(
  '[Tab] Select Tab',
  props<{ screenId: string }>()
);

export const resetTabs = createAction('[Tab] Reset Tabs');

// tab.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import * as TabActions from './tab.actions';
import { Tab } from './tab.model';

export interface TabState extends EntityState<Tab> {
  selectedTabId: string | null;
}

export const adapter: EntityAdapter<Tab> = createEntityAdapter<Tab>({
  selectId: (tab: Tab) => tab.screenId,
  sortComparer: false
});

export const initialState: TabState = adapter.getInitialState({
  selectedTabId: null
});

export const tabReducer = createReducer(
  initialState,
  on(TabActions.addTab, (state, { pageNumber }) => {
    const newTab: Tab = {
      screenId: 'Search ' + pageNumber,
      label: 'Search ' + pageNumber,
      icon: 'sample',
      active: true
    };

    const updates = state.ids.map(id => ({
      id,
      changes: { active: false }
    }));

    const updatedState = adapter.updateMany(updates, state);
    return adapter.addOne(newTab, updatedState);
  }),
  on(TabActions.deleteTab, (state, { screenId }) => {
    const deletedTabIndex = state.ids.indexOf(screenId);
    const wasActive = state.entities[screenId]?.active;
    
    const newState = adapter.removeOne(screenId, state);
    
    if (wasActive) {
      const updates = newState.ids.map((id, index) => ({
        id,
        changes: {
          active: deletedTabIndex === 0 ? index === 0 : index === deletedTabIndex - 1
        }
      }));
      return adapter.updateMany(updates, newState);
    }
    return newState;
  }),
  on(TabActions.deleteAllTabs, (state) => {
    if (state.ids.length === 0) return state;
    
    const firstTabId = state.ids[0];
    const firstTab = state.entities[firstTabId];
    
    return adapter.setAll(
      [{ ...firstTab, active: true }],
      { ...state, selectedTabId: firstTabId }
    );
  }),
  on(TabActions.renameTab, (state, { screenId, newLabel }) => {
    return adapter.updateOne({
      id: screenId,
      changes: { label: newLabel }
    }, state);
  }),
  on(TabActions.selectTab, (state, { screenId }) => {
    const updates = state.ids.map(id => ({
      id,
      changes: { active: id === screenId }
    }));

    return adapter.updateMany(updates, {
      ...state,
      selectedTabId: screenId
    });
  }),
  on(TabActions.resetTabs, () => initialState)
);

// tab.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TabState, adapter } from './tab.reducer';

export const selectTabState = createFeatureSelector<TabState>('tab');
export const { selectAll, selectEntities, selectTotal } = adapter.getSelectors();

export const selectAllTabs = createSelector(
  selectTabState,
  selectAll
);

export const selectTabEntities = createSelector(
  selectTabState,
  selectEntities
);

export const selectTabTotal = createSelector(
  selectTabState,
  selectTotal
);

export const selectSelectedTabId = createSelector(
  selectTabState,
  (state: TabState) => state.selectedTabId
);

export const selectSelectedTab = createSelector(
  selectTabEntities,
  selectSelectedTabId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);
```

## Signal Store Implementation

```typescript
// tab.store.ts
import { signalStore, withState, withMethods, withComputed } from '@ngrx/signals';
import { patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { Tab } from './tab.model';
import { withEntities } from '@ngrx/signals/entities';

interface TabState {
  selectedTabId: string | null;
}

const initialState: TabState = {
  selectedTabId: null
};

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
```

## Key Differences

1. **Code Organization**:
   - NgRx Store: Requires separate files for actions, reducer, and selectors
   - Signal Store: All functionality is contained in a single file

2. **State Updates**:
   - NgRx Store: Uses actions and reducers with the entity adapter
   - Signal Store: Uses direct methods with `patchState` and entity operations

3. **Entity Management**:
   - NgRx Store: Uses `@ngrx/entity` adapter with `updateMany`, `addOne`, etc.
   - Signal Store: Uses `@ngrx/signals/entities` with direct entity manipulation

4. **Method Implementation**:
   - NgRx Store: Actions must be dispatched and handled by reducers
   - Signal Store: Methods directly update state using `patchState`

5. **Computed Values**:
   - NgRx Store: Uses selectors with `createSelector`
   - Signal Store: Uses `computed` signals with direct store access

6. **Advantages of Signal Store**:
   - Less boilerplate code
   - More straightforward debugging
   - Better TypeScript integration
   - Fine-grained reactivity
   - Simpler testing

7. **Advantages of NgRx Store**:
   - Better for large applications
   - Built-in dev tools
   - Time-travel debugging
   - Middleware support
   - Better for complex state management
