import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Grow from '@mui/material/Grow';
import { MRT_ExpandAllButton } from '../buttons/MRT_ExpandAllButton';
import { MRT_ExpandButton } from '../buttons/MRT_ExpandButton';
import { MRT_ToggleRowActionMenuButton } from '../buttons/MRT_ToggleRowActionMenuButton';
import { MRT_SelectCheckbox } from '../inputs/MRT_SelectCheckbox';
import { MRT_TablePaper } from './MRT_TablePaper';
import { MRT_EditRowModal } from '../body/MRT_EditRowModal';
import {
  prepareColumns,
  getAllLeafColumnDefs,
  getDefaultColumnOrderIds,
  getDefaultColumnFilterFn,
  showExpandColumn,
  getColumnId,
} from '../column.utils';
import {
  type MRT_Cell,
  type MRT_Column,
  type MRT_ColumnDef,
  type MRT_FilterOption,
  type MRT_Localization,
  type MRT_Row,
  type MRT_TableInstance,
  type MRT_TableState,
  type MaterialReactTableProps,
  type MRT_DensityState,
  type MRT_ColumnOrderState,
  type MRT_GroupingState,
  type MRT_FilterFnsState,
} from '../types';

export const MRT_TableRoot: any = <TData extends Record<string, any> = {}>(
  props: MaterialReactTableProps<TData> & { localization: MRT_Localization },
): JSX.Element => {
  const bottomToolbarRef = useRef<HTMLDivElement>(null);
  const editInputRefs = useRef<Record<string, HTMLInputElement>>({});
  const filterInputRefs = useRef<Record<string, HTMLInputElement>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableHeadCellRefs = useRef<Record<string, HTMLTableCellElement>>({});
  const tablePaperRef = useRef<HTMLDivElement>(null);
  const topToolbarRef = useRef<HTMLDivElement>(null);

  const initialState: Partial<MRT_TableState<TData>> = useMemo(() => {
    const initState = props.initialState ?? {};
    initState.columnOrder =
      initState.columnOrder ?? getDefaultColumnOrderIds(props);
    initState.globalFilterFn = props.globalFilterFn ?? 'fuzzy';
    return initState;
  }, []);

  const [columnFilterFns, setColumnFilterFns] = useState<MRT_FilterFnsState>(
    () =>
      Object.assign(
        {},
        ...getAllLeafColumnDefs(props.columns as MRT_ColumnDef<TData>[]).map(
          (col) => ({
            [getColumnId(col)]:
              col.filterFn instanceof Function
                ? col.filterFn.name ?? 'custom'
                : col.filterFn ??
                  initialState?.columnFilterFns?.[getColumnId(col)] ??
                  getDefaultColumnFilterFn(col),
          }),
        ),
      ),
  );
  const [columnOrder, setColumnOrder] = useState<MRT_ColumnOrderState>(
    initialState.columnOrder ?? [],
  );
  const [density, setDensity] = useState<MRT_DensityState>(
    initialState?.density ?? 'comfortable',
  );
  const [draggingColumn, setDraggingColumn] =
    useState<MRT_Column<TData> | null>(initialState.draggingColumn ?? null);
  const [draggingRow, setDraggingRow] = useState<MRT_Row<TData> | null>(
    initialState.draggingRow ?? null,
  );
  const [editingCell, setEditingCell] = useState<MRT_Cell<TData> | null>(
    initialState.editingCell ?? null,
  );
  const [editingRow, setEditingRow] = useState<MRT_Row<TData> | null>(
    initialState.editingRow ?? null,
  );
  const [globalFilterFn, setGlobalFilterFn] = useState<MRT_FilterOption>(
    initialState.globalFilterFn ?? 'fuzzy',
  );
  const [grouping, setGrouping] = useState<MRT_GroupingState>(
    initialState.grouping ?? [],
  );
  const [hoveredColumn, setHoveredColumn] = useState<
    MRT_Column<TData> | { id: string } | null
  >(initialState.hoveredColumn ?? null);
  const [hoveredRow, setHoveredRow] = useState<
    MRT_Row<TData> | { id: string } | null
  >(initialState.hoveredRow ?? null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(
    initialState?.isFullScreen ?? false,
  );
  const [showAlertBanner, setShowAlertBanner] = useState<boolean>(
    props.initialState?.showAlertBanner ?? false,
  );
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(
    initialState?.showColumnFilters ?? false,
  );
  const [showGlobalFilter, setShowGlobalFilter] = useState<boolean>(
    initialState?.showGlobalFilter ?? false,
  );
  const [showToolbarDropZone, setShowToolbarDropZone] = useState<boolean>(
    initialState?.showToolbarDropZone ?? false,
  );

  const displayColumns = useMemo(
    () =>
      (
        [
          (props.state?.columnOrder ?? columnOrder).includes(
            'mrt-row-drag',
          ) && {
            header: props.localization.move,
            size: 60,
            ...props.defaultDisplayColumn,
            ...props.displayColumnDefOptions?.['mrt-row-drag'],
            id: 'mrt-row-drag',
          },
          (props.state?.columnOrder ?? columnOrder).includes(
            'mrt-row-actions',
          ) && {
            Cell: ({ cell, row }) => (
              <MRT_ToggleRowActionMenuButton
                cell={cell as any}
                row={row as any}
                table={table as any}
              />
            ),
            header: props.localization.actions,
            size: 70,
            ...props.defaultDisplayColumn,
            ...props.displayColumnDefOptions?.['mrt-row-actions'],
            id: 'mrt-row-actions',
          },
          (props.state?.columnOrder ?? columnOrder).includes(
            'mrt-row-expand',
          ) &&
            showExpandColumn(props, props.state?.grouping ?? grouping) && {
              Cell: ({ row }) => (
                <MRT_ExpandButton row={row as any} table={table as any} />
              ),
              Header: props.enableExpandAll
                ? () => <MRT_ExpandAllButton table={table as any} />
                : null,
              header: props.localization.expand,
              size: 60,
              ...props.defaultDisplayColumn,
              ...props.displayColumnDefOptions?.['mrt-row-expand'],
              id: 'mrt-row-expand',
            },
          (props.state?.columnOrder ?? columnOrder).includes(
            'mrt-row-select',
          ) && {
            Cell: ({ row }) => (
              <MRT_SelectCheckbox row={row as any} table={table as any} />
            ),
            Header:
              props.enableSelectAll && props.enableMultiRowSelection
                ? () => <MRT_SelectCheckbox selectAll table={table as any} />
                : null,
            header: props.localization.select,
            size: 60,
            ...props.defaultDisplayColumn,
            ...props.displayColumnDefOptions?.['mrt-row-select'],
            id: 'mrt-row-select',
          },
          (props.state?.columnOrder ?? columnOrder).includes(
            'mrt-row-numbers',
          ) && {
            Cell: ({ row }) => row.index + 1,
            Header: () => props.localization.rowNumber,
            header: props.localization.rowNumbers,
            size: 60,
            ...props.defaultDisplayColumn,
            ...props.displayColumnDefOptions?.['mrt-row-numbers'],
            id: 'mrt-row-numbers',
          },
        ] as MRT_ColumnDef<TData>[]
      ).filter(Boolean),
    [
      columnOrder,
      grouping,
      props.displayColumnDefOptions,
      props.editingMode,
      props.enableColumnDragging,
      props.enableColumnFilterModes,
      props.enableColumnOrdering,
      props.enableEditing,
      props.enableExpandAll,
      props.enableExpanding,
      props.enableGrouping,
      props.enableRowActions,
      props.enableRowDragging,
      props.enableRowNumbers,
      props.enableRowOrdering,
      props.enableRowSelection,
      props.enableSelectAll,
      props.localization,
      props.positionActionsColumn,
      props.renderDetailPanel,
      props.renderRowActionMenuItems,
      props.renderRowActions,
      props.state?.columnOrder,
      props.state?.grouping,
    ],
  );

  const columnDefs = useMemo(
    () =>
      prepareColumns({
        aggregationFns: props.aggregationFns as any,
        columnDefs: [...displayColumns, ...props.columns],
        columnFilterFns: props.state?.columnFilterFns ?? columnFilterFns,
        defaultDisplayColumn: props.defaultDisplayColumn ?? {},
        filterFns: props.filterFns as any,
        sortingFns: props.sortingFns as any,
      }),
    [
      columnFilterFns,
      displayColumns,
      props.columns,
      props.state?.columnFilterFns,
    ],
  );

  const data: TData[] = useMemo(
    () =>
      (props.state?.isLoading || props.state?.showSkeletons) &&
      !props.data.length
        ? [
            ...Array(
              props.state?.pagination?.pageSize ||
                initialState?.pagination?.pageSize ||
                10,
            ).fill(null),
          ].map(() =>
            Object.assign(
              {},
              ...getAllLeafColumnDefs(props.columns as MRT_ColumnDef[]).map(
                (col) => ({
                  [getColumnId(col)]: null,
                }),
              ),
            ),
          )
        : props.data,
    [props.data, props.state?.isLoading, props.state?.showSkeletons],
  );

  //@ts-ignore
  const table = {
    ...useReactTable({
      getCoreRowModel: getCoreRowModel(),
      getExpandedRowModel:
        props.enableExpanding || props.enableGrouping
          ? getExpandedRowModel()
          : undefined,
      getFacetedMinMaxValues: props.enableFacetedValues
        ? getFacetedMinMaxValues()
        : undefined,
      getFacetedRowModel: props.enableFacetedValues
        ? getFacetedRowModel()
        : undefined,
      getFacetedUniqueValues: props.enableFacetedValues
        ? getFacetedUniqueValues()
        : undefined,
      getFilteredRowModel:
        props.enableColumnFilters ||
        props.enableGlobalFilter ||
        props.enableFilters
          ? getFilteredRowModel()
          : undefined,
      getGroupedRowModel: props.enableGrouping
        ? getGroupedRowModel()
        : undefined,
      getPaginationRowModel: props.enablePagination
        ? getPaginationRowModel()
        : undefined,
      getSortedRowModel: props.enableSorting ? getSortedRowModel() : undefined,
      onColumnOrderChange: setColumnOrder,
      onGroupingChange: setGrouping,
      getSubRows: (row) => row?.subRows,
      ...props,
      //@ts-ignore
      columns: columnDefs,
      data,
      globalFilterFn:
        props.filterFns?.[globalFilterFn] ?? props.filterFns?.fuzzy,
      initialState,
      state: {
        columnFilterFns,
        columnOrder,
        density,
        draggingColumn,
        draggingRow,
        editingCell,
        editingRow,
        globalFilterFn,
        grouping,
        hoveredColumn,
        hoveredRow,
        isFullScreen,
        showAlertBanner,
        showColumnFilters,
        showGlobalFilter,
        showToolbarDropZone,
        ...props.state,
      },
    }),
    refs: {
      bottomToolbarRef,
      editInputRefs,
      filterInputRefs,
      searchInputRef,
      tableContainerRef,
      tableHeadCellRefs,
      tablePaperRef,
      topToolbarRef,
    },
    setColumnFilterFns: props.onColumnFilterFnsChange ?? setColumnFilterFns,
    setDensity: props.onDensityChange ?? setDensity,
    setDraggingColumn: props.onDraggingColumnChange ?? setDraggingColumn,
    setDraggingRow: props.onDraggingRowChange ?? setDraggingRow,
    setEditingCell: props.onEditingCellChange ?? setEditingCell,
    setEditingRow: props.onEditingRowChange ?? setEditingRow,
    setGlobalFilterFn: props.onGlobalFilterFnChange ?? setGlobalFilterFn,
    setHoveredColumn: props.onHoveredColumnChange ?? setHoveredColumn,
    setHoveredRow: props.onHoveredRowChange ?? setHoveredRow,
    setIsFullScreen: props.onIsFullScreenChange ?? setIsFullScreen,
    setShowAlertBanner: props.onShowAlertBannerChange ?? setShowAlertBanner,
    setShowColumnFilters:
      props.onShowColumnFiltersChange ?? setShowColumnFilters,
    setShowGlobalFilter: props.onShowGlobalFilterChange ?? setShowGlobalFilter,
    setShowToolbarDropZone:
      props.onShowToolbarDropZoneChange ?? setShowToolbarDropZone,
  } as MRT_TableInstance<TData>;

  if (props.tableFeatures) {
    props.tableFeatures.forEach((feature) => {
      Object.assign(table, feature(table));
    });
  }

  if (props.tableInstanceRef) {
    props.tableInstanceRef.current = table;
  }

  const initialBodyHeight = useRef<string>();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initialBodyHeight.current = document.body.style.height;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (table.getState().isFullScreen) {
        document.body.style.height = '100vh';
      } else {
        document.body.style.height = initialBodyHeight.current as string;
      }
    }
  }, [table.getState().isFullScreen]);

  //if page index is out of bounds, set it to the last page
  useEffect(() => {
    const { pageIndex, pageSize } = table.getState().pagination;
    const totalRowCount =
      props.rowCount ?? table.getPrePaginationRowModel().rows.length;
    const firstVisibleRowIndex = pageIndex * pageSize;
    if (firstVisibleRowIndex > totalRowCount) {
      table.setPageIndex(Math.floor(totalRowCount / pageSize));
    }
  }, [props.rowCount, table.getPrePaginationRowModel().rows.length]);

  return (
    <>
      <Dialog
        PaperComponent={Box}
        TransitionComponent={!props.enableRowVirtualization ? Grow : undefined}
        disablePortal
        fullScreen
        keepMounted={false}
        onClose={() => table.setIsFullScreen(false)}
        open={table.getState().isFullScreen}
        transitionDuration={400}
      >
        <MRT_TablePaper table={table as any} />
      </Dialog>
      {!table.getState().isFullScreen && (
        <MRT_TablePaper table={table as any} />
      )}
      {editingRow && props.editingMode === 'modal' && (
        <MRT_EditRowModal row={editingRow as any} table={table} open />
      )}
    </>
  );
};
