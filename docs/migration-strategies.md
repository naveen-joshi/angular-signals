# Migration Strategies: From NgRx Store to Signal Store

## Overview

This guide provides a comprehensive strategy for migrating from NgRx Store to Signal Store, with a focus on maintaining functionality while reducing complexity.

## 1. Preparation Phase

### 1.1 Audit Current Implementation
```typescript
// Example NgRx Store structure to analyze
├── store/
│   ├── actions/
│   │   ├── item.actions.ts
│   │   └── collection.actions.ts
│   ├── reducers/
│   │   ├── item.reducer.ts
│   │   └── collection.reducer.ts
│   ├── effects/
│   │   ├── item.effects.ts
│   │   └── collection.effects.ts
│   └── selectors/
│       ├── item.selectors.ts
│       └── collection.selectors.ts
```

### 1.2 Identify Dependencies
1. List all components using `@select` decorators
2. Document all effects and their side effects
3. Map out all action-reducer relationships
4. Identify computed selectors and their dependencies

## 2. Incremental Migration Strategy

### 2.1 Create Signal Store Alongside NgRx

```typescript
// Keep existing NgRx Store
export class ItemEffects {
  loadItems$ = createEffect(() => /* existing implementation */);
}

// Add Signal Store
export const ItemStore = signalStore(
  { providedIn: 'root' },
  withEntities<Item>(),
  withState<ItemState>(initialState),
  withMethods((store) => ({
    loadItems() {
      // New implementation
    }
  }))
);
```

### 2.2 Migrate State Structure

```typescript
// Before (NgRx)
interface ItemState extends EntityState<Item> {
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

// After (Signal Store)
interface ItemState {
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

const ItemStore = signalStore(
  { providedIn: 'root' },
  withEntities<Item>(),
  withState<ItemState>(initialState)
);
```

### 2.3 Convert Actions to Methods

```typescript
// Before (NgRx)
export const loadItems = createAction('[Item] Load');
export const loadItemsSuccess = createAction(
  '[Item] Load Success',
  props<{ items: Item[] }>()
);

// After (Signal Store)
withMethods((store) => ({
  loadItems() {
    patchState(store, { loading: true });
    this.itemService.getItems().subscribe({
      next: (items) => {
        patchState(store, (state) => ({
          ...state,
          loading: false,
          entityMap: items.reduce((acc, item) => ({
            ...acc,
            [item.id]: item
          }), {})
        }));
      },
      error: (error) => {
        patchState(store, { 
          loading: false,
          error: error.message 
        });
      }
    });
  }
}));
```

### 2.4 Convert Selectors to Computed Signals

```typescript
// Before (NgRx)
export const selectItems = createSelector(
  selectItemState,
  (state) => selectAll(state)
);

export const selectActiveItems = createSelector(
  selectItems,
  (items) => items.filter(item => item.active)
);

// After (Signal Store)
withComputed((store) => ({
  items: computed(() => store.entities()),
  activeItems: computed(() => 
    store.entities().filter(item => item.active)
  )
}));
```

## 3. Component Migration

### 3.1 Update Component Dependencies

```typescript
// Before (NgRx)
@Component({
  template: `
    <div *ngFor="let item of items$ | async">
      {{ item.name }}
    </div>
  `
})
export class ItemListComponent {
  items$ = this.store.select(selectItems);
  
  constructor(private store: Store) {
    this.store.dispatch(loadItems());
  }
}

// After (Signal Store)
@Component({
  template: `
    <div *ngFor="let item of itemStore.items()">
      {{ item.name }}
    </div>
  `
})
export class ItemListComponent {
  constructor(public itemStore: ItemStore) {
    this.itemStore.loadItems();
  }
}
```

### 3.2 Handle Side Effects

