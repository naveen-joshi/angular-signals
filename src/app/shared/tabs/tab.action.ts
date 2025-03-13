import { createAction, props } from "@ngrx/store";
import { TabsDefs } from "./tab.action.enum";

export const addTabAction = createAction(
    TabsDefs.AddTab,
    props<{ pageNumber: number }>()
)

export const incrementPageAction = createAction(TabsDefs.IncrementPageCount);

export const deleteTabAction = createAction(
    TabsDefs.RemoveTab,
    props<{ screenId: string }>()
);

export const selectTabAction = createAction(
    TabsDefs.SelectTab,
    props<{ screenId: string }>()
);

export const resetTabStateAction = createAction(TabsDefs.ResetTabState);

export const updateComponentStateAction = createAction(
    TabsDefs.UpdateComponentState,
    props<{ screenId: string, componentState: Array<{[key: string]: any}> }>()
);