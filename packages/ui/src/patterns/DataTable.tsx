import type { ReactNode, TableHTMLAttributes } from "react";
import { classNames } from "../primitives/classNames";

export type DataTableColumn<Row> = { key: string; header: ReactNode; cell: (row: Row) => ReactNode; align?: "start" | "center" | "end" };
export type DataTableProps<Row> = Omit<TableHTMLAttributes<HTMLTableElement>, "children"> & { caption: ReactNode; columns: readonly DataTableColumn<Row>[]; rows: readonly Row[]; rowKey: (row: Row, index: number) => string; empty?: ReactNode; responsiveLabel?: string; className?: string };

export function DataTable<Row>({ caption, columns, rows, rowKey, empty = "No results", responsiveLabel = "Scrollable table", className, ...props }: DataTableProps<Row>) {
  return <div className="eol-data-table-wrap" role="region" aria-label={responsiveLabel} tabIndex={0}><table {...props} className={classNames("eol-data-table", className)}><caption>{caption}</caption><thead><tr>{columns.map((column) => <th key={column.key} scope="col" data-align={column.align ?? "start"}>{column.header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={rowKey(row, index)}>{columns.map((column) => <td key={column.key} data-align={column.align ?? "start"}>{column.cell(row)}</td>)}</tr>) : <tr><td colSpan={columns.length} className="eol-data-table__empty">{empty}</td></tr>}</tbody></table></div>;
}
