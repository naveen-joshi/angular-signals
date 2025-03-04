export interface DataGridColumnDefinitions<TData> {
    columnIdentifier?: string;
    headerName: string;
    field: string;
    isVisible?: boolean;
    width?: number;
    sortable?: boolean;
    editable?: boolean;
    resizable?: boolean;
    cellClass?: Array<string> | string;
    conditionalCss?: Map<string, (value: TData, selected: boolean) => boolean>;
    cellValueFormatter?: (value: TData) => string;
}