```typescript
// Before (NgRx with Effects)
@Injectable()
export class ItemEffects {
  saveItem$ = createEffect(() => 
    this.actions$.pipe(
      ofType(saveItem),
      mergeMap(action => 
        this.itemService.save(action.item).pipe(
          map(item => saveItemSuccess({ item })),
          catchError(error => of(saveItemFailure({ error })))
        )
      )
    )
  );
}

// After (Signal Store)
withMethods((store) => ({
  saveItem(item: Item) {
    patchState(store, { saving: true });
    this.itemService.save(item).subscribe({
      next: (savedItem) => {
        patchState(store, (state) => ({
          ...state,
          saving: false,
          entityMap: {
            ...state.entityMap,
            [savedItem.id]: savedItem
          }
        }));
      },
      error: (error) => {
        patchState(store, { 
          saving: false,
          error: error.message 
        });
      }
    });
  }
}));
```

## 4. Testing Strategy

### 4.1 Migrate Tests

```typescript
// Before (NgRx Tests)
describe('ItemEffects', () => {
  it('should load items', () => {
    actions$ = hot('-a', { a: loadItems() });
    const response = cold('-a|', { a: mockItems });
    itemService.getItems.and.returnValue(response);

    const expected = cold('--b', {
      b: loadItemsSuccess({ items: mockItems })
    });

    expect(effects.loadItems$).toBeObservable(expected);
  });
});

// After (Signal Store Tests)
describe('ItemStore', () => {
  it('should load items', fakeAsync(() => {
    itemService.getItems.and.returnValue(of(mockItems));
    
    itemStore.loadItems();
    tick();

    expect(itemStore.entities()).toEqual(mockItems);
    expect(itemStore.loading()).toBeFalse();
  }));
});
```

## 5. Migration Checklist

### 5.1 Pre-Migration
- [ ] Audit existing NgRx implementation
- [ ] Document all state management patterns
- [ ] Create test coverage baseline
- [ ] Plan migration phases

### 5.2 During Migration
- [ ] Implement Signal Store alongside NgRx
- [ ] Convert actions to methods incrementally
- [ ] Update components one at a time
- [ ] Maintain test coverage
- [ ] Document breaking changes

### 5.3 Post-Migration
- [ ] Remove NgRx dependencies
- [ ] Update documentation
- [ ] Verify all features work as expected
- [ ] Performance testing
- [ ] Update build configuration

## 6. Best Practices

1. **Gradual Migration**
   - Migrate one feature at a time
   - Keep both implementations running in parallel
   - Validate each migration step

2. **State Management**
   - Use `patchState` for atomic updates
   - Implement computed properties for derived state
   - Maintain immutability patterns

3. **Testing**
   - Maintain test coverage during migration
   - Update test patterns for Signal Store
   - Test both implementations during transition

4. **Performance**
   - Monitor bundle size changes
   - Check memory usage
   - Verify change detection behavior

5. **Documentation**
   - Update API documentation
   - Document migration decisions
   - Maintain changelog

## 7. Common Challenges and Solutions

### 7.1 Complex Effects
Challenge: Managing complex effect chains in Signal Store
Solution: Break down effects into smaller, manageable methods

```typescript
// Before (NgRx Effect)
@Injectable()
export class ItemEffects {
  complexOperation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(startOperation),
      mergeMap(() => this.step1()),
      mergeMap(() => this.step2()),
      mergeMap(() => this.step3())
    )
  );
}

// After (Signal Store)
withMethods((store) => ({
  async complexOperation() {
    try {
      await this.step1();
      await this.step2();
      await this.step3();
    } catch (error) {
      this.handleError(error);
    }
  }
}));
```

### 7.2 State Derivation
Challenge: Replacing complex selectors
Solution: Use computed signals with proper dependency tracking

```typescript
// Before (NgRx Selectors)
export const selectComplexData = createSelector(
  selectItems,
  selectFilters,
  selectSort,
  (items, filters, sort) => {
    // Complex computation
  }
);

// After (Signal Store)
withComputed((store) => ({
  complexData: computed(() => {
    const items = store.entities();
    const filters = store.filters();
    const sort = store.sort();
    // Complex computation
  })
}));
```

## 8. Rollback Strategy

1. **Version Control**
   - Maintain clear commit history
   - Use feature branches
   - Tag important migration points

2. **Feature Flags**
   - Implement toggles for new implementation
   - Keep old implementation as fallback
   - Control migration through configuration

3. **State Backup**
   - Implement state serialization
   - Maintain state recovery mechanisms
   - Test rollback procedures
