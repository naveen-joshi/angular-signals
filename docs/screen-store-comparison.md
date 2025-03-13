# Screen Store Implementation Comparison: NgRx Store vs Signal Store

## NgRx Store Implementation

```typescript
// screen.actions.ts
import { createAction, props } from '@ngrx/store';
import { Screen } from './screen.model';

export const loadScreens = createAction('[Screen] Load Screens');
export const loadScreensSuccess = createAction(
  '[Screen] Load Screens Success',
  props<{ screens: Screen[] }>()
);
export const addScreen = createAction(
  '[Screen] Add Screen',
  props<{ screen: Screen }>()
);
export const updateScreen = createAction(
  '[Screen] Update Screen',
  props<{ id: string; changes: Partial<Screen> }>()
);
export const deleteScreen = createAction(
  '[Screen] Delete Screen',
  props<{ id: string }>()
);

// screen.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import * as ScreenActions from './screen.actions';
import { Screen } from './screen.model';

export interface ScreenState extends EntityState<Screen> {
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

export const adapter: EntityAdapter<Screen> = createEntityAdapter<Screen>({
  selectId: (screen: Screen) => screen.id
});

export const initialState: ScreenState = adapter.getInitialState({
  selectedId: null,
  loading: false,
  error: null
});

export const screenReducer = createReducer(
  initialState,
  on(ScreenActions.loadScreens, (state) => ({
    ...state,
    loading: true
  })),
  on(ScreenActions.loadScreensSuccess, (state, { screens }) =>
    adapter.setAll(screens, { ...state, loading: false })
  ),
  on(ScreenActions.addScreen, (state, { screen }) =>
    adapter.addOne(screen, state)
  ),
  on(ScreenActions.updateScreen, (state, { id, changes }) =>
    adapter.updateOne({ id, changes }, state)
  ),
  on(ScreenActions.deleteScreen, (state, { id }) =>
    adapter.removeOne(id, state)
  )
);

// screen.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ScreenState, adapter } from './screen.reducer';

export const selectScreenState = createFeatureSelector<ScreenState>('screen');
export const { selectAll, selectEntities } = adapter.getSelectors();

export const selectAllScreens = createSelector(
  selectScreenState,
  selectAll
);

export const selectScreenEntities = createSelector(
  selectScreenState,
  selectEntities
);

export const selectSelectedScreenId = createSelector(
  selectScreenState,
  (state: ScreenState) => state.selectedId
);

export const selectSelectedScreen = createSelector(
  selectScreenEntities,
  selectSelectedScreenId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

// screen.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, mergeMap, catchError } from 'rxjs/operators';
import * as ScreenActions from './screen.actions';
import { ScreenService } from './screen.service';

@Injectable()
export class ScreenEffects {
  loadScreens$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScreenActions.loadScreens),
      mergeMap(() => this.screenService.getScreens()
        .pipe(
          map(screens => ScreenActions.loadScreensSuccess({ screens })),
          catchError(error => of(ScreenActions.loadScreensFailure({ error })))
        ))
    )
  );

  constructor(
    private actions$: Actions,
    private screenService: ScreenService
  ) {}
}
```

## Signal Store Implementation

```typescript
// screen.store.ts
import { signalStore, withState, withMethods, withComputed } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { Screen } from './screen.model';

interface ScreenState {
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ScreenState = {
  selectedId: null,
  loading: false,
  error: null
};

export const ScreenStore = signalStore(
  { providedIn: 'root' },
  withEntities<Screen>(),
  withState<ScreenState>(initialState),
  withMethods((store) => ({
    loadScreens() {
      patchState(store, { loading: true });
      
      this.screenService.getScreens().subscribe({
        next: (screens) => {
          patchState(store, (state) => ({
            ...state,
            entityMap: screens.reduce((acc, screen) => ({
              ...acc,
              [screen.id]: screen
            }), {}),
            ids: screens.map(screen => screen.id),
            loading: false
          }));
        },
        error: (error) => {
          patchState(store, { loading: false, error: error.message });
        }
      });
    },

    addScreen(screen: Screen) {
      patchState(store, (state) => ({
        ...state,
        entityMap: {
          ...state.entityMap,
          [screen.id]: screen
        },
        ids: [...state.ids, screen.id]
      }));
    },

    updateScreen(id: string, changes: Partial<Screen>) {
      const screen = store.entities().find(s => s.id === id);
      if (!screen) return;

      patchState(store, (state) => ({
        ...state,
        entityMap: {
          ...state.entityMap,
          [id]: { ...screen, ...changes }
        }
      }));
    },

    deleteScreen(id: string) {
      patchState(store, (state) => ({
        ...state,
        entityMap: Object.fromEntries(
          Object.entries(state.entityMap).filter(([key]) => key !== id)
        ),
        ids: state.ids.filter(screenId => screenId !== id)
      }));
    }
  })),
  withComputed((store) => ({
    allScreens: computed(() => store.entities()),
    selectedScreen: computed(() => 
      store.entities().find(screen => screen.id === store.selectedId())
    ),
    isLoading: computed(() => store.loading()),
    error: computed(() => store.error())
  }))
);
```

## Key Differences

1. **Architecture**:
   - NgRx Store: Uses a more complex architecture with separate files for actions, reducers, selectors, and effects
   - Signal Store: All store logic is centralized in a single file with a more straightforward API

2. **State Updates**:
   - NgRx Store: Uses actions and reducers for state updates, requiring action creators and reducer functions
   - Signal Store: Uses direct methods with `patchState` for simpler state updates

3. **Entity Management**:
   - NgRx Store: Uses `@ngrx/entity` adapter with complex entity operations
   - Signal Store: Uses `@ngrx/signals/entities` with simpler entity operations

4. **Side Effects**:
   - NgRx Store: Requires separate Effects class for handling side effects
   - Signal Store: Side effects can be handled directly in store methods

5. **Performance**:
   - NgRx Store: More overhead due to action dispatching and reducer processing
   - Signal Store: More efficient with direct state updates and fine-grained reactivity

6. **Development Experience**:
   - NgRx Store: More boilerplate code but better for large applications with complex state
   - Signal Store: Less boilerplate, easier to understand and maintain for smaller to medium applications
