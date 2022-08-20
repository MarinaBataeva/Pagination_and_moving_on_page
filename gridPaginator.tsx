import { LeftIcon, RightIcon } from "../../libs/corporate/icons/outlined/directions/ChevronCollection";
import { FC } from "react"
import { Select } from "../selects/select"

interface IGridPaginatorProps {
    pageNumber: number,
    numberPerPage: number,
    totalCount: number,
    nearPage: number
    onPageNumberChange: (pageNumber: number) => void
    onNumberPerPageChange: (numberPerPage: number) => void
    hiddenCountRow?: boolean
    hiddenNumberPage?: boolean

}
// Algorithm of pagination
const GridPaginator: FC<IGridPaginatorProps> = (props) => {
    let pages: number[] = [];
    let totalPages = Math.ceil(props.totalCount / props.numberPerPage)

    if (props.pageNumber == 1) {
        if (totalPages != 1) {
            pages.push(props.pageNumber)
            for (let i = 1; i <= props.nearPage; i++) {
                if (props.pageNumber + i < totalPages)
                    pages.push(props.pageNumber + i)
            }
            if (props.pageNumber + props.nearPage < totalPages - 1) {
                pages.push(0)
            }
            pages.push(totalPages)
        }
        else {
            pages.push(totalPages)
        }
    }
    else if (props.pageNumber == totalPages) {
        pages.push(1)
        if (props.pageNumber - props.nearPage > 2) {
            pages.push(0)
        }
        for (let i = props.nearPage; i >= 1; i--) {
            if (props.pageNumber - i > 1)
                pages.push(props.pageNumber - i)
        }
        pages.push(totalPages)
    }
    else {
        let i
        pages.push(1)
        if (props.pageNumber - props.nearPage > 2) {
            pages.push(0)
        }
        for (i = props.pageNumber - props.nearPage; i <= props.pageNumber + props.nearPage; i++) {
            if (i < totalPages && i > 1) {
                pages.push(i)
            }
        }
        if (props.pageNumber + props.nearPage < totalPages - 1) {
            pages.push(0)
        }
        pages.push(totalPages)
    }
    function pageNumber(){}

    const prevPage: number = props.pageNumber > 1
        ? props.pageNumber - 1
        : 1

    const nextPage: number = props.pageNumber < totalPages
        ? props.pageNumber + 1
        : totalPages

    return <>
    
        <div className={styles.gridPaginator}> 
        {props.hiddenNumberPage == true ? (<><button className={styles.pageBtn} onClick={() => props.onPageNumberChange(prevPage)}> <LeftIcon /> </button>
            <ul>
                {props.hiddenNumberPage && pages.map((i, index) => {
                    if (i != 0)
                        return <li key={index} data-current-page={i === props.pageNumber} onClick={() => { props.onPageNumberChange(i) }}> {i} </li>
                    else
                        return <li key={index} className={styles.disabled}>...</li>
                })}
            </ul>
            <button className={styles.pageBtn} onClick={() => props.onPageNumberChange(nextPage)}> <RightIcon /> </button></>):''
        }
        {props.hiddenCountRow == true ?
            (<span> Строк на странице:
                <Select defaultOption={{ displayName: "10", value: 10 }}
                    onSelect={(option) => { props.onNumberPerPageChange(Number(option.value)) }}
                    variant={"normal"}
                    options={[
                        { displayName: "10", value: 10 }, { displayName: "25", value: 25 }, { displayName: "50", value: 50 }
                    ]}>
                </Select>
            </span>) : null
        }  
        </div>
    
    </>
}

export default GridPaginator