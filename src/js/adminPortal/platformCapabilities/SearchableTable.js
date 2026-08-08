import React from 'react';

import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { CKEditor } from '@ckeditor/ckeditor5-react'
import SearchBar from "material-ui-search-bar";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";

const rows = [
    createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
    createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
    createData('Eclair', 262, 16.0, 24, 6.0),
    createData('Cupcake', 305, 3.7, 67, 4.3),
    createData('Gingerbread', 356, 16.0, 49, 3.9),
];

function createData(name, calories, fat, carbs, protein) {
    return { name, calories, fat, carbs, protein };
}

//https://mui.com/getting-started/installation/
class SearchableTable extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
    }

    getColumnTableRowJSX = () => {
        let response = [];
        this.props.columNames.forEach( columnName => {
            response.push(<TableCell align="right">{columnName}</TableCell>);
        });
        return response;
    }

    render() {
        return (
            <Paper>
                <SearchBar
                    // value={searched}
                    // onChange={(searchVal) => requestSearch(searchVal)}
                    // onCancelSearch={() => cancelSearch()}
                />
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                {this.getColumnTableRowJSX()}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.getColumnTableRowJSX()}
                            {rows.map((row) => (
                                <TableRow
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                    </TableCell>
                                    <TableCell align="right">{row.calories}</TableCell>
                                    <TableCell align="right">{row.fat}</TableCell>
                                    <TableCell align="right">{row.carbs}</TableCell>
                                    <TableCell align="right">{row.protein}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        );
    }

}

export default SearchableTable;
