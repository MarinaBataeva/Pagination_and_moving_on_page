import { LegacyRef, useContext, useRef } from "react";
import classNames from "classnames";
import { PropsWithChildren, useEffect, useState } from "react";
import styles from "./defaultGrid.module.scss"
import { AppContext } from "../../../system/providers/appContextProvider";
import { UserContext } from "../../../system/providers/userContextProvider";
import { } from '../../../Services/Extensions/Boolean'
import { } from '../../../Services/Extensions/DateTime'
import { LoadingStatus } from "../../../@types/enumsGlobal";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from 'uuid'
import { Spinner } from "../../spiner/Spinner";

import { TabsContext } from "../../../system/providers/tabsProvider";
import GridPaginator from "./gridPaginator";

interface IGridCellWithWidth extends IGridCell {
    width: number
}
export interface actionGridRow {
    delete?: () => void
}
function compareByOrder(a: IComparer, b: IComparer) {
    if (a.order === undefined || b.order === undefined)
        return 0;

    if (a.order < b.order)
        return -1;

    if (a.order > b.order)
        return 1;

    return 0;
}

interface IMousePosition {
    x: number
    y: number
}

interface IDefaultGridProps<TViewDTO> {
    gridId: string,
    plugin: IPluginSettings,
    data: TViewDTO[],
    filter: IGridFilter,
    totalCount: number,
    actionGridRow?: actionGridRow
    multipleSelect?: boolean,
    selectedItem?: IGridRow,
    selectedItems?: IGridRow[],
    documentStatus?: boolean
    hiddenPagination?: { hiddenCountRow: boolean | undefined; hiddenNumberPage: boolean | undefined }
    autoSelect?: boolean
    numbering?: boolean,
    dontSelectFirstElem?: boolean
    contextMunuItems?: IContextMenuItem[],
    loadingData?: LoadingStatus,
    dataProvider?: any,
    setLoadingData?: (value: LoadingStatus) => void
    onSelect?: (row: IGridRow | undefined) => void,
    onDoubleClick?: (row: IGridRow) => void,
    onEnter?: (row: IGridRow) => void,
    onMultipleSelect?: (rows: IGridRow[]) => void,

    onSort: (column: IGridColumn) => void,
    onFilterDelete: (column: IGridColumn) => void,
    onPageNumberChange: (pageNumber: number) => void,
    onNumberPerPageChange: (numberPerPage: number) => void,
    onGridRowContextMenuMouseClick?: (selectedRow: IGridRow, position: IMousePosition) => JSX.Element,
}

export const DefaultGrid = <TViewDTO,>(props: PropsWithChildren<IDefaultGridProps<TViewDTO>>) => {
    const appCtx = useContext(AppContext)
    const userCtx = useContext(UserContext)
    let gridRef = useRef<HTMLTableSectionElement>(null)

    const [typeChecked, setTypeChecked] = useState<string>('emptyField');

    const [pluginSettings, setPluginSettings] = useState<IPluginSettings>(props.plugin);

    const [data, setData] = useState<TViewDTO[]>(props?.data?.map(x => ({ ...x, idRow: uuidv4() })));
    const [selectedItem, setSelectedItem] = useState<IGridRow>();
    const { t } = useTranslation();
    const [viewState, setViewState] = useState<GridStateType>("view")
    let tableRef = useRef<HTMLDivElement>();
    
    const [pageNumber,setPageNumber] = useState<number>(props.filter.pageNumber)


    let dataPaginator = getRows();
    useEffect(() => {
        setData(props?.data?.map(x => ({ ...x, idRow: uuidv4() })))
    }, [props.data])

    useEffect(() => {
        if (!props.dontSelectFirstElem) {
            setSelectedItem(getRows()[0]);
            props.onSelect?.(getRows()[0])
        }
    }, [data, props.filter.pageNumber])


    useEffect(() => {
        const selectedRows = getRows().filter(x => x.isSelected)
        const rowsLength = getRows().length

        if (selectedRows.length === rowsLength)
            setTypeChecked('allChecked')

        else if (selectedRows.length === 0)
            setTypeChecked('emptyField')

        else if (selectedRows.length < rowsLength)
            setTypeChecked('indeterminate')

    }, [getRows()])

    //Create array of rows and pushing data
    function getRows(): IGridRow[] {
        let rows: IGridRow[] = [];
        if (props.data) {
            data.forEach((i) => {
                props?.multipleSelect
                    ? rows.push({
                        idGoodsGlobal: i["idGoodsGlobal"] as string,
                        idGlobal: i["idGlobal"] as string,
                        idRow: i['idRow'] as string,
                        displayName: i["displayName"] as string,
                        isDeleted: i["deleted"] as boolean,
                        isSelected: props?.selectedItems?.find(x => x.idRow === i["idRow"]) === undefined ? false : true,
                    })
                    : rows.push({
                        idGoodsGlobal: i["idGoodsGlobal"] as string,
                        idGlobal: i["idGlobal"] as string,
                        idRow: i['idRow'] as string,
                        displayName: i["displayName"] || i["name"] as string,
                        isDeleted: i["deleted"] as boolean,
                        isSelected: i["idRow"] === selectedItem?.idRow ? true : false
                    })
            })
        }
        return rows
    }

    const render = () => {
        if (props.loadingData === LoadingStatus.InProcess) {
            return <Spinner />
        } else if (props.loadingData === LoadingStatus.NoAccess) {
            return <div className={styles.noDataInfo}>
                <span >Нет доступа</span>
            </div>
        } else if (props.loadingData === LoadingStatus.NoData) {
            return (
                <div className={styles.noDataInfo}>
                    <span>{t('general.noData')}</span>
                </div>
            )
        } else {
            return <div className={styles.gridWrapper}>
                <div   
                //Scroll's loading new data     
                className={styles.gridWrapper__tables}
                ref = {tableRef as LegacyRef<HTMLDivElement>}    
                 onScroll={(e) => {
                    if(!props.hiddenPagination?.hiddenNumberPage){
                    if (tableRef.current?.scrollHeight && (pageNumber < Math.ceil(props.totalCount / props.filter.numberPerPage)) 
                    && (e.currentTarget.scrollHeight - e.currentTarget.scrollTop - 30 == e.currentTarget.clientHeight - 30)) 
                    {
                        setPageNumber(pageNumber + 1)
                        props?.dataProvider?.getView({ ...props.filter, pageNumber: pageNumber + 1}, (newRows: TViewDTO[]) => {
                            
                            if (pageNumber <= Math.ceil(props.totalCount / props.filter.numberPerPage)){
                                setData([...data, ...newRows.map(x => ({ ...x, idRow: uuidv4() }))])
                            
                            }
                        })
                    }
                }
                    }
                }
                >
                    <table
                        id={props.gridId}
                        className={styles.gridTable} >
                        <tbody className={styles.gridRowsGroup} ref={gridRef}>
                            {
                                getRows().map((item, index) => {
                                    const cells = item.cells
                                    let orderedCells: IGridCellWithWidth[] = [];
                                    for (let i = 0; i < cells.length; i++) {
                                        orderedCells.push({
                                            ...cells[i],
                                            order: pluginSettings.columns.find((item) => item.propertyName === cells[i].propertyName)?.order as number,
                                            width: pluginSettings.columns.find((item) => item.propertyName === cells[i].propertyName)?.width as number
                                        });
                                    }
                                    orderedCells = orderedCells.sort(compareByOrder)

                                    return (
                                        <tr
                                            key={`key-${index}`}
                                            tabIndex={-1}
                                            data-item-id={item.idGlobal}
                                            className={classNames(styles.gridRow, item.isSelected ? styles.gridRowSelected : null, item.isDeleted ? styles.gridRowDeleted : null,
                                                item.cells.length >= 11 ? item.cells[11].propertyName === 'idDefecturaStopListGlobal'? item.cells[11].value === null ?  null : styles.gridRowDeleted : null : null
                                             )}
                                            onClick={() => {
                                                if (props?.multipleSelect) {
                                                    if (props?.selectedItems?.length === 0) {
                                                        props.onMultipleSelect?.([item])
                                                    }
                                                    if (props?.selectedItems) {
                                                        props?.selectedItems?.find(x => x.idGlobal === item.idGlobal) === undefined &&
                                                            props.onMultipleSelect?.([...props.selectedItems, item])
                                                    }
                                                    if (item.isSelected && props?.selectedItems) {
                                                        const newSelecterArray = props?.selectedItems?.filter(x => x.idGlobal !== item.idGlobal)
                                                        props.onMultipleSelect?.([...newSelecterArray])
                                                    }
                                                } else {
                                                    if (item.isSelected) {
                                                        setSelectedItem(undefined)
                                                        props.onMultipleSelect?.([])
                                                        props.onSelect?.(undefined)
                                                    } else {
                                                        setSelectedItem(item)
                                                        props.onSelect?.(item)
                                                        props.onMultipleSelect?.([item])
                                                    }
                                                }
                                            }}
                                            // Move selected item 
                                            onKeyDown={(eKeyPress) => {
                                                switch (eKeyPress.key) {
                                                    case "ArrowDown":
                                                        let lastRow
                                                        for (let i = 0; i < dataPaginator.length; i++) {
                                                            if (dataPaginator[i].idGlobal === selectedItem?.idGlobal) {
                                                                if (i + 1 < dataPaginator.length) {
                                                                    setSelectedItem(dataPaginator[i + 1])
                                                                    props.onSelect?.(dataPaginator[i + 1])
                                                                }

                                                                else
                                                                    lastRow = i + 1
                                                            }
                                                        }
                                                        if(!props.hiddenPagination){
                                                            if (lastRow == dataPaginator.length && props.totalCount / props.filter.numberPerPage > props.filter.pageNumber) {
                                                            props.filter.pageNumber++
                                                            props.onPageNumberChange(props.filter.pageNumber)
                                                        }
                                                    }
                                                        let nextElement = eKeyPress.currentTarget.nextElementSibling as HTMLElement
                                                        if (nextElement != null)
                                                            nextElement.focus();
                                                        break;

                                                    case "ArrowUp":
                                                        let firstRow
                                                        for (let i = data.length - 1; i >= 0; i--) {
                                                            if (dataPaginator[i].idGlobal === selectedItem?.idGlobal) {
                                                                if (i - 1 >= 0) {
                                                                    setSelectedItem(dataPaginator[i - 1])
                                                                    props.onSelect?.(dataPaginator[i - 1])
                                                                }
                                                                else
                                                                    firstRow = i - 1
                                                            }
                                                        }
                                                        if (firstRow == -1 && props.filter.pageNumber != 1) {
                                                            props.filter.pageNumber--
                                                            props.onPageNumberChange(props.filter.pageNumber)
                                                        }
                                                        break;

                                                    case "ArrowRight":
                                                        if (props.totalCount / props.filter.numberPerPage > props.filter.pageNumber && props.hiddenPagination?.hiddenNumberPage) {
                                                            props.filter.pageNumber++
                                                            props.onPageNumberChange(props.filter.pageNumber)
                                                        }
                                                        break;

                                                    case "ArrowLeft":
                                                        if (props.filter.pageNumber > 1 && props.hiddenPagination?.hiddenNumberPage) {
                                                            props.filter.pageNumber--
                                                            props.onPageNumberChange(props.filter.pageNumber)
                                                        }
                                                        break;

                                                    case "Enter":
                                                        setViewState("edit")
                                                        if (props.onEnter) {
                                                            selectedItem && item && props.onEnter(item)
                                                        }
                                                        break;
                                                    case "Delete":
                                                        props.actionGridRow?.delete?.()
                                                        break;
                                                    default:
                                                        break;
                                                }

                                            }}
                                            onDoubleClick={() => {
                                                !props.multipleSelect && props.onDoubleClick?.(item)
                                            }}
                                        ></tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>
                </div>

                {
                    // Pagination
                    props.hiddenPagination &&
                    <GridPaginator
                        nearPage={2}
                        pageNumber={props.filter.pageNumber}
                        totalCount={props.totalCount}
                        numberPerPage={props.filter.numberPerPage}
                        onPageNumberChange={props.onPageNumberChange}
                        onNumberPerPageChange={props.onNumberPerPageChange}
                        hiddenNumberPage={props.hiddenPagination?.['hiddenNumberPage']}
                        hiddenCountRow={props.hiddenPagination?.['hiddenCountRow']}
                    />
                }
            </div >
        }
    }
    return (
        render()
    )
}