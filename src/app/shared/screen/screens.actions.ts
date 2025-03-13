import { createAction } from "@ngrx/store";
import { ScreenDefs } from "./screens.actions.enum";

export const incrementPageAction = createAction(ScreenDefs.IncrementPageCount);
export const resetScreenStateAction = createAction(ScreenDefs.ResetScreenState);