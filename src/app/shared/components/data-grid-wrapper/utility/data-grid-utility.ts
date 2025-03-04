import { Injectable } from "@angular/core";
import { DataGridColumnDefinitions } from "../models/data-grid-column-definitions.model";
import { CellClassRules, ColDef, ValueFormatterParams } from "ag-grid-community";

@Injectable()
export class DataGridUtility<TData> {
    transformColumnDefinitions(columnDefinitions: Array<DataGridColumnDefinitions<TData>>): Array<ColDef> {
        if(!columnDefinitions) return [];

        return columnDefinitions.map((columnDefinition) => {
            return {
                id: columnDefinition.columnIdentifier,
                field: columnDefinition.field,
                headerName: columnDefinition.headerName,
                width: columnDefinition.width,
                flex: columnDefinition.width ? undefined : 1,
                hide: !(columnDefinition.isVisible ?? true),
                sortable: columnDefinition.sortable,
                editable: columnDefinition.editable,
                resizable: columnDefinition.resizable,
                cellClass: columnDefinition.cellClass,
                cellClassRules: columnDefinition.conditionalCss ? this.#convertToCellClassRules(columnDefinition.conditionalCss) : undefined,
                valueFormatter: columnDefinition.cellValueFormatter ? (value: ValueFormatterParams) => columnDefinition.cellValueFormatter(value.value) : undefined,
            }
        });
    }

    #convertToCellClassRules(classesMap: Map<string, (value: TData, selected: boolean) => boolean>): CellClassRules {
        let cellClassRules: CellClassRules = {};
        classesMap.forEach((value, key) => {
            cellClassRules[key] = (params: ValueFormatterParams) => value(params.value, params.node!.isSelected());
        });
        return cellClassRules;
    }
}