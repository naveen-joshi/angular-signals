import {EntityAdapter, createEntityAdapter, EntityState} from '@ngrx/entity';
import { Tab } from './tabs.model';

export const tabAdapter: EntityAdapter<Tab> = createEntityAdapter<Tab>({
    selectId: (tab: Tab) => tab.screenId,
    sortComparer : false
});

export const {
    selectIds: selectTabIds,
    selectAll: selectAllTabs,
    selectTotal: selectTotalTabs,
    selectEntities: selectTabEntities
} = tabAdapter.getSelectors